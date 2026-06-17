import { Injectable, Logger } from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import { DboMaandoverzichtWorkflowService } from './dbo-maandoverzicht-workflow.service';

@Injectable()
export class DboMaandoverzichtScheduler {
  private readonly logger = new Logger(DboMaandoverzichtScheduler.name);

  constructor(private readonly workflow: DboMaandoverzichtWorkflowService) {
    this.logger.log(`${DboMaandoverzichtScheduler.name}: Cron expression: ${process.env.CRON_DBO_MAANDOVERZICHT || '50 23 1 4-11 *'}`);
  }

  @Cron(process.env.CRON_DBO_MAANDOVERZICHT || '50 3 1 4-11 *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen DBO maandoverzicht cron');
    await this.workflow.run();
  }
}
