import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../../common/html.util';
import { StartlijstRecord } from '../../helios/services/startlijst.service';
import { ymdToDutchDisplay } from '../../common/date.util';

// Twee intro varianten, afhankelijk van of het een puur DDWV of een gecombineerde dag is.
const DDWV_INTRO = 'Het betreft een DDWV dag, vandaar dat u dit overzicht krijgt.';
const COMBI_INTRO =
  'Het betreft een gecombineerde DDWV dag, met gelijktijdig een club bedrijf. ' +
  'In onderstaand overzicht ziet u alleen de vluchten die door DDWV leden zijn gemaakt.';

/**
 * Bouwer voor DDWV e-mails, die HTML genereert met een tabel van vluchten van een DDWV dag.
 */
@Injectable()
export class DdwvMailBuilder {
  /**
   * Bouwt de HTML voor de DDWV mail met de datum, de juiste intro en een tabel van vluchten.
   */
  buildHtml(input: { datumString: string; isCombiDag: boolean; starts: StartlijstRecord[] }): string {
    // Vervang placeholders door echte waarden
    const inhoud = {
      DATUM_STRING: escapeHtml(input.datumString),
      INTRO: escapeHtml(input.isCombiDag ? COMBI_INTRO : DDWV_INTRO),
      AANTAL: String(input.starts.length),
      VLUCHT_REGELS: this.buildRows(input.starts),
      STYLE: this.tableStyle()
    };
    return renderTemplate(loadTemplate('ddwv.html'), inhoud);
  }

  /**
   * Genereert HTML rijen voor elke vlucht in de tabel. Iedere rij bevat de relevante details.
   */
  private buildRows(starts: StartlijstRecord[]): string {
    return starts
      .map((start) => {
        const datum = start.DATUM ? ymdToDutchDisplay(start.DATUM) : '';
        const vlieger = start.VLIEGERNAAM_LID || start.VLIEGERNAAM || '';
        const inzittende = start.INZITTENDENAAM_LID || start.INZITTENDENAAM || '';
        return `
        <tr>
          <td {STYLE}>${escapeHtml(datum)}</td>
          <td {STYLE}>${escapeHtml(start.REG_CALL || start.VLIEGTUIG || '')}</td>
          <td {STYLE}>${escapeHtml(start.VELD)}</td>
          <td {STYLE}>${escapeHtml(start.STARTMETHODE)}</td>
          <td {STYLE}>${escapeHtml(start.SLEEP_HOOGTE)}</td>
          <td {STYLE}>${escapeHtml(vlieger)}</td>
          <td {STYLE}>${escapeHtml(inzittende)}</td>
          <td {STYLE}>${escapeHtml(start.STARTTIJD)}</td>
          <td {STYLE}>${escapeHtml(start.LANDINGSTIJD)}</td>
          <td {STYLE}>${escapeHtml(start.DUUR)}</td>
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
