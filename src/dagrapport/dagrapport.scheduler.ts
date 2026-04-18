import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DagrapportWorkflowService } from './dagrapport-workflow.service';

@Injectable()
export class DagrapportScheduler
{
  private readonly logger = new Logger(DagrapportScheduler.name);

  constructor(private readonly workflow: DagrapportWorkflowService) {
    this.logger.log(`Cron expression: ${process.env.CRON_DAGINFO || '30 22 * * *'}`);
  }

  @Cron(process.env.CRON_DAGINFO || '30 22 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen dagrapport email cron');
    await this.workflow.run();
  }
}
