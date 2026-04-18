import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HerinneringDienstenWorkflowService } from './herinnering-diensten-workflow.service';

@Injectable()
export class HerinneringDienstenScheduler {
  private readonly logger = new Logger(HerinneringDienstenScheduler.name);

  constructor(private readonly workflow: HerinneringDienstenWorkflowService) {
    this.logger.log(`Cron expression: ${process.env.CRON_HERINNERING_DIENSTEN || '0 19 * * *'}`);
  }

  @Cron(process.env.CRON_HERINNERING_DIENSTEN || '0 19 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen herinnering_diensten cron');
    await this.workflow.run();
  }
}
