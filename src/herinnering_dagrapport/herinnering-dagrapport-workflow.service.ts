import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import {toDutchLongDate, toYmd} from '../common/date.util';
import { DienstenService, DienstRecord } from '../helios/services/diensten.service';
import { LedenService } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';
import { RoosterService } from '../helios/services/rooster.service';
import { HerinneringDagrapportMailBuilder } from './herinnering-dagrapport-mail.builder';

@Injectable()
export class HerinneringDagrapportWorkflowService
{
  private readonly logger = new Logger(HerinneringDagrapportWorkflowService.name);
  private readonly DDWV_VELDLEIDER = 1804;    // uit type tabel   1804 = startleider, maar veldleider op DDWV dagen
  private readonly OCHTEND_DDI = 1800;        // uit type tabel
  private readonly OCHTEND_INSTR = 1801;      // uit type tabel
  private readonly MIDDAG_DDI = 1805;         // uit type tabel
  private readonly MIDDAG_INSTR = 1806;       // uit type tabel


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
    this.logger.log(`Starting herinnering_daginfo workflow for ${datum}`);

    await this.loginService.login();

    const rooster = await this.roosterService.getRooster(datum);
    if (!rooster?.CLUB_BEDRIJF && !rooster?.DDWV) {
      this.logger.log('No club day and no DDWV day, skipping reminder email');
      return;
    }

    const diensten = await this.dienstenService.getDiensten(datum);
    if (diensten.length === 0) {
      this.logger.log('No diensten found, skipping reminder email');
      return;
    }

    const datumString = toDutchLongDate(forDate);

    for (const dienst of diensten) {
      if (!this.shouldSendReminder(rooster, dienst)) {
        continue;
      }

      if (!dienst.LID_ID) {
        this.logger.warn(`Skipping dienst without LID_ID: ${JSON.stringify(dienst)}`);
        continue;
      }

      const lid = await this.ledenService.getLidById(dienst.LID_ID);
      if (!lid?.EMAIL) {
        this.logger.warn(`Skipping lid ${dienst.LID_ID} without email address`);
        continue;
      }

      const html = this.mailBuilder.buildHtml({
        voornaam: lid.VOORNAAM || lid.NAAM || '',
        datumString,
        typeDienst: (dienst.TYPE_DIENST_ID == this.DDWV_VELDLEIDER ? 'veldleider' : dienst.TYPE_DIENST) || ''
      });

      const subject = `Je dienst van ${datumString}`;

      await this.googleService.sendHtmlEmail({
        to: lid.EMAIL,
        subject,
        html
      });

      this.logger.log(`Herinnering daginfo sent to ${lid.EMAIL}`);
    }
  }

  private shouldSendReminder(rooster: { CLUB_BEDRIJF?: boolean; DDWV?: boolean }, dienst: DienstRecord): boolean {
    const typeId = Number(dienst.TYPE_DIENST_ID);

    // deze functies kunnen dagrapport schrijven
    if (rooster.CLUB_BEDRIJF) {
      return [
         this.OCHTEND_DDI,
         this.OCHTEND_INSTR,
         this.MIDDAG_DDI,
         this.MIDDAG_INSTR
      ].includes(typeId);
    }

    // Voor DDWV is het de veldleider
    if (rooster.DDWV) {
      return typeId === this.DDWV_VELDLEIDER;
    }

    return false;
  }
}
