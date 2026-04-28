import { Injectable } from '@nestjs/common';

/**
 * Bouwer voor de tekst van de herinnering dienst SMS.
 * De inhoud is bewust kort gehouden zodat het in 1 SMS bericht past.
 */
@Injectable()
export class HerinneringDienstSmsBuilder {
  /**
   * Genereert de SMS tekst met voornaam, leesbare datum en het type dienst.
   * Komt overeen met de template uit herinnering_dienst.sms.php.
   */
  buildText(input: { voornaam: string; datumString: string; typeDienst: string }): string {
    return [
      `Beste ${input.voornaam},`,
      '',
      `Morgen ${input.datumString} staat voor jou de dienst ${input.typeDienst} ingeroosterd.`,
      'Deze SMS sturen we als herinnering.',
      '',
      'Tot morgen'
    ].join('\n');
  }
}
