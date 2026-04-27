import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MedicalVerlopenWorkflowService } from './medical-verlopen-workflow.service';

// Cron expressie voor de medical verlopen scheduler.
// Standaard waarde: elke eerste dag van de maand om 03:00 uur (0 3 1 * *)
const CRON_EXPRESSION = process.env.CRON_MEDICAL_VERLOPEN || '0 3 1 * *';

/**
 * Scheduler voor het versturen van een herinnering aan leden van wie het medical bijna verloopt of al verlopen is.
 * Deze cron job draait standaard maandelijks op de 1e van de maand om 03:00 uur.
 */
@Injectable()
export class MedicalVerlopenScheduler {
  private readonly logger = new Logger(MedicalVerlopenScheduler.name);

  /**
   * Initialiseert de MedicalVerlopenScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: MedicalVerlopenWorkflowService) {
    this.logger.log(`Cron expressie: ${CRON_EXPRESSION}`);
  }

  /**
   * Voert de medical verlopen workflow uit wanneer de cron job wordt geactiveerd.
   * De starttijd kan via de environment variable CRON_MEDICAL_VERLOPEN aangepast worden.
   */
  @Cron(CRON_EXPRESSION, {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen medical-verlopen cron');
    await this.workflow.run();
  }
}
