import fs from "node:fs";

/**
 * Vervang speciale tekens voor HTML variant
 */
export function  escapeHtml(value?: string): string {
   return (value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
}

/**
 * Converteert nieuwe regels naar <br /> tags zodatr die als nieuwe regel getoond worden in HTML.
 */
export function  nl2br(value?: string): string {
   return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

/**
 * Laadt een HTML template bestand en vervangt {base64img} met de base64 gecodeerde logo afbeelding.
 * De process environment variable bepaald de locatie directory vab de templates
 * Het GeZC logo moet in dezelfde directory staan
 */
export function loadTemplate(name: string): string {
   const path = process.env.TEMPLATE_PATH || "."

   let html = fs.readFileSync(`${path}/${name}`, 'utf8');
   const base64img = fs.readFileSync(`${path}/gezc-logo.png`, {encoding: 'base64'});

   return html.replaceAll(/\{base64img}/g, base64img);
}

/**
 * Vervangt variabelen in een template string met hun waarden.
 * Gebruik een custom object bijv { ABCD: "1234"} om de ABCD placeholder in de template te vervangen door 1234.
 * De placeholders in de template moeten in de vorm {ABCD} staan.
 * Alle voorkomens van een placeholder worden vervangen door de bijbehorende waarde.
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
   return Object.entries(variables).reduce(
      (html, [key, value]) =>
         html.replace(new RegExp(`{\\s*${key}\\s*}`, 'g'), value),
      template
   );
}
