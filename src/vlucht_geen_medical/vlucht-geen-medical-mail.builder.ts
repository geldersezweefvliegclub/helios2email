import { Injectable } from '@nestjs/common';
import {escapeHtml, loadTemplate, renderTemplate} from '../common/html.util';

/**
 * Bouwer voor vlucht geen medical e-mails, die HTML genereert voor waarschuwings e-mails.
 */
@Injectable()
export class VluchtGeenMedicalMailBuilder {
  /**
   * Bouwt de HTML voor de geen medical waarschuwings e-mail. Eenvoudig met alleen een VOORNAAM
   */
  buildHtml(voornaam: string): string {
    const inhoud =
       {
         VOORNAAM: escapeHtml(voornaam),
       }
    return renderTemplate(loadTemplate('vlucht-geen-medical.html'), inhoud);
  }
}
