import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HerinneringDienstenWorkflowService } from './herinnering-diensten-workflow.service';

/**
 * Scheduler voor herinnering diensten, die een cron job uitvoert om herinnerings e-mails te versturen.
 */
@Injectable()
export class HerinneringDienstenScheduler {
  private readonly logger = new Logger(HerinneringDienstenScheduler.name);

  /**
   * Initialiseert de HerinneringDienstenScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: HerinneringDienstenWorkflowService) {
    this.logger.log(`Cron expression: ${process.env.CRON_HERINNERING_DIENSTEN || '0 19 * * *'}`);
  }

  /**
   * Voert de herinnering diensten workflow uit wanneer de cron job wordt geactiveerd.
   */
  @Cron(process.env.CRON_HERINNERING_DIENSTEN || '0 19 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen herinnering_diensten cron');
    await this.workflow.run();
  }
}
