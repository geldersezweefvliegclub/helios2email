import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VliegendWorkflowService } from './vliegend-workflow.service';

// Cron expressie voor de vliegend scheduler.
// Standaard waarde: dagelijks om 23:00 uur (0 23 * * *)
const CRON_EXPRESSION = process.env.CRON_VLIEGEND || '0 23 * * *';

/**
 * Scheduler voor het versturen van een rapportage naar de commissaris vliegend met opmerkingen
 * over vliegend materieel die op de huidige dag in de daginfo zijn gewijzigd.
 */
@Injectable()
export class VliegendScheduler {
  private readonly logger = new Logger(VliegendScheduler.name);

  /**
   * Initialiseert de VliegendScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: VliegendWorkflowService) {
    this.logger.log(`Cron expressie: ${CRON_EXPRESSION}`);
  }

  /**
   * Voert de vliegend workflow uit wanneer de cron job wordt geactiveerd.
   * De starttijd kan via de environment variable CRON_VLIEGEND aangepast worden.
   */
  @Cron(CRON_EXPRESSION, {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen vliegend cron');
    await this.workflow.run();
  }
}
