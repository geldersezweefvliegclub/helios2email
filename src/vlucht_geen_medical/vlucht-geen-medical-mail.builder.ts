import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import { escapeHtml } from '../common/html.util';

@Injectable()
export class VluchtGeenMedicalMailBuilder {
  buildHtml(voornaam: string): string {
    let html = fs.readFileSync(`${process.env.TEMPLATE_PATH}/vlucht-geen-medical.html`, 'utf8');
    const base64img = fs.readFileSync('./templates/gezc-logo.png', {encoding: 'base64'});

    html = html.replaceAll(/\{base64img}/g, base64img);
    html = html.replaceAll(/\{VOORNAAM}/g, escapeHtml(voornaam));
    return html;
  }
}
