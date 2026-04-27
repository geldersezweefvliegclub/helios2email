import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SvsWorkflowService } from './svs-workflow.service';

// Cron expressie voor de SVS scheduler.
// Standaard waarde: dagelijks om 23:15 uur (15 23 * * *)
const CRON_EXPRESSION = process.env.CRON_SVS || '15 23 * * *';

/**
 * Scheduler voor het versturen van een rapportage naar de SVS beheerder met de sleepvluchten
 * van de huidige dag vanaf Terlet.
 */
@Injectable()
export class SvsScheduler {
  private readonly logger = new Logger(SvsScheduler.name);

  /**
   * Initialiseert de SvsScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: SvsWorkflowService) {
    this.logger.log(`Cron expressie: ${CRON_EXPRESSION}`);
  }

  /**
   * Voert de SVS workflow uit wanneer de cron job wordt geactiveerd.
   * De starttijd kan via de environment variable CRON_SVS aangepast worden.
   */
  @Cron(CRON_EXPRESSION, {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen SVS cron');
    await this.workflow.run();
  }
}
