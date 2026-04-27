import { Module } from '@nestjs/common';
import { DagrapportScheduler } from './dagrapport.scheduler';
import { DagrapportWorkflowService } from './dagrapport-workflow.service';
import { DagRapportMailBuilder } from './dagrapport-mail-builder.service';
import { HeliosModule } from '../../helios/helios.module';
import { GoogleModule } from '../../google/google.module';

@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [DagrapportScheduler, DagrapportWorkflowService, DagRapportMailBuilder]
})
export class DagrapportModule
{}
