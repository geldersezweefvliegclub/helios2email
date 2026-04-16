import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import { escapeHtml } from '../common/html.util';
import { StartlijstRecord } from '../helios/services/startlijst.service';

@Injectable()
export class LogboekMailBuilder
{

  buildHtml(input: { voornaam: string; datumString: string; vluchten: StartlijstRecord[] }): string {
    var html = fs.readFileSync(`${process.env.TEMPLATE_PATH}/logboek.html`, 'utf8');
    const base64img = fs.readFileSync('./templates/gezc-logo.png', {encoding: 'base64'});
    html = html.replaceAll(/\{base64img}/g, base64img);

    html = html.replaceAll(/\{VOORNAAM}/g, escapeHtml(input.voornaam));
    html = html.replaceAll(/\{DATUM_STRING}/g, escapeHtml(input.datumString));
    html = html.replaceAll(/\{LOGBOEK_REGELS}/g, this.buildRows(input.vluchten));
    html = html.replaceAll(/\{STYLE}/g, this.tableSyle());
    return html;
  }

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

  tableSyle(): string {
    return "style=\"border:1px solid #333; padding:6px 8px;\"";
  }
}
