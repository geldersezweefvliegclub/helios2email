import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import { AuditService } from '../helios/services/audit.service';
import { LoginService } from '../helios/services/login.service';
import { toYmd, ymdToDutchDisplay } from '../common/date.util';
import { VliegendMailBuilder } from './vliegend-mail.builder';

/**
 * Service voor de vliegend workflow, die dagelijks controleert of er in de daginfo audit log
 * wijzigingen op het veld VLIEGENDMATERIEEL zijn gemaakt en stuurt vervolgens een mail naar
 * de commissaris vliegend. Komt overeen met vliegend.email.php.
 */
@Injectable()
export class VliegendWorkflowService {
  private readonly logger = new Logger(VliegendWorkflowService.name);

  /**
   * Initialiseert de VliegendWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly auditService: AuditService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: VliegendMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit. Zoekt in de audit log van vandaag naar wijzigingen in de daginfo,
   * filtert op aanpassingen aan vliegend materieel en stuurt per gewijzigde dag één mail met de
   * laatst bekende inhoud van het VLIEGENDMATERIEEL veld.
   */
  async run(baseDate = new Date()): Promise<void> {
    const datum = toYmd(baseDate);
    this.logger.log(`Start vliegend workflow, datum ${datum}`);

    // Inloggen bij Helios om de audit data op te kunnen halen
    await this.loginService.login();

    // Audit records van vandaag voor de oper_daginfo tabel ophalen
    const auditRecords = await this.auditService.getDaginfoAudit(datum);
    if (auditRecords.length === 0) {
      // Er is geen daginfo gewijzigd, dus geen mail sturen
      this.logger.log('Geen audit records voor oper_daginfo, geen vliegend mail nodig');
      return;
    }

    // Per datum onthouden of we al een mail verstuurd hebben, zodat we maar 1 mail per dag versturen.
    // De laatste wijziging van die dag bevat de actuele tekst.
    const verstuurdeDatums = new Set<string>();

    for (const record of auditRecords) {
      // Audit RESULTAAT en VOOR zijn JSON strings; nieuwe regels eerst vervangen door <br> zodat
      // ze zonder problemen door JSON.parse heen komen en in de mail correct getoond worden.
      const voor = this.parseAuditPayload(record.VOOR);
      const resultaat = this.parseAuditPayload(record.RESULTAAT);

      if (!resultaat) {
        continue;   // ongeldige audit record, kan niet verwerkt worden
      }

      // De daginfo is wel gewijzigd, maar er is geen aanpassing gemaakt aan vliegend materieel
      if (voor && voor.VLIEGENDMATERIEEL === resultaat.VLIEGENDMATERIEEL) {
        continue;
      }

      // Geen datum bekend in het audit record, kunnen we ook niet mailen
      if (!resultaat.DATUM) {
        continue;
      }

      // Als we voor deze datum al een mail hebben verstuurd, sla deze record over.
      // De audit records lopen op datum/tijd dus we hebben dan al de meest recente versie gemaild.
      if (verstuurdeDatums.has(resultaat.DATUM)) {
        continue;
      }
      verstuurdeDatums.add(resultaat.DATUM);

      // Datum in Nederlandse weergave voor in het onderwerp en in de mail
      const datumString = ymdToDutchDisplay(resultaat.DATUM);

      // Bouw de e-mail inhoud op basis van het laatste resultaat
      const html = this.mailBuilder.buildHtml({
        datumString,
        vliegendMaterieel: resultaat.VLIEGENDMATERIEEL || ''
      });

      // Bepaal het e-mailadres van de commissaris vliegend, met default
      const ontvanger = process.env.VLIEGEND_EMAIL || 'vliegend@gezc.org';

      // Verstuur de mail via de Google api
      await this.googleService.sendHtmlEmail({
        to: ontvanger,
        subject: `Rapportage vliegend ${datumString}`,
        html
      });

      this.logger.log(`Vliegend mail verstuurd naar ${ontvanger} voor datum ${resultaat.DATUM}`);
    }
  }

  /**
   * Parseert de JSON payload van een audit record (VOOR of RESULTAAT) en vervangt nieuwe regels
   * door <br> tags zodat de inhoud later netjes in HTML weergegeven kan worden.
   */
  private parseAuditPayload(payload?: string): { DATUM?: string; VLIEGENDMATERIEEL?: string } | undefined {
    if (!payload) {
      return undefined;
    }

    try {
      const normalized = payload.trim().replace(/[\r\n]/g, '<br>');
      return JSON.parse(normalized) as { DATUM?: string; VLIEGENDMATERIEEL?: string };
    } catch (error) {
      this.logger.warn(`Verwerkingsfout audit payload: ${payload}`);
      return undefined;
    }
  }
}
