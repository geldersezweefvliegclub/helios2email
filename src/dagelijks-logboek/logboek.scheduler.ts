import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LogboekWorkflowService } from './logboek-workflow.service';

@Injectable()
export class LogboekScheduler
{
  private readonly logger = new Logger(LogboekScheduler.name);

  constructor(private readonly workflow: LogboekWorkflowService) {
    this.logger.log(`Cron expression: ${process.env.CRON_LOGBOEK || '0 22 * * *'}`);
  }

  @Cron(process.env.CRON_LOGBOEK || '0 22 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen dagelijks-logboek cron');
    await this.workflow.run();
  }
}
