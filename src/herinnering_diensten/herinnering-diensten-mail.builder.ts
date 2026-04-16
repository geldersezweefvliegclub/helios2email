import { Injectable } from '@nestjs/common';
import fs from 'node:fs';
import { escapeHtml } from '../common/html.util';

@Injectable()
export class HerinneringDienstenMailBuilder {
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
    let html = fs.readFileSync(`${process.env.TEMPLATE_PATH || './templates'}/herinnering-diensten.html`, 'utf8');
    const base64img = fs.readFileSync('./templates/gezc-logo.png', { encoding: 'base64' });

    html = html.replaceAll(/\{base64img}/g, base64img);
    html = html.replaceAll(/\{VOORNAAM}/g, escapeHtml(voornaam));
    html = html.replaceAll(/\{DATUM_STRING}/g, escapeHtml(datumString));
    html = html.replaceAll(/\{TYPE_DIENST}/g, escapeHtml(typeDienst));
    html = html.replaceAll(/\{SCHEMA}/g, schema);

    return html;
  }
}
