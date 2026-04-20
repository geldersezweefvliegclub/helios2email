import { Injectable } from '@nestjs/common';
import { DaginfoRecord } from '../helios/services/daginfo.service';
import { DagrapportRecord } from '../helios/services/dagrapporten.service';
import { ymdToDutchDisplay } from '../common/date.util';
import { escapeHtml, nl2br, renderTemplate, loadTemplate } from '../common/html.util'

/**
 * Bouwer voor dagrapport e-mails, die HTML genereert voor dagelijkse rapporten.
 */
@Injectable()
export class DagRapportMailBuilder
{
  /**
   * Bouwt HTML voor de daginfo, de eerste sectie van het dagrapport.
   */
  buildDaginfoHtml(daginfo?: DaginfoRecord): string {
    if (!daginfo) {
      return '';
    }

    // Type vliegbedrijf in tekst
    const bedrijf = [
      daginfo.DDWV ? 'DDWV' : '',
      daginfo.CLUB_BEDRIJF ? 'club bedrijf' : ''
    ].filter(Boolean).join(' en ');


    // Vervang placeholders door echte waarden
    const inhoud =
      {
         VELD_OMS: escapeHtml(daginfo.VELD_OMS),
         BAAN_OMS: escapeHtml(daginfo.BAAN_OMS),
         STARTMETHODE_OMS: escapeHtml(daginfo.STARTMETHODE_OMS),
         BEDRIJF: escapeHtml(bedrijf),
         DIENSTEN: nl2br(daginfo.DIENSTEN)
      }
      return renderTemplate(loadTemplate('dagrapport-info.html'), inhoud);
  }

  /**
   * Bouwt HTML voor de voor de dagrapporten. Een dag kan meer dan 1 dagrapport hebben
   */
  buildDetailsHtml(records: DagrapportRecord[]): string {
    var template = loadTemplate('/dagrapport-details.html');

    return records
      .map((record) => {
        const [datumPart, timePart = ''] = (record.LAATSTE_AANPASSING ?? '').split(' ');
        const hhmm = timePart.slice(0, 5);
        const displayDate = datumPart ? ymdToDutchDisplay(datumPart) : '';

         // Vervang placeholders door echte waarden
        const inhoud =
        {
           displayDate: escapeHtml(displayDate),
           hhmm: escapeHtml(hhmm),
           INGEVOERD: escapeHtml(record.INGEVOERD),
           VELD_OMS: escapeHtml(record.VELD_OMS),
           VLIEGENDMATERIEEL: escapeHtml(record.VLIEGENDMATERIEEL),
           ROLLENDMATERIEEL: escapeHtml(record.ROLLENDMATERIEEL),
           VERSLAG: escapeHtml(record.VERSLAG),
           INCIDENTEN: escapeHtml(record.INCIDENTEN)

        }
        return renderTemplate(template, inhoud)
      }).join('\n');
  }

  /**
   * Bouwt de volledige HTML e-mail voor het dagrapport met daginfo en details.
   */
  buildCompleteMail({
    dag,
    daginfo,
    dagrapporten
  }: {
    dag: string;
    daginfo?: DaginfoRecord;
    dagrapporten: DagrapportRecord[];
  }): string {

    const datum = ymdToDutchDisplay(dag);

     // Vervang placeholders door echte waarden die in de hoofdtemplate worden gebruikt
    const inhoud =
    {
       DATUM: escapeHtml(datum),
       DAG_INFO: this.buildDaginfoHtml(daginfo),
       DAGRAPPORT_DETAILS: this.buildDetailsHtml(dagrapporten)
    }
    return renderTemplate(loadTemplate('dagrapport.html'), inhoud);
  }
}
