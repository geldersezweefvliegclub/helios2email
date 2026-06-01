import fs from 'node:fs';

/**
 * Vervang speciale tekens voor gebruik in HTML.
 * Zorg ervoor dat de input altijd als string behandeld wordt om runtime fouten
 * zoals "replace is not a function" te voorkomen wanneer een niet-string
 * (bijv. number of object) wordt meegegeven.
 */
export function escapeHtml(value?: unknown): string {
  const s = value == null ? '' : String(value);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converteert nieuwe regels naar <br /> tags zodat tekst in HTML op de
 * juiste manier als nieuwe regel wordt weergegeven.
 */
export function nl2br(value?: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

/**
 * Laadt een HTML template bestand en vervangt {base64img} met de base64
 * gecodeerde logo-afbeelding. De omgevingvariabele TEMPLATE_PATH kan
 * gebruikt worden om een andere locatie voor templates aan te geven.
 */
export function loadTemplate(name: string): string {
  const path = process.env.TEMPLATE_PATH || '.';

  const html = fs.readFileSync(`${path}/${name}`, 'utf8');
  const base64img = fs.readFileSync(`${path}/gezc-logo.png`, { encoding: 'base64' });

  return html.replace(/\{base64img}/g, base64img);
}

/**
 * Vervangt placeholders in een template string met hun bijbehorende
 * waarden uit het variables-object. Alle waarden worden naar strings
 * geconverteerd zodat niet-string inputs correct worden verwerkt.
 */
export function renderTemplate(template: string, variables: Record<string, unknown>): string {
  return Object.entries(variables).reduce((html, [key, value]) =>
    html.replace(new RegExp(`{\\s*${key}\\s*}`, 'g'), String(value ?? '')),
    template,
  );
}
