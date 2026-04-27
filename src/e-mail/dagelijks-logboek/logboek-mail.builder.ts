import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate} from '../../common/html.util';
import { StartlijstRecord } from '../../helios/services/startlijst.service';

/**
 * Bouwer voor logboek e-mails, die HTML genereert voor dagelijkse logboek rapporten.
 */
@Injectable()
export class LogboekMailBuilder
{

  /**
   * Bouwt de HTML pagina voor de logboek e-mail met naam, datum en vluchten.
   */
  buildHtml(input: { voornaam: string; datumString: string; vluchten: StartlijstRecord[] }): string {
     // Vervang placeholders door echte waarden
     const inhoud =
       {
         VOORNAAM: escapeHtml(input.voornaam),
         DATUM_STRING: escapeHtml(input.datumString),
         LOGBOEK_REGELS: this.buildRows(input.vluchten),
         STYLE: this.tableSyle()
       }
    return renderTemplate(loadTemplate('logboek.html'), inhoud);
  }

  /**
   * Genereert HTML rijen voor elke vlucht in het logboek. Iedere rij is een vlucht
   */
  buildRows(vluchten: StartlijstRecord[]): string {
    return vluchten.map((vlucht) => {
      const d = (vlucht.DATUM || '').split('-');
      const displayDate = d.length === 3 ? `${d[2]}-${d[1]}-${d[0]}` : '';
      return `
        <tr>
          <td {STYLE}>${escapeHtml(displayDate)}</td>
          <td {STYLE}>${escapeHtml(vlucht.REG_CALL || vlucht.VLIEGTUIG || '')}</td>
          <td {STYLE}>${escapeHtml(vlucht.VELD)}</td>
          <td {STYLE}>${escapeHtml(vlucht.STARTMETHODE)}</td>
          <td {STYLE}>${escapeHtml(vlucht.VLIEGERNAAM)}</td>
          <td {STYLE}>${escapeHtml(vlucht.INZITTENDENAAM)}</td>
          <td {STYLE}>${escapeHtml(vlucht.STARTTIJD)}</td>
          <td {STYLE}>${escapeHtml(vlucht.LANDINGSTIJD)}</td>
          <td {STYLE}>${escapeHtml(vlucht.DUUR)}</td>
          <td {STYLE}>${escapeHtml(vlucht.OPMERKINGEN)}</td>
        </tr>`;
    }).join('\n');
  }

  /**
   * Geeft de CSS stijl voor tabel cellen terug.
   */
  tableSyle(): string {
    return "style=\"border:1px solid #333; padding:6px 8px;\"";
  }
}
