import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../../google/google.service';
import { toDutchLongDate, toYmd } from '../../common/date.util';
import { DienstenService } from '../../helios/services/diensten.service';
import { LedenService } from '../../helios/services/leden.service';
import { LoginService } from '../../helios/services/login.service';
import { RoosterService } from '../../helios/services/rooster.service';
import { HerinneringDienstenMailBuilder } from './herinnering-diensten-mail.builder';
import {buildEmailErrorHtml} from "../../common/error-mail.builder";

/**
 * Service voor het herinnering diensten workflow, die e-mails verstuurt als herinnering voor diensten 3 dagen vooruit.
 */
@Injectable()
export class HerinneringDienstenWorkflowService {
  private readonly logger = new Logger(HerinneringDienstenWorkflowService.name);

  /**
   * Initialiseert de HerinneringDienstenWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly dienstenService: DienstenService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: HerinneringDienstenMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit om herinnering e-mails te versturen voor diensten 3 dagen in de toekomst.
   */
  async run(baseDate = new Date()): Promise<void> {
    const forDate = new Date(baseDate);
    forDate.setDate(forDate.getDate() + 3);

    const datum = toYmd(forDate);
    this.logger.log(`Start herinnering_diensten workflow, datum ${datum}`);

    await this.loginService.login();

    // Haal het rooster op voor de datum
    const rooster = await this.roosterService.getRooster(datum);

    // Als er geen vliegdag is, is een e-mail niet nodig
    if (!rooster?.CLUB_BEDRIJF && !rooster?.DDWV) {
      this.logger.log('Geen clubdag en geen DDWV, geen e-mail nodig');
      return;
    }

    // Schema voor de diensten. Er is een verschil tussen clubdagen en DDWV dagen
    const schema = rooster.CLUB_BEDRIJF ? this.getClubSchema() : this.getDdwvSchema();
    const diensten = await this.dienstenService.getDiensten(datum);
    if (diensten.length === 0) {
      this.logger.log('Geen ingeroosterde diensten gevonden, herinnering e-mail kan niet verstuurd worden');
      return;
    }

    // maak er een leesbare datum van
    const datumString = toDutchLongDate(forDate);
    this.logger.log(`Sending dienst reminder email for ${datumString}`);

    for (const dienst of diensten) {
      // Dit zou niet mogen gebeuren, maar als we geen lid hebben, kunnen we ook geen mail sturen
      if (!dienst.LID_ID) {
        this.logger.warn(`Dienst zonder lid, ${JSON.stringify(dienst)}`);
        continue;
      }

      const lid = await this.ledenService.getLidById(dienst.LID_ID);
      // Als er geen e-mail adres bekend is, kunnen we ook geen e-mail sturen. Informeer ICT, actie is nodig
      if (!lid?.EMAIL) {
        const html = buildEmailErrorHtml("Dienst herinnering, geen e-mail", `<p>${lid.NAAM} heeft een ingeroosterde dienst op ${datum}, maar heeft geen emailadres. Onderneem aktie</p>`);
        await this.googleService.sendHtmlEmail({
          to: process.env.ICT || 'ict@gezc.org',
          subject: 'Dienst herinnering, e-mail ontbeekt',
          html
        });

        this.logger.warn(`${lid.NAAM} heeft geen email address. Mail naar ICT gestuurd`);
        continue;
      }

      // Bouw de e-mail inhoud
      const html = this.mailBuilder.buildHtml({
        voornaam: lid.VOORNAAM || lid.NAAM || '',
        datumString,
        typeDienst: dienst.TYPE_DIENST || '',
        schema
      });

      const subject = `Je dienst voor ${datumString}`;

      // Verstuur de mail via de Google api
      await this.googleService.sendHtmlEmail({
        to: lid.EMAIL,
        subject,
        html
      });

      this.logger.log(`Herinnering diensten sent to ${lid.EMAIL}`);
    }
  }

  /**
   * Geeft het schema string terug voor club bedrijf diensten.
   */
  private getClubSchema(): string {
    return [
      'De ochtenddienst vangt aan om 8:30 en wordt, voor de startleider en lierist, om 14:00 overgedragen naar de middagploeg.',
      'Voor instructeurs is het volgende schema van toepassing:',
      '<ul>',
      '<li>Ochtend DDI: 08:30 – 16:00</li>',
      '<li>Overlap (DBO): 10:30 – 18:00</li>',
      '<li>Middag DDI: 14:00 – Einde</li>',
      '</ul>'
    ].join('');
  }

  /**
   * Geeft het schema string terug voor DDWV diensten.
   */
  private getDdwvSchema(): string {
    return 'DDWV dagen beginnen we om 9:00 en eindigt de dienst om 15:00';
  }
}
