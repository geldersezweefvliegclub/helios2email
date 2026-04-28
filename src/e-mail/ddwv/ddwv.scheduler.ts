import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DdwvWorkflowService } from './ddwv-workflow.service';

// Cron expressie voor de DDWV scheduler.
// Standaard waarde: dagelijks om 21:55 uur (55 21 * * *)
const CRON_EXPRESSION = process.env.CRON_DDWV || '55 21 * * *';

/**
 * Scheduler voor het versturen van een rapportage naar de DDWV beheerder met de vluchten
 * van de huidige DDWV dag.
 */
@Injectable()
export class DdwvScheduler {
  private readonly logger = new Logger(DdwvScheduler.name);

  /**
   * Initialiseert de DdwvScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: DdwvWorkflowService) {
    this.logger.log(`Cron expressie: ${CRON_EXPRESSION}`);
  }

  /**
   * Voert de DDWV workflow uit wanneer de cron job wordt geactiveerd.
   * De starttijd kan via de environment variable CRON_DDWV aangepast worden.
   */
  @Cron(CRON_EXPRESSION, {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen DDWV cron');
    await this.workflow.run();
  }
}
