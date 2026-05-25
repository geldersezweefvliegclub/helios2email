import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../../common/html.util';
import { LidRecord } from '../../helios/services/leden.service';

export interface LidMetTotalen {
  lid: LidRecord;
  startsMin2: number;
  startsMin1: number;
  startsHuidig: number;
}

@Injectable()
export class DtoVluchtenMailBuilder {
  buildHtml(input: {
    datum: string;
    jaarMin2: number;
    jaarMin1: number;
    jaarHuidig: number;
    dboLeden: LidMetTotalen[];
    solistLeden: LidMetTotalen[];
  }): string {
    const inhoud = {
      DATUM: escapeHtml(input.datum),
      JAAR_MIN2: String(input.jaarMin2),
      JAAR_MIN1: String(input.jaarMin1),
      JAAR_HUIDIG: String(input.jaarHuidig),
      DBO_RIJEN: this.buildRows(input.dboLeden, input.jaarHuidig),
      SOLIST_RIJEN: this.buildRows(input.solistLeden, input.jaarHuidig),
      STYLE: 'style="border:1px solid #333; padding:6px 8px;"',
    };
    return renderTemplate(loadTemplate('dto-vluchten.html'), inhoud);
  }

  private buildRows(leden: LidMetTotalen[], jaarHuidig: number): string {
    if (leden.length === 0) {
      return '<tr><td colspan="7" style="padding:6px 8px; font-style:italic;">Geen leden</td></tr>';
    }
    return leden
      .map(({ lid, startsMin2, startsMin1, startsHuidig }) => {
        const lidJaar = parseInt(lid.LIDNR?.substring(0, 4) ?? '0', 10);
        const grayMin2 = lidJaar >= jaarHuidig - 1;
        const grayMin1 = lidJaar >= jaarHuidig;
        const gray = 'style="border:1px solid #333; padding:6px 8px; background-color:#eeeeee;"';
        return `
        <tr>
          <td {STYLE}>${escapeHtml(lid.NAAM)}</td>
          <td {STYLE}>${escapeHtml(lid.LIDNR)}</td>
          <td {STYLE}>${escapeHtml(lid.EMAIL)}</td>
          <td {STYLE}>${escapeHtml(lid.MOBIEL ?? lid.TELEFOON)}</td>
          <td ${grayMin2 ? gray : '{STYLE}'}>${grayMin2 ? '' : startsMin2}</td>
          <td ${grayMin1 ? gray : '{STYLE}'}>${grayMin1 ? '' : startsMin1}</td>
          <td {STYLE}>${startsHuidig}</td>
        </tr>`;
      })
      .join('\n');
  }
}