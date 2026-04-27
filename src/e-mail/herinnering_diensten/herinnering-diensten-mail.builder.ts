import { Injectable } from '@nestjs/common';
import {escapeHtml, loadTemplate, renderTemplate} from '../../common/html.util';

/**
 * Bouwer voor herinnering diensten e-mails, die HTML genereert voor diensten herinneringse-mails.
 */
@Injectable()
export class HerinneringDienstenMailBuilder {
  /**
   * Bouwt de HTML voor de herinnering diensten e-mail met voornaam, datum, diensttype en schema.
   */
  buildHtml({
    voornaam,
    datumString,
    typeDienst,
    schema
  }: {
    voornaam: string;
    datumString: string;
    typeDienst: string;
    schema: string;
  }): string {
     // Vervang placeholders door echte waarden
    const inhoud =
       {
         VOORNAAM: escapeHtml(voornaam),
         DATUM_STRING: escapeHtml(datumString),
         TYPE_DIENST: typeDienst,
         SCHEMA: schema
       }
    return renderTemplate(loadTemplate('herinnering-diensten.html'), inhoud);
  }
}
