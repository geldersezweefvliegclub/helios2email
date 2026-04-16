import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import { AuditService } from '../helios/services/audit.service';
import { DaginfoService } from '../helios/services/daginfo.service';
import { DagrapportenService } from '../helios/services/dagrapporten.service';
import { LedenService, LidRecord } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';
import { DagRapportMailBuilder } from './dagrapport-mail-builder.service';
import { toYmd, ymdToDutchDisplay } from '../common/date.util';

@Injectable()
export class DagrapportWorkflowService
{
  private readonly logger = new Logger(DagrapportWorkflowService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly ledenService: LedenService,
    private readonly auditService: AuditService,
    private readonly daginfoService: DaginfoService,
    private readonly dagrapportenService: DagrapportenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: DagRapportMailBuilder
  ) {}

  async run(forDate = new Date()): Promise<void> {
    const today = toYmd(forDate);
    this.logger.log(`Starting daginfo workflow for ${today}`);

    await this.loginService.login();

    const ontvangers = await this.getSubscribers();
    if (ontvangers.length === 0) {
      this.logger.warn('No subscribers found');
      return;
    }

    const auditRecords = await this.auditService.getDagrapportAudit(today);
    if (auditRecords.length === 0) {
      this.logger.log('No audit records for oper_dagrapporten today, nothing to send');
      return;
    }

    const dagen = new Set<string>();
    for (const record of auditRecords) {
      try {
        const normalized = (record.RESULTAAT ?? '').trim().replace(/[\r\n]/g, '<br>');
        const parsed = JSON.parse(normalized) as { DATUM?: string };
        if (parsed.DATUM) {
          dagen.add(parsed.DATUM);
        }
      } catch (error) {
        this.logger.warn(`Could not parse audit RESULTAAT: ${record.RESULTAAT}`);
      }
    }

    for (const dag of dagen) {
      await this.sendDagMailForDate(dag, ontvangers);
    }
  }

  private async sendDagMailForDate(dag: string, ontvangers: LidRecord[]): Promise<void> {
    const daginfoResponse = await this.daginfoService.getDaginfo(dag);
    const dagrapportResponse = await this.dagrapportenService.getDagrapporten(dag);

    const daginfo = daginfoResponse.dataset?.[0];
    const dagrapporten = dagrapportResponse.dataset ?? [];
    const html = this.mailBuilder.buildCompleteMail({ dag, daginfo, dagrapporten });

    const subject = `Dagrapport van ${ymdToDutchDisplay(dag)}`;

    const alwaysTo = (process.env.DAGINFO_ALWAYS_TO ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const uniqueRecipients = this.uniqueByEmail([
      ...ontvangers,
      ...alwaysTo.map((email) => ({ NAAM: email, EMAIL: email }))
    ]);

    const addressees = uniqueRecipients.map((r => r.EMAIL!));

    await this.googleService.sendHtmlEmail({
      bcc: addressees,
      subject,
      html
    });
    this.logger.log(`Daginfo mail sent to ${addressees} for ${dag}`);

  }

  private async getSubscribers(): Promise<LidRecord[]> {
    const [instructeurs, beheerders] = await Promise.all([
      this.ledenService.getInstructeurs(),
      this.ledenService.getBeheerders()
    ]);

    return this.uniqueByEmail(
      [...instructeurs, ...beheerders].filter((lid) => lid.EMAIL_DAGINFO === true && !!lid.EMAIL)
    );
  }

  private uniqueByEmail(records: LidRecord[]): LidRecord[] {
    const map = new Map<string, LidRecord>();
    for (const record of records) {
      const email = record.EMAIL?.trim().toLowerCase();
      if (!email || map.has(email)) {
        continue;
      }
      map.set(email, record);
    }
    return [...map.values()];
  }
}
