import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import { AuditService } from '../helios/services/audit.service';
import { DaginfoService } from '../helios/services/daginfo.service';
import { DagrapportenService } from '../helios/services/dagrapporten.service';
import { LedenService, LidRecord } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';
import { DagRapportMailBuilder } from './dagrapport-mail-builder.service';
import { toYmd, ymdToDutchDisplay } from '../common/date.util';

/**
 * Service voor het dagrapport workflow, die e-mails verstuurt met dagrapport informatie naar abonnees.
 */
@Injectable()
export class DagrapportWorkflowService
{
  private readonly logger = new Logger(DagrapportWorkflowService.name);

  /**
   * Initialiseert de DagrapportWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly ledenService: LedenService,
    private readonly auditService: AuditService,
    private readonly daginfoService: DaginfoService,
    private readonly dagrapportenService: DagrapportenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: DagRapportMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit om dagrapport e-mails te versturen
   * Datum is vandaag
   */
  async run(forDate = new Date()): Promise<void> {
    const today = toYmd(forDate);
    this.logger.log(`Start daginfo workflow, datum ${today}`);

    await this.loginService.login();

    // Ophalen wie zich hebben geabonneerd op het dagrapport. Dit staat in het profiel
    const ontvangers = await this.getSubscribers();
    if (ontvangers.length === 0) {
      this.logger.warn('Niemand heeft zich aangemeld');
      return;
    }

    // Dagrapport kan later geschreven worden (dus niet op de vliegdag).
    // Via de audit log kunnen we zien welke dagrapporten geschreven zijn
    // Dat kunnen meerdere dagrapporten zijn, en bovendien van verschillende datatums.
    // We moeten dus per datum een mail sturen, en daarin alle dagrapporten van die datum opnemen.
    const auditRecords = await this.auditService.getDagrapportAudit(today);
    if (auditRecords.length === 0) {
      this.logger.log('Geen audit records voor oper_dagrapporten today, niets te melden');
      return;
    }

    // Zoek uit om welke dagen het gaat
    const dagen = new Set<string>();
    for (const record of auditRecords) {
      try {
        const normalized = (record.RESULTAAT ?? '').trim().replace(/[\r\n]/g, '<br>');
        const parsed = JSON.parse(normalized) as { DATUM?: string };
        if (parsed.DATUM) {
          dagen.add(parsed.DATUM);
        }
      } catch (error) {
        this.logger.warn(`Verwerkingsfout audit RESULTAAT: ${record.RESULTAAT}`);
      }
    }

    // Voor iedere dag een dagrapport
    for (const dag of dagen) {
      await this.sendDagMailForDate(dag, ontvangers);
    }
  }

  /**
   * Verzendt dagrapport e-mail voor een specifieke datum naar alle leden die zich aangemeld hebben.
   */
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

    // Zorg dat email niet meerdere keren verstuurd wordt naar dezelfde ontvanger
    // Optineel kan email ook verstuurd worden naar AlwaysTo
    const uniqueRecipients = this.uniqueByEmail([
      ...ontvangers,
      ...alwaysTo.map((email) => ({ NAAM: email, EMAIL: email }))
    ]);

    const addressees = uniqueRecipients.map((r => r.EMAIL!));

    // Verstuur de mail via de Google api
    await this.googleService.sendHtmlEmail({
      bcc: addressees,
      subject,
      html
    });
    this.logger.log(`Dagrapport mail verstuurd naar ${addressees}, datum ${dag}`);

  }

  /**
   * Haalt alle abonnees op die dagrapport e-mails willen ontvangen (instructeurs en beheerders).
   */
  private async getSubscribers(): Promise<LidRecord[]> {
    const [instructeurs, beheerders] = await Promise.all([
      this.ledenService.getInstructeurs(),
      this.ledenService.getBeheerders()
    ]);

    return this.uniqueByEmail(
      [...instructeurs, ...beheerders].filter((lid) => lid.EMAIL_DAGINFO === true && !!lid.EMAIL)
    );
  }

  /**
   * Verwijdert duplicate records op basis van e-mailadres, waarbij het eerste record per e-mail behouden blijft.
   */
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
