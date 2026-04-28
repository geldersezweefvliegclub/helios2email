import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HerinneringDienstSmsWorkflowService } from './herinnering-dienst-sms-workflow.service';

// Cron expressie voor de herinnering dienst SMS scheduler.
// Standaard waarde: elke avond om 20:00 uur (0 20 * * *) zodat leden de avond vooraf
// een SMS herinnering ontvangen voor hun dienst van de volgende dag.
const CRON_EXPRESSION = process.env.CRON_HERINNERING_DIENSTEN_SMS || '0 20 * * *';

/**
 * Scheduler voor het versturen van een SMS herinnering naar leden met een dienst op de volgende dag.
 */
@Injectable()
export class HerinneringDienstSmsScheduler {
  private readonly logger = new Logger(HerinneringDienstSmsScheduler.name);

  /**
   * Initialiseert de HerinneringDienstSmsScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: HerinneringDienstSmsWorkflowService) {
    this.logger.log(`Cron expressie: ${CRON_EXPRESSION}`);
  }

  /**
   * Voert de herinnering dienst SMS workflow uit wanneer de cron job wordt geactiveerd.
   * De starttijd kan via de environment variable CRON_HERINNERING_DIENSTEN_SMS aangepast worden.
   */
  @Cron(CRON_EXPRESSION, {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen herinnering dienst SMS cron');
    await this.workflow.run();
  }
}
