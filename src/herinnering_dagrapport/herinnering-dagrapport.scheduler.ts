import { Injectable, Logger } from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import { HerinneringDagrapportWorkflowService } from './herinnering-dagrapport-workflow.service';

@Injectable()
export class HerinneringDagrapportScheduler
{
  private readonly logger = new Logger(HerinneringDagrapportScheduler.name);

  constructor(private readonly workflow: HerinneringDagrapportWorkflowService) {}

  @Cron(process.env.CRON_HERINNERING_DAGINFO || '0 20 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })

  async handleCron(): Promise<void> {
    this.logger.log('Running scheduled herinnering_dagrapport email job');
    await this.workflow.run();
  }
}
