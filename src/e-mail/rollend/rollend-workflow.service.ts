import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../../google/google.service';
import { AuditService } from '../../helios/services/audit.service';
import { LoginService } from '../../helios/services/login.service';
import { toYmd, ymdToDutchDisplay } from '../../common/date.util';
import { RollendMailBuilder } from './rollend-mail.builder';

/**
 * Service voor de rollend workflow, die dagelijks controleert of er in de daginfo audit log
 * wijzigingen op het veld ROLLENDMATERIEEL zijn gemaakt en stuurt vervolgens een mail naar
 * de commissaris rollend. Komt overeen met rollend.e-mail.php.
 */
@Injectable()
export class RollendWorkflowService {
  private readonly logger = new Logger(RollendWorkflowService.name);

  /**
   * Initialiseert de RollendWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly auditService: AuditService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: RollendMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit. Zoekt in de audit log van vandaag naar wijzigingen in de daginfo,
   * filtert op aanpassingen aan rollend materieel en stuurt per gewijzigde dag één mail met de
   * laatst bekende inhoud van het ROLLENDMATERIEEL veld.
   */
  async run(baseDate = new Date()): Promise<void> {
    const datum = toYmd(baseDate);
    this.logger.log(`Start rollend workflow, datum ${datum}`);

    // Inloggen bij Helios om de audit data op te kunnen halen
    await this.loginService.login();

    // Audit records van vandaag voor de oper_dagrapport tabel ophalen.
    // De AuditService levert VOOR en RESULTAAT al als geparseerde objecten aan.
    const auditRecords = await this.auditService.getDagrapportAudit(datum);
    if (auditRecords.length === 0) { // Er is geen dagrapport gewijzigd, dus geen mail sturen
      // Er is geen daginfo gewijzigd, dus geen mail sturen
      this.logger.log('Geen audit records voor oper_daginfo, geen rollend mail nodig');
      return;
    }

    // Per datum onthouden of we al een mail verstuurd hebben, zodat we maar 1 mail per dag versturen.
    // De laatste wijziging van die dag bevat de actuele tekst.
    const verstuurdeDatums = new Set<string>();

    for (const record of auditRecords) {
      const voor = record.VOOR;
      const resultaat = record.RESULTAAT;

      if (!resultaat) {
        continue;   // ongeldige audit record, kan niet verwerkt worden
      }

      // De dagrapport is wel gewijzigd, maar er is geen aanpassing gemaakt aan rollend materieel
      if (voor && voor.ROLLENDMATERIEEL === resultaat.ROLLENDMATERIEEL) {
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
        rollendMaterieel: resultaat.ROLLENDMATERIEEL || ''
      });

      // Bepaal het e-mailadres van de commissaris rollend, met default rollend@gezc.org
      const ontvanger = process.env.ROLLEND_EMAIL || 'rollend@gezc.org';

      // Verstuur de mail via de Google api
      await this.googleService.sendHtmlEmail({
        to: ontvanger,
        subject: `Rapportage rollend ${datumString}`,
        html
      });

      this.logger.log(`Rollend mail verstuurd naar ${ontvanger} voor datum ${resultaat.DATUM}`);
    }
  }
}
