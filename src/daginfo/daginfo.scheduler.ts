import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DaginfoWorkflowService } from './daginfo-workflow.service';

@Injectable()
export class DaginfoScheduler {
  private readonly logger = new Logger(DaginfoScheduler.name);

  constructor(private readonly workflow: DaginfoWorkflowService) {}

  @Cron(process.env.CRON_DAGINFO || '0 22 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Running scheduled daginfo email job');
    await this.workflow.run();
  }
}
