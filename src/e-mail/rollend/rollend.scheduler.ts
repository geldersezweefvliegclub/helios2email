import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RollendWorkflowService } from './rollend-workflow.service';

// Cron expressie voor de rollend scheduler.
// Standaard waarde: dagelijks om 23:00 uur (0 23 * * *)
const CRON_EXPRESSION = process.env.CRON_ROLLEND || '0 23 * * *';

/**
 * Scheduler voor het versturen van een rapportage naar de commissaris rollend met opmerkingen
 * over rollend materieel die op de huidige dag in de daginfo zijn gewijzigd.
 */
@Injectable()
export class RollendScheduler {
  private readonly logger = new Logger(RollendScheduler.name);

  /**
   * Initialiseert de RollendScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: RollendWorkflowService) {
    this.logger.log(`Cron expressie: ${CRON_EXPRESSION}`);
  }

  /**
   * Voert de rollend workflow uit wanneer de cron job wordt geactiveerd.
   * De starttijd kan via de environment variable CRON_ROLLEND aangepast worden.
   */
  @Cron(CRON_EXPRESSION, {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen rollend cron');

    await this.workflow.run();
  }
}
