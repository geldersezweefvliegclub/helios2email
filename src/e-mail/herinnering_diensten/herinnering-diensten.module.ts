import { Module } from '@nestjs/common';
import { GoogleModule } from '../../google/google.module';
import { HeliosModule } from '../../helios/helios.module';
import { HerinneringDienstenMailBuilder } from './herinnering-diensten-mail.builder';
import { HerinneringDienstenScheduler } from './herinnering-diensten.scheduler';
import { HerinneringDienstenWorkflowService } from './herinnering-diensten-workflow.service';

@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [
    HerinneringDienstenMailBuilder,
    HerinneringDienstenScheduler,
    HerinneringDienstenWorkflowService
  ]
})
export class HerinneringDienstenModule {}
