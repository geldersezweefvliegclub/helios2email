import { Injectable } from '@nestjs/common';
import {escapeHtml, loadTemplate, renderTemplate} from "../common/html.util";

/**
 * Bouwer voor herinnering dagrapport e-mails, die HTML genereert voor dagrapport herinneringse-mails.
 */
@Injectable()
export class HerinneringDagrapportMailBuilder
{
  /**
   * Bouwt de HTML voor de herinnering dagrapport e-mail met voornaam, datum en diensttype.
   */
  buildHtml({
    voornaam,
    datumString,
    typeDienst
  }: {
    voornaam: string;
    datumString: string;
    typeDienst: string;
  }): string {
     // Vervang placeholders door echte waarden
     const inhoud =
       {
         VOORNAAM: escapeHtml(voornaam),
         DATUM_STRING: escapeHtml(datumString),
         TYPE_DIENST: typeDienst
       }
    return renderTemplate(loadTemplate('herinnering-dagrapport.html'), inhoud);
  }
}
