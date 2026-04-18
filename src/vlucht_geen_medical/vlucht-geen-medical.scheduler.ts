import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VluchtGeenMedicalWorkflowService } from './vlucht-geen-medical-workflow.service';

@Injectable()
export class VluchtGeenMedicalScheduler {
  private readonly logger = new Logger(VluchtGeenMedicalScheduler.name);

  constructor(private readonly workflow: VluchtGeenMedicalWorkflowService) {
    this.logger.log(`Cron expression: ${process.env.CRON_VLUCHT_GEEN_MEDICAL || '5 22 * * *'}`);
  }

  @Cron(process.env.CRON_VLUCHT_GEEN_MEDICAL || '5 22 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen vlucht-geen-medical cron');
    await this.workflow.run();
  }
}
