import { Injectable, Logger } from '@nestjs/common';
import { toDutchLongDate, toYmd } from '../common/date.util';
import { GoogleService } from '../google/google.service';
import { LedenService } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';
import { StartlijstService } from '../helios/services/startlijst.service';
import { LogboekMailBuilder } from './logboek-mail.builder';

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
    this.logger.log(`Starting logbook workflow for ${datum}`);

    await this.loginService.login();

    const startlijst = await this.startlijstService.getStartsVoorDag(datum);
    if (!startlijst.length) {
      this.logger.log('No starts found, skipping dagelijks-logboek emails');
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
        this.logger.warn(`Skipping lid ${lidId}; no recipient configured`);
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

      this.logger.log(`Logbook email sent for lid ${lidId} to ${to}`);
    }
  }

  private resolvePrimaryRecipient(lid: { LIDTYPE_ID?: number; EMAIL?: string }): string | undefined {
    const penningmeesterEmail = process.env.PENNINGMEESTER_EMAIL || 'penningmeester@gezc.org';
    const startadminEmail = process.env.STARTADMIN_EMAIL || 'startadmin@gezc.org';

    switch (lid.LIDTYPE_ID) {
      case 607:
      case 608:
        return lid.EMAIL || penningmeesterEmail;
      case 609:
        return startadminEmail;
      case 610:
      case 612:
      case 613:
        return penningmeesterEmail;
      default:
        return lid.EMAIL;
    }
  }
}
