import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import {toDutchLongDate, toYmd} from '../common/date.util';
import { DienstenService, DienstRecord } from '../helios/services/diensten.service';
import { LedenService } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';
import { RoosterService } from '../helios/services/rooster.service';
import { HerinneringDagrapportMailBuilder } from './herinnering-dagrapport-mail.builder';
import { HeliosDienstenTypes } from "../helios/helios.types";
import {buildEmailErrorHtml} from "../common/error-mail.builder";

/**
 * Service voor het herinnering dagrapport workflow, die e-mails verstuurt als herinnering aan leden met ingeroosterde diensten.
 */
@Injectable()
export class HerinneringDagrapportWorkflowService
{
  private readonly logger = new Logger(HerinneringDagrapportWorkflowService.name);

  /**
   * Initialiseert de HerinneringDagrapportWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly dienstenService: DienstenService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: HerinneringDagrapportMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit om herinnering e-mails te versturen voor ingeroosterde diensten op een gegeven datum.
   */
  async run(forDate = new Date()): Promise<void> {
    const datum = toYmd(forDate);
    this.logger.log(`Starti herinnering_daginfo workflow, datum ${datum}`);

    await this.loginService.login();

    // Haal het rooster op voor de datum
    const rooster = await this.roosterService.getRooster(datum);

    // Als er geen vliegdag is, is een email niet nodig
    if (!rooster?.CLUB_BEDRIJF && !rooster?.DDWV) {
      this.logger.log('Geen clubdag en geen DDWV, geen email nodig');
      return;
    }

    // Ophalen wie er dienst heeft op de datum
    const diensten = await this.dienstenService.getDiensten(datum);
    if (diensten.length === 0) {
      this.logger.log('Geen ingeroosterde diensten gevonden, herinnering email kan niet verstuurd worden');
      return;
    }

    const datumString = toDutchLongDate(forDate);

    // Doorloop over de diensten en stuur een herinnering email naar degene die een dienst heeft, maar alleen als het een dienst is waarbij een dagrapport geschreven kan worden (dus veldleider of instructeur)
    for (const dienst of diensten) {
      // Alleen instructeurs krijgen een herinnering
      if (!this.shouldSendReminder(rooster, dienst)) {
        continue;
      }

      // Dit zou niet mogen gebeuren, maar als we geen lid hebben, kunnen we ook geen mail sturen
      if (!dienst.LID_ID) {
        this.logger.warn(`Dienst zonder lid, ${JSON.stringify(dienst)}`);
        continue;
      }

      // Ophalen lid omdat we emai adres nodig hebben
      const lid = await this.ledenService.getLidById(dienst.LID_ID);

      // Als er geen email adres bekend is, kunnen we ook geen email sturen. Informeer ICT, actie is nodig
      if (!lid?.EMAIL) {
        const html = buildEmailErrorHtml("Dagrapport herinnering, geen email", `<p>${lid.NAAM} heeft een ingeroosterde dienst op ${datum}, maar heeft geen emailadres. Onderneem aktie</p>`);
        await this.googleService.sendHtmlEmail({
          to: process.env.ICT || 'ict@gezc.org',
          subject: 'Dagrapport herinnering, email ontbeekt',
          html
        });

        this.logger.warn(`${lid.NAAM} heeft geen email address. Mail naar ICT gestuurd`);
        continue;
      }

      // Maak de inhoud van de email
      const html = this.mailBuilder.buildHtml({
        voornaam: lid.VOORNAAM || lid.NAAM || '',
        datumString,
        typeDienst: (dienst.TYPE_DIENST_ID == HeliosDienstenTypes.OCHTEND_STARTLEIDER ? 'Veldleider' : dienst.TYPE_DIENST) || ''
      });

      const subject = `Je dienst van ${datumString}`;

      // Verstuur de mail via de Google api
      await this.googleService.sendHtmlEmail({
        to: lid.EMAIL,
        subject,
        html
      });

      this.logger.log(`Herinnering dagrapport verstuurd naar ${lid.NAAM}, (${lid.EMAIL})`);
    }
  }

  /**
   * Bepaalt of een herinnering e-mail voor een dienst moet worden verstuurd
   * Alleen instructeurs krijgen een verzoek om het dagrapport in te vullen
   * Op DDWV dagen, is de veldleider degene die het dagrapport schrijft
   */
  private shouldSendReminder(rooster: { CLUB_BEDRIJF?: boolean; DDWV?: boolean }, dienst: DienstRecord): boolean {
    const typeId = Number(dienst.TYPE_DIENST_ID);

    // deze functies kunnen dagrapport schrijven
    if (rooster.CLUB_BEDRIJF) {
      return [
         HeliosDienstenTypes.OCHTEND_DDI,
         HeliosDienstenTypes.OVERLAP_INSTRUCTEUR,
         HeliosDienstenTypes.MIDDAG_INSTRUCTEUR,
         HeliosDienstenTypes.MIDDAG_DDI
      ].includes(typeId);
    }

    // Voor DDWV is het de veldleider die een dagrapport moet schrijven
    if (rooster.DDWV) {
      return typeId === HeliosDienstenTypes.OCHTEND_STARTLEIDER;
    }

    return false;
  }
}
