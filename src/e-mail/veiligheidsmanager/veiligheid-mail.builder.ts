import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../../common/html.util';

/**
 * Bouwer voor veiligheidsmanager e-mails, die HTML genereert voor de rapportage richting de veiligheidsmanager.
 */
@Injectable()
export class VeiligheidMailBuilder {
  /**
   * Bouwt de HTML voor de veiligheidsmanager mail met de datum van het dagrapport en de inhoud van het
   * INCIDENTEN veld. De incidenten tekst is reeds genormaliseerd met <br> tags
   * voor nieuwe regels en wordt daarom als veilige HTML doorgegeven.
   */
  buildHtml(input: { datumString: string; incidenten: string }): string {
    // Vervang placeholders door echte waarden
    const inhoud = {
      DATUM_STRING: escapeHtml(input.datumString),
      INCIDENTEN: input.incidenten
    };
    return renderTemplate(loadTemplate('veiligheidsmanager.html'), inhoud);
  }
}
