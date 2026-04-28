import { Injectable, Logger } from '@nestjs/common';

// Endpoint van de MessageBird REST API voor het versturen van berichten
const MESSAGEBIRD_URL = 'https://rest.messagebird.com/messages';

/**
 * Service voor het versturen van SMS berichten via de MessageBird REST API.
 * De API key en originator (afzender naam) worden uit environment variables gelezen.
 */
@Injectable()
export class MessageBirdService {
  private readonly logger = new Logger(MessageBirdService.name);

  /**
   * Verstuurt een SMS naar het opgegeven mobiele nummer.
   * Stuurt niets als VERZENDEN_SMS=false
   * Gooit een fout als de MessageBird API key niet geconfigureerd is of als de API een fout teruggeeft.
   */
  async sendSms(input: { recipient: string; body: string }): Promise<void> {
    if (process.env.VERZENDEN_SMS === 'false') {
      this.logger.log(`SMS sending disabled. Would send to: ${input.recipient}`);
      return;
    }

    // API key is vereist voor authenticatie bij MessageBird
    const apiKey = process.env.MESSAGEBIRD_API_KEY;
    if (!apiKey) {
      throw new Error('MESSAGEBIRD_API_KEY is niet gezet, kan geen SMS versturen');
    }

    // Originator is de afzendernaam die in het SMS bericht verschijnt (max 11 tekens voor alfa-numeric)
    const originator = process.env.MESSAGEBIRD_ORIGINATOR || 'GeZC';

    // Stuur het bericht naar de MessageBird REST API
    const response = await fetch(MESSAGEBIRD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        originator,
        recipients: [input.recipient],
        body: input.body
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`MessageBird API fout (${response.status}): ${errorBody}`);
      throw new Error(`MessageBird API fout: ${response.status} ${response.statusText}`);
    }
  }
}
