import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VluchtGeenMedicalWorkflowService } from './vlucht-geen-medical-workflow.service';

/**
 * Scheduler voor vlucht geen medical, die dagelijks een cron job uitvoert om waarschuwings e-mails te versturen.
 */
@Injectable()
export class VluchtGeenMedicalScheduler {
  private readonly logger = new Logger(VluchtGeenMedicalScheduler.name);

  /**
   * Initialiseert de VluchtGeenMedicalScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: VluchtGeenMedicalWorkflowService) {
    this.logger.log(`Cron expression: ${process.env.CRON_VLUCHT_GEEN_MEDICAL || '5 22 * * *'}`);
  }

  /**
   * Voert de geen medical workflow uit wanneer de cron job wordt geactiveerd.
   */
  @Cron(process.env.CRON_VLUCHT_GEEN_MEDICAL || '5 22 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen vlucht-geen-medical cron');
    await this.workflow.run();
  }
}
