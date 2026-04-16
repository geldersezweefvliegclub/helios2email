import { Injectable } from '@nestjs/common';
import { DaginfoRecord } from '../helios/services/daginfo.service';
import { DagrapportRecord } from '../helios/services/dagrapporten.service';
import { ymdToDutchDisplay } from '../common/date.util';
import { escapeHtml, nl2br } from '../common/html.util'
import fs from "node:fs";

@Injectable()
export class DagRapportMailBuilder
{
  buildDaginfoHtml(daginfo?: DaginfoRecord): string {
    if (!daginfo) {
      return '';
    }

    const bedrijf = [
      daginfo.DDWV ? 'DDWV' : '',
      daginfo.CLUB_BEDRIJF ? 'club bedrijf' : ''
    ].filter(Boolean).join(' en ');

    var html = fs.readFileSync(`${process.env.TEMPLATE_PATH}/dagrapport-info.html`, 'utf8');
    html = html.replaceAll(/\{VELD_OMS}/g, escapeHtml(daginfo.VELD_OMS));
    html = html.replaceAll(/\{BAAN_OMS}/g, escapeHtml(daginfo.BAAN_OMS));
    html = html.replaceAll(/\{STARTMETHODE_OMS}/g, escapeHtml(daginfo.STARTMETHODE_OMS));
    html = html.replaceAll(/\{BEDRIJF}/g, escapeHtml(bedrijf));
    html = html.replaceAll(/\{DIENSTEN}/g, nl2br(daginfo.DIENSTEN));
    return html;
  }

  buildDetailsHtml(records: DagrapportRecord[]): string {
    var template = fs.readFileSync(`${process.env.TEMPLATE_PATH}/dagrapport-details.html`, 'utf8');

    return records
      .map((record) => {
        const [datumPart, timePart = ''] = (record.LAATSTE_AANPASSING ?? '').split(' ');
        const hhmm = timePart.slice(0, 5);
        const displayDate = datumPart ? ymdToDutchDisplay(datumPart) : '';

        var html = template;
        html = html.replaceAll(/\{displayDate}/g, escapeHtml(displayDate));
        html = html.replaceAll(/\{hhmm}/g, escapeHtml(hhmm));
        html = html.replaceAll(/\{INGEVOERD}/g, escapeHtml(record.INGEVOERD));
        html = html.replaceAll(/\{VELD_OMS}/g, escapeHtml(record.VELD_OMS));
        html = html.replaceAll(/\{VLIEGENDMATERIEEL}/g, escapeHtml(record.VLIEGENDMATERIEEL));
        html = html.replaceAll(/\{ROLLENDMATERIEEL}/g, escapeHtml(record.ROLLENDMATERIEEL));
        html = html.replaceAll(/\{VERSLAG}/g, escapeHtml(record.VERSLAG));
        html = html.replaceAll(/\{INCIDENTEN}/g, escapeHtml(record.INCIDENTEN));

        return html;
      })
      .join('\n');
  }

  buildCompleteMail({
    dag,
    daginfo,
    dagrapporten
  }: {
    dag: string;
    daginfo?: DaginfoRecord;
    dagrapporten: DagrapportRecord[];
  }): string {
    var html = fs.readFileSync(`${process.env.TEMPLATE_PATH}/dagrapport.html`, 'utf8');
    const base64img = fs.readFileSync('./templates/gezc-logo.png', {encoding: 'base64'});
    html = html.replaceAll(/\{base64img}/g, base64img);

    const datum = ymdToDutchDisplay(dag);
    const daginfoHtml = this.buildDaginfoHtml(daginfo);
    const detailsHtml = this.buildDetailsHtml(dagrapporten);

    html = html.replaceAll(/\{DATUM}/g, escapeHtml(datum));
    html = html.replaceAll(/\{DAG_INFO}/g, daginfoHtml);
    html = html.replaceAll(/\{DAGRAPPORT_DETAILS}/g, detailsHtml);

    return html
  }
}
