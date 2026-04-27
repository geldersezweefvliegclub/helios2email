import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../../common/html.util';
import { StartlijstRecord } from '../../helios/services/startlijst.service';
import { LidRecord } from '../../helios/services/leden.service';
import { ymdToDutchDisplay } from '../../common/date.util';

/**
 * Bouwer voor penningmeester e-mails, die HTML genereert met een tabel van alle vluchten
 * van niet-leden inclusief alle details van de vlucht en hun lidtype/zusterclub.
 */
@Injectable()
export class PenningmeesterMailBuilder {
  /**
   * Bouwt de HTML voor de penningmeester mail met de datum en een tabel van vluchten.
   * vliegerById bevat per VLIEGER_ID het bijbehorende lid-record zodat de tabel
   * ook LIDTYPE en ZUSTERCLUB per vlieger kan tonen.
   */
  buildHtml(input: {
    datumString: string;
    vluchten: StartlijstRecord[];
    vliegerById: Map<number, LidRecord>;
  }): string {
    // Vervang placeholders door echte waarden
    const inhoud = {
      DATUM_STRING: escapeHtml(input.datumString),
      AANTAL: String(input.vluchten.length),
      VLUCHT_REGELS: this.buildRows(input.vluchten, input.vliegerById),
      STYLE: this.tableStyle()
    };
    return renderTemplate(loadTemplate('penningmeester.html'), inhoud);
  }

  /**
   * Genereert HTML rijen voor elke vlucht in de tabel. Iedere rij bevat alle details
   * van de vlucht en, indien de VLIEGER_ID bekend is, ook het LIDTYPE en de ZUSTERCLUB
   * van de betreffende vlieger.
   */
  private buildRows(vluchten: StartlijstRecord[], vliegerById: Map<number, LidRecord>): string {
    return vluchten
      .map((vlucht) => {
        const datum = vlucht.DATUM ? ymdToDutchDisplay(vlucht.DATUM) : '';
        const vlieger = vlucht.VLIEGERNAAM_LID || vlucht.VLIEGERNAAM || '';
        const inzittende = vlucht.INZITTENDENAAM_LID || vlucht.INZITTENDENAAM || '';

        // Lid-record opzoeken zodat we LIDTYPE en ZUSTERCLUB in de tabel kunnen tonen
        const lid = typeof vlucht.VLIEGER_ID === 'number' ? vliegerById.get(vlucht.VLIEGER_ID) : undefined;
        const lidtype = lid?.LIDTYPE || '';
        const zusterclub = lid?.ZUSTERCLUB || '';

        return `
        <tr>
          <td {STYLE}>${escapeHtml(datum)}</td>
          <td {STYLE}>${escapeHtml(vlucht.REG_CALL || vlucht.VLIEGTUIG || '')}</td>
          <td {STYLE}>${escapeHtml(vlucht.VELD)}</td>
          <td {STYLE}>${escapeHtml(vlucht.STARTMETHODE)}</td>
          <td {STYLE}>${escapeHtml(vlieger)}</td>
          <td {STYLE}>${escapeHtml(lidtype)}</td>
          <td {STYLE}>${escapeHtml(zusterclub)}</td>
          <td {STYLE}>${escapeHtml(inzittende)}</td>
          <td {STYLE}>${escapeHtml(vlucht.STARTTIJD)}</td>
          <td {STYLE}>${escapeHtml(vlucht.LANDINGSTIJD)}</td>
          <td {STYLE}>${escapeHtml(vlucht.DUUR)}</td>
          <td {STYLE}>${escapeHtml(vlucht.OPMERKINGEN)}</td>
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
