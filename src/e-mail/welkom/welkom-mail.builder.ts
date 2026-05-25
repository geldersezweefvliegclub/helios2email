import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../../common/html.util';

@Injectable()
export class WelkomMailBuilder {
  buildHtml(input: { voornaam: string; inlogNaam: string }): string {
    const inhoud = {
      VOORNAAM: escapeHtml(input.voornaam),
      INLOG_NAAM: escapeHtml(input.inlogNaam),
    };
    return renderTemplate(loadTemplate('welkom.html'), inhoud);
  }
}
