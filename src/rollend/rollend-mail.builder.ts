import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../common/html.util';

/**
 * Bouwer voor rollend e-mails, die HTML genereert voor de rapportage richting de commissaris rollend.
 */
@Injectable()
export class RollendMailBuilder {
  /**
   * Bouwt de HTML voor de rollend mail met de datum van het dagrapport en de inhoud van het
   * ROLLENDMATERIEEL veld. De rollend materieel tekst is reeds genormaliseerd met <br> tags
   * voor nieuwe regels en wordt daarom als veilige HTML doorgegeven.
   */
  buildHtml(input: { datumString: string; rollendMaterieel: string }): string {
    // Vervang placeholders door echte waarden
    const inhoud = {
      DATUM_STRING: escapeHtml(input.datumString),
      ROLLEND_MATERIEEL: input.rollendMaterieel
    };
    return renderTemplate(loadTemplate('rollend.html'), inhoud);
  }
}
