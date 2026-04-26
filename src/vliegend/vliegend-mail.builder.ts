import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../common/html.util';

/**
 * Bouwer voor vliegend e-mails, die HTML genereert voor de rapportage richting de commissaris vliegend.
 */
@Injectable()
export class VliegendMailBuilder {
  /**
   * Bouwt de HTML voor de vliegend mail met de datum van het dagrapport en de inhoud van het
   * VLIEGENDMATERIEEL veld. De vliegend materieel tekst is reeds genormaliseerd met <br> tags
   * voor nieuwe regels en wordt daarom als veilige HTML doorgegeven.
   */
  buildHtml(input: { datumString: string; vliegendMaterieel: string }): string {
    // Vervang placeholders door echte waarden
    const inhoud = {
      DATUM_STRING: escapeHtml(input.datumString),
      VLIEGEND_MATERIEEL: input.vliegendMaterieel
    };
    return renderTemplate(loadTemplate('vliegend.html'), inhoud);
  }
}
