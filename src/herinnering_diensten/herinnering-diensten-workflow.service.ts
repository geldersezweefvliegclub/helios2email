import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import { toDutchLongDate, toYmd } from '../common/date.util';
import { DienstenService } from '../helios/services/diensten.service';
import { LedenService } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';
import { RoosterService } from '../helios/services/rooster.service';
import { HerinneringDienstenMailBuilder } from './herinnering-diensten-mail.builder';
import {buildEmailErrorHtml} from "../common/error-mail.builder";

@Injectable()
export class HerinneringDienstenWorkflowService {
  private readonly logger = new Logger(HerinneringDienstenWorkflowService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly dienstenService: DienstenService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: HerinneringDienstenMailBuilder
  ) {}

  async run(baseDate = new Date()): Promise<void> {
    const forDate = new Date(baseDate);
    forDate.setDate(forDate.getDate() + 3);

    const datum = toYmd(forDate);
    this.logger.log(`Start herinnering_diensten workflow, datum ${datum}`);

    await this.loginService.login();

    const rooster = await this.roosterService.getRooster(datum);
    if (!rooster?.CLUB_BEDRIJF && !rooster?.DDWV) {
      this.logger.log('Geen clubdag en geen DDWV, geen email nodig');
      return;
    }

    const schema = rooster.CLUB_BEDRIJF ? this.getClubSchema() : this.getDdwvSchema();
    const diensten = await this.dienstenService.getDiensten(datum);
    if (diensten.length === 0) {
      this.logger.log('Geen ingeroosterde diensten gevonden, herinnering email kan niet verstuurd worden');
      return;
    }

    const datumString = toDutchLongDate(forDate);
    this.logger.log(`Sending dienst reminder email for ${datumString}`);

    for (const dienst of diensten) {
      if (!dienst.LID_ID) {
        this.logger.warn(`Dienst zonder lid, ${JSON.stringify(dienst)}`);
        continue;
      }

      const lid = await this.ledenService.getLidById(dienst.LID_ID);
      if (!lid?.EMAIL) {
        const html = buildEmailErrorHtml("Dienst herinnering, geen email", `<p>${lid.NAAM} heeft een ingeroosterde dienst op ${datum}, maar heeft geen emailadres. Onderneem aktie</p>`);
        await this.googleService.sendHtmlEmail({
          to: process.env.ICT || 'ict@gezc.org',
          subject: 'Dienst herinnering, email ontbeekt',
          html
        });

        this.logger.warn(`${lid.NAAM} heeft geen email address. Mail naar ICT gestuurd`);
        continue;
      }

      const html = this.mailBuilder.buildHtml({
        voornaam: lid.VOORNAAM || lid.NAAM || '',
        datumString,
        typeDienst: dienst.TYPE_DIENST || '',
        schema
      });

      const subject = `Je dienst voor ${datumString}`;

      await this.googleService.sendHtmlEmail({
        to: lid.EMAIL,
        subject,
        html
      });

      this.logger.log(`Herinnering diensten sent to ${lid.EMAIL}`);
    }
  }

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

  private getDdwvSchema(): string {
    return 'DDWV dagen beginnen we om 9:00 en eindigt de dienst om 15:00';
  }
}
