import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DagrapportWorkflowService } from './dagrapport-workflow.service';

/**
 * Scheduler voor het dagrapport, die dagelijks een cron job uitvoert om het workflow proces te starten.
 */
@Injectable()
export class DagrapportScheduler
{
  private readonly logger = new Logger(DagrapportScheduler.name);

  constructor(private readonly workflow: DagrapportWorkflowService) {
    this.logger.log(`Cron expression: ${process.env.CRON_DAGINFO || '30 22 * * *'}`);
  }

  /**
   * Voert de dagrapport workflow uit wanneer de cron job wordt geactiveerd.
   */
  @Cron(process.env.CRON_DAGINFO || '30 22 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen dagrapport e-mail cron');
    await this.workflow.run();
  }
}
