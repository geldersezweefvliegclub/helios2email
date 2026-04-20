import {escapeHtml, loadTemplate, renderTemplate} from './html.util';

/**
 * Bouwt een HTML e-mail voor foutmeldingen met een titel en inhoud.
 * {TITEL} en {INHOUD} zijn placeholders in de template
 * Vervangt speciale tekens in de titel en inhoud door hun HTML-escaped equivalenten om te voorkomen dat er ongewenste HTML-injecties plaatsvinden.
 */
export function buildEmailErrorHtml(titel: string, inhoud: string): string {
      return renderTemplate(loadTemplate('error-email.html'), { TITEL: escapeHtml(titel), INHOUD: escapeHtml(inhoud) });
}
