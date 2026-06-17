import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../../common/html.util';
import { DboVliegdag } from './dbo-maandoverzicht-workflow.service';

const CELL  = 'style="border:1px solid #cccccc; padding:6px 10px;"';
const HCELL = 'style="border:1px solid #cccccc; padding:6px 10px; background-color:#FBD709; font-weight:bold; text-align:left;"';
const DCELL = 'style="border:1px solid #cccccc; padding:6px 10px; background-color:#FBD709; font-weight:bold;"';
const TCELL = 'style="border:1px solid #cccccc; padding:6px 10px; background-color:#f0f0f0; font-weight:bold;"';

@Injectable()
export class DboMaandoverzichtMailBuilder {

  buildHtml(input: { maandNaam: string; jaar: number; vliegdagen: DboVliegdag[] }): string {
    const inhoud = {
      MAAND: escapeHtml(`${input.maandNaam} ${input.jaar}`),
      OVERZICHT: this.buildTable(input.vliegdagen),
    };
    return renderTemplate(loadTemplate('dbo-maandoverzicht.html'), inhoud);
  }

  private buildTable(vliegdagen: DboVliegdag[]): string {
    const rows = vliegdagen.flatMap(dag => {
      const [jaar, maand, day] = dag.datum.split('-');
      const datumLabel = `${day}-${maand}-${jaar}`;

      // Day header row: date | Naam | Starts | Vliegtijd
      const headerRow = `
        <tr>
          <td ${DCELL}>${escapeHtml(datumLabel)}</td>
          <th ${HCELL}>Naam</th>
          <th ${HCELL}>Starts</th>
          <th ${HCELL}>Vliegtijd</th>
        </tr>`;

      const dataRows = dag.leden.length > 0
        ? dag.leden.map(lid => `
        <tr>
          <td ${CELL}></td>
          <td ${CELL}>${escapeHtml(lid.NAAM)}</td>
          <td ${CELL} style="text-align:center; border:1px solid #cccccc; padding:6px 10px;">${escapeHtml(lid.STARTS ?? 0)}</td>
          <td ${CELL} style="text-align:center; border:1px solid #cccccc; padding:6px 10px;">${escapeHtml(lid.VLIEGTIJD ?? '00:00')}</td>
        </tr>`)
        : [`
        <tr>
          <td ${CELL}></td>
          <td colspan="3" ${CELL} style="color:#888; font-style:italic; border:1px solid #cccccc; padding:6px 10px;">Geen DBO&apos;ers aanwezig</td>
        </tr>`];

      const totalStarts = dag.leden.reduce((sum, l) => sum + (l.STARTS ?? 0), 0);
      const totalMinutes = dag.leden.reduce((sum, l) => sum + this.toMinutes(l.VLIEGTIJD), 0);
      const totalRow = dag.leden.length > 0 ? `
        <tr>
          <td ${TCELL}></td>
          <td ${TCELL}>Totaal</td>
          <td ${TCELL} style="border:1px solid #cccccc; padding:6px 10px; background-color:#f0f0f0; font-weight:bold; text-align:center;">${totalStarts}</td>
          <td ${TCELL} style="border:1px solid #cccccc; padding:6px 10px; background-color:#f0f0f0; font-weight:bold; text-align:center;">${this.fromMinutes(totalMinutes)}</td>
        </tr>` : '';

      const spacerRow = `
        <tr>
          <td colspan="4" style="height:10px; padding:0; border:none;"></td>
        </tr>`;

      return [headerRow, ...dataRows, ...(totalRow ? [totalRow] : []), spacerRow];
    });

    return `<table style="border-collapse:collapse; width:100%; white-space:nowrap;">
      ${rows.join('\n')}
    </table>`;
  }

  private toMinutes(vliegtijd?: string): number {
    if (!vliegtijd) return 0;
    const [h, m] = vliegtijd.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  private fromMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
