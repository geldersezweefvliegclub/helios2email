import { Module } from '@nestjs/common';
import { HeliosModule } from '../../helios/helios.module';
import { SmsModule } from '../sms.module';
import { HerinneringDienstSmsScheduler } from './herinnering-dienst-sms.scheduler';
import { HerinneringDienstSmsWorkflowService } from './herinnering-dienst-sms-workflow.service';
import { HerinneringDienstSmsBuilder } from './herinnering-dienst-sms.builder';

// Module die de scheduler, workflow en SMS builder voor herinnering diensten registreert
@Module({
  imports: [HeliosModule, SmsModule],
  providers: [HerinneringDienstSmsScheduler, HerinneringDienstSmsWorkflowService, HerinneringDienstSmsBuilder]
})
export class HerinneringDienstSmsModule {}
