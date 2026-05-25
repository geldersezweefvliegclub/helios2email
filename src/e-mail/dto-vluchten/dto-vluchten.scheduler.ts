import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DtoVluchtenWorkflowService } from './dto-vluchten-workflow.service';

// Cron expressie voor de DTO vluchten scheduler.
// Standaard waarde: eerste dag van de maand om 05:30 uur, april t/m oktober (30 5 1 4-10 *)
const CRON_EXPRESSION = process.env.CRON_DTO_VLUCHTEN || '30 5 1 4-10 *';

@Injectable()
export class DtoVluchtenScheduler {
  private readonly logger = new Logger(DtoVluchtenScheduler.name);

  constructor(private readonly workflow: DtoVluchtenWorkflowService) {
    this.logger.log(`Cron expressie: ${CRON_EXPRESSION}`);
  }

  @Cron(CRON_EXPRESSION, {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen DTO vluchten cron');
    await this.workflow.run();
  }
}