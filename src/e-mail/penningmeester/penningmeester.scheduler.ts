import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PenningmeesterWorkflowService } from './penningmeester-workflow.service';

// Cron expressie voor de penningmeester scheduler.
// Standaard waarde: dagelijks om 23:30 uur (30 23 * * *)
const CRON_EXPRESSION = process.env.CRON_PENNINGMEESTER || '30 23 * * *';

/**
 * Scheduler voor het versturen van een rapportage naar de penningmeester met de vluchten
 * van niet-leden op een clubdag.
 */
@Injectable()
export class PenningmeesterScheduler {
  private readonly logger = new Logger(PenningmeesterScheduler.name);

  /**
   * Initialiseert de PenningmeesterScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: PenningmeesterWorkflowService) {
    this.logger.log(`Cron expressie: ${CRON_EXPRESSION}`);
  }

  /**
   * Voert de penningmeester workflow uit wanneer de cron job wordt geactiveerd.
   * De starttijd kan via de environment variable CRON_PENNINGMEESTER aangepast worden.
   */
  @Cron(CRON_EXPRESSION, {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen penningmeester cron');

    await this.workflow.run();
  }
}
