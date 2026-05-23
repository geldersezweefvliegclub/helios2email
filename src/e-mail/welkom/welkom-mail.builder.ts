import { Injectable } from '@nestjs/common';
import { escapeHtml, loadTemplate, renderTemplate } from '../../common/html.util';

@Injectable()
export class WelkomMailBuilder {
  buildHtml(input: { voornaam: string; inlogNaam: string; wachtwoord: string }): string {
    const inhoud = {
      VOORNAAM: escapeHtml(input.voornaam),
      INLOG_NAAM: escapeHtml(input.inlogNaam),
      WACHTWOORD: escapeHtml(input.wachtwoord),
    };
    return renderTemplate(loadTemplate('welkom.html'), inhoud);
  }
}