import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../../common/html.util';

/**
 * Bouwer voor medical verlopen e-mails, die HTML genereert voor de maandelijkse medical herinnering.
 */
@Injectable()
export class MedicalVerlopenMailBuilder {
  /**
   * Bouwt de HTML voor de medical verlopen herinnering met voornaam en de geldigheidsdatum van het medical.
   */
  buildHtml(input: { voornaam: string; medicalDatum: string }): string {
    // Vervang placeholders door echte waarden
    const inhoud = {
      VOORNAAM: escapeHtml(input.voornaam),
      MEDICAL_DATUM: escapeHtml(input.medicalDatum)
    };
    return renderTemplate(loadTemplate('medical-verlopen.html'), inhoud);
  }
}
