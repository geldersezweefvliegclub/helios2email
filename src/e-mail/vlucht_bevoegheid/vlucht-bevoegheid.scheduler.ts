import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VluchtBevoegheidWorkflowService } from './vlucht-bevoegheid-workflow.service';

// Cron expressie voor de vluchtbevoegdheid scheduler
const CRON_EXPRESSION = process.env.CRON_VLUCHT_BEVOEGHEID || '10 21 * * *';

/**
 * Scheduler voor het verzenden van een e-mail als de vlieger een vlucht gemaakt heeft op een type waarvoor hij/zij niet bevoegd is
 */
@Injectable()
export class VluchtBevoegheidScheduler {
  private readonly logger = new Logger(VluchtBevoegheidScheduler.name);

  /**
   * Initialiseert de VluchtBevoegdheidScheduler en logt de cron expressie.
   */
  constructor(private readonly workflow: VluchtBevoegheidWorkflowService) {
    this.logger.log(`Cron expressie: ${CRON_EXPRESSION}`);
  }

  /**
   * Voert de vlucht bevoegdheid workflow uit wanneer de cron job wordt geactiveerd.
   */
  @Cron(CRON_EXPRESSION, {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen vlucht-bevoegdheid cron');
    await this.workflow.run();
  }
}
