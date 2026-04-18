import { Injectable, Logger } from '@nestjs/common';
import { toDutchLongDate, toYmd } from '../common/date.util';
import { GoogleService } from '../google/google.service';
import { LedenService } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';
import { StartlijstService } from '../helios/services/startlijst.service';
import { LogboekMailBuilder } from './logboek-mail.builder';
import { HeliosLidTypes} from "../helios/helios.types";
import { buildEmailErrorHtml} from "../common/error-mail.builder";

@Injectable()
export class LogboekWorkflowService
{
  private readonly logger = new Logger(LogboekWorkflowService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly startlijstService: StartlijstService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: LogboekMailBuilder
  ) {}

  async run(baseDate = new Date()): Promise<void> {
    const datum = toYmd(baseDate);
    const datumString = toDutchLongDate(baseDate);
    this.logger.log(`Start logbook workflow, datum ${datum}`);

    await this.loginService.login();

    const startlijst = await this.startlijstService.getStartsVoorDag(datum);
    if (!startlijst.length) {
      this.logger.log('Geen starts gevonden, geen dagelijks-logboek emails');
      return;
    }

    const aanwezigen = new Set<number>();
    for (const start of startlijst) {
      if (!start.STARTTIJD || !start.VLIEGER_ID) {
        continue;
      }
      aanwezigen.add(start.VLIEGER_ID);
      if (start.INZITTENDE_ID) {
        aanwezigen.add(start.INZITTENDE_ID);
      }
    }

    for (const lidId of aanwezigen) {
      const lid = await this.ledenService.getLidById(lidId);
      const to = this.resolvePrimaryRecipient(lid);
      if (!to) {
        const html = buildEmailErrorHtml("Logboek, geen email", `<p>${lid.NAAM} heeft gevlogen op ${datum}, maar heeft geen emailadres. Onderneem aktie</p>`);
        await this.googleService.sendHtmlEmail({
          to: process.env.ICT || 'ict@gezc.org',
          subject: 'Logboek, email ontbeekt',
          html
        });
        this.logger.warn(`${lid.NAAM} heeft geen email address. Mail naar ICT gestuurd`);
        continue;
      }

      const vluchten = await this.startlijstService.getLogboekVoorLid(lidId, datum);
      if (!vluchten.length) {
        continue;
      }

      const html = this.mailBuilder.buildHtml({
        voornaam: lid.VOORNAAM || lid.NAAM || '',
        datumString,
        vluchten
      });

      await this.googleService.sendHtmlEmail({
        to,
        subject: `Logboek ${datumString}`,
        html
      });

      this.logger.log(`Logbook email voor ${lid.NAAM} verstuurd naar ${to}`);
    }
  }

  private resolvePrimaryRecipient(lid: { LIDTYPE_ID?: number; EMAIL?: string }): string | undefined {
    const penningmeesterEmail = process.env.PENNINGMEESTER_EMAIL || 'penningmeester@gezc.org';
    const startadminEmail = process.env.STARTADMIN_EMAIL || 'startadmin@gezc.org';

    switch (lid.LIDTYPE_ID) {
      case HeliosLidTypes.ZUSTERCLUB:
      case HeliosLidTypes.RITTENKAARTHOUDER:
      {
        return penningmeesterEmail;
      }
      case HeliosLidTypes.NIEUW_LID:
      {
        return startadminEmail;
      }
      case HeliosLidTypes.OPROTKABEL:
      case HeliosLidTypes.PENNINGMEESTER:
      case HeliosLidTypes.SYSTEEM_ACCOUNT:
      {
        return penningmeesterEmail;
      }
      default:
        return lid.EMAIL;
    }
  }
}
