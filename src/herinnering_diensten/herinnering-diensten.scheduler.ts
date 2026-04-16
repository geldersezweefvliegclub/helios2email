import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HerinneringDienstenWorkflowService } from './herinnering-diensten-workflow.service';

@Injectable()
export class HerinneringDienstenScheduler {
  private readonly logger = new Logger(HerinneringDienstenScheduler.name);

  constructor(private readonly workflow: HerinneringDienstenWorkflowService) {}

  @Cron(process.env.CRON_HERINNERING_DIENSTEN || '0 19 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Running scheduled herinnering_diensten email job');
    await this.workflow.run();
  }
}
