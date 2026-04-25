import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import {escapeHtml, loadTemplate, renderTemplate} from '../common/html.util';

/**
 * Bouwer voor geen bevoegdheid e-mails.
 */
@Injectable()
export class VluchtBevoegheidMailBuilder {
  buildHtml(input: { voornaam: string; callsigns: string }): string {
    const inhoud =
       {
         VOORNAAM: escapeHtml(input.voornaam),
         CALLSIGNS: escapeHtml(input.callsigns),
       }
    return renderTemplate(loadTemplate('vlucht-bevoegheid.html'), inhoud);
  }
}
