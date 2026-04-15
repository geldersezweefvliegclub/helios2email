import { Injectable } from '@nestjs/common';
import fs from "node:fs";
import {escapeHtml} from "../common/html.util";

@Injectable()
export class HerinneringDagrapportMailBuilder
{
  buildHtml({
    voornaam,
    datumString,
    typeDienst
  }: {
    voornaam: string;
    datumString: string;
    typeDienst: string;
  }): string {
    var html = fs.readFileSync(`${process.env.TEMPLATE_PATH}/herinnering-dagrapport.html`, 'utf8');
    const base64img = fs.readFileSync('./templates/gezc-logo.png', {encoding: 'base64'});
    html = html.replaceAll(/\{base64img}/g, base64img);

    html = html.replaceAll(/\{DATUM_STRING}/g, escapeHtml(datumString));
    html = html.replaceAll(/\{VOORNAAM}/g, voornaam);
    html = html.replaceAll(/\{TYPE_DIENST}/g, typeDienst);

    return html
  }
}
