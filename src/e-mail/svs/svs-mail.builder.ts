import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../../common/html.util';
import { StartlijstRecord } from '../../helios/services/startlijst.service';
import { ymdToDutchDisplay } from '../../common/date.util';

/**
 * Bouwer voor SVS e-mails, die HTML genereert voor de rapportage richting de SVS beheerder
 * met een tabel van sleepstarts vanaf Terlet.
 */
@Injectable()
export class SvsMailBuilder {
  /**
   * Bouwt de HTML voor de SVS mail met de datum en een tabel van sleepstarts.
   */
  buildHtml(input: { datumString: string; starts: StartlijstRecord[] }): string {
    // Vervang placeholders door echte waarden
    const inhoud = {
      DATUM_STRING: escapeHtml(input.datumString),
      START_REGELS: this.buildRows(input.starts),
      STYLE: this.tableStyle()
    };
    return renderTemplate(loadTemplate('svs.html'), inhoud);
  }

  /**
   * Genereert HTML rijen voor elke sleepstart in de tabel. Iedere rij is één start.
   */
  private buildRows(starts: StartlijstRecord[]): string {
    return starts
      .map((start) => {
        const datum = start.DATUM ? ymdToDutchDisplay(start.DATUM) : '';
        return `
        <tr>
          <td {STYLE}>${escapeHtml(datum)}</td>
          <td {STYLE}>${escapeHtml(start.REG_CALL)}</td>
          <td {STYLE}>${escapeHtml(start.SLEEPKIST)}</td>
          <td {STYLE}>${escapeHtml(start.SLEEP_HOOGTE)}</td>
          <td {STYLE}>${escapeHtml(start.VLIEGERNAAM_LID || start.VLIEGERNAAM)}</td>
          <td {STYLE}>${escapeHtml(start.INZITTENDENAAM_LID || start.INZITTENDENAAM)}</td>
          <td {STYLE}>${escapeHtml(start.STARTTIJD)}</td>
          <td {STYLE}>${escapeHtml(start.OPMERKINGEN)}</td>
        </tr>`;
      })
      .join('\n');
  }

  /**
   * Geeft de CSS stijl voor tabel cellen terug.
   */
  private tableStyle(): string {
    return 'style="border:1px solid #333; padding:6px 8px;"';
  }
}
