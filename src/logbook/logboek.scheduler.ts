import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LogboekWorkflowService } from './logboek-workflow.service';

@Injectable()
export class LogboekScheduler
{
  private readonly logger = new Logger(LogboekScheduler.name);

  constructor(private readonly workflow: LogboekWorkflowService) {}

  @Cron(process.env.CRON_LOGBOOK || '* * * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Running logbook cron');
    await this.workflow.run();
  }
}
