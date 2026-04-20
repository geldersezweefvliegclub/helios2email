import { Injectable, Logger } from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import { HerinneringDagrapportWorkflowService } from './herinnering-dagrapport-workflow.service';

/**
 * Scheduler voor herinnering dagrapport, die een cron job uitvoert om herinneringse-mails te versturen.
 */
@Injectable()
export class HerinneringDagrapportScheduler
{
  private readonly logger = new Logger(HerinneringDagrapportScheduler.name);

  /**
   * Initialiseert de HerinneringDagrapportScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: HerinneringDagrapportWorkflowService) {
    this.logger.log(`Cron expression: ${process.env.CRON_HERINNERING_DAGINFO || '30 19 * * *'}`);
  }

  /**
   * Voert de herinnering dagrapport workflow uit wanneer de cron job wordt geactiveerd.
   */
  @Cron(process.env.CRON_HERINNERING_DAGINFO || '30 19 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })

  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen herinnering_dagrapport cron');
    await this.workflow.run();
  }
}
