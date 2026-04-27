import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VeiligheidWorkflowService } from './veiligheid-workflow.service';

// Cron expressie voor de veiligheidsmanager scheduler.
// Standaard waarde: dagelijks om 23:00 uur (0 23 * * *)
const CRON_EXPRESSION = process.env.CRON_VEILIGHEIDSMANAGER || '0 23 * * *';

/**
 * Scheduler voor het versturen van een rapportage naar de veiligheidsmanager met incidenten
 * die op de huidige dag in de daginfo zijn gewijzigd.
 */
@Injectable()
export class VeiligheidScheduler {
  private readonly logger = new Logger(VeiligheidScheduler.name);

  /**
   * Initialiseert de VeiligheidScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: VeiligheidWorkflowService) {
    this.logger.log(`Cron expressie: ${CRON_EXPRESSION}`);
  }

  /**
   * Voert de veiligheidsmanager workflow uit wanneer de cron job wordt geactiveerd.
   * De starttijd kan via de environment variable CRON_VEILIGHEIDSMANAGER aangepast worden.
   */
  @Cron(CRON_EXPRESSION, {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen veiligheidsmanager cron');
    await this.workflow.run();
  }
}
