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

@Injectable()
export class HerinneringDagrapportWorkflowService
{
  private readonly logger = new Logger(HerinneringDagrapportWorkflowService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly dienstenService: DienstenService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: HerinneringDagrapportMailBuilder
  ) {}

  async run(forDate = new Date()): Promise<void> {
    const datum = toYmd(forDate);
    this.logger.log(`Starti herinnering_daginfo workflow, datum ${datum}`);

    await this.loginService.login();

    const rooster = await this.roosterService.getRooster(datum);
    if (!rooster?.CLUB_BEDRIJF && !rooster?.DDWV) {
      this.logger.log('Geen clubdag en geen DDWV, geen email nodig');
      return;
    }

    const diensten = await this.dienstenService.getDiensten(datum);
    if (diensten.length === 0) {
      this.logger.log('Geen ingeroosterde diensten gevonden, herinnering email kan niet verstuurd worden');
      return;
    }

    const datumString = toDutchLongDate(forDate);

    for (const dienst of diensten) {
      if (!this.shouldSendReminder(rooster, dienst)) {
        continue;
      }

      if (!dienst.LID_ID) {
        this.logger.warn(`Dienst zonder lid, ${JSON.stringify(dienst)}`);
        continue;
      }

      const lid = await this.ledenService.getLidById(dienst.LID_ID);
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

      const html = this.mailBuilder.buildHtml({
        voornaam: lid.VOORNAAM || lid.NAAM || '',
        datumString,
        typeDienst: (dienst.TYPE_DIENST_ID == HeliosDienstenTypes.OCHTEND_STARTLEIDER ? 'veldleider' : dienst.TYPE_DIENST) || ''
      });

      const subject = `Je dienst van ${datumString}`;

      await this.googleService.sendHtmlEmail({
        to: lid.EMAIL,
        subject,
        html
      });

      this.logger.log(`Herinnering dagrapport verstuurd naar ${lid.NAAM}, (${lid.EMAIL})`);
    }
  }

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

    // Voor DDWV is het de veldleider
    if (rooster.DDWV) {
      return typeId === HeliosDienstenTypes.OCHTEND_STARTLEIDER;
    }

    return false;
  }
}
