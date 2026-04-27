import { Module } from '@nestjs/common';
import { GoogleModule } from '../../google/google.module';
import { HeliosModule } from '../../helios/helios.module';
import { HerinneringDagrapportMailBuilder } from './herinnering-dagrapport-mail.builder';
import { HerinneringDagrapportScheduler } from './herinnering-dagrapport.scheduler';
import { HerinneringDagrapportWorkflowService } from './herinnering-dagrapport-workflow.service';

@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [
    HerinneringDagrapportMailBuilder,
    HerinneringDagrapportScheduler,
    HerinneringDagrapportWorkflowService
  ]
})
export class HerinneringDagrapportModule
{}