import { Module } from '@nestjs/common';
import { DaginfoScheduler } from './daginfo.scheduler';
import { DaginfoWorkflowService } from './daginfo-workflow.service';
import { DagRapportMailBuilder } from './dag-rapport-mail-builder.service';
import { HeliosModule } from '../helios/helios.module';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [DaginfoScheduler, DaginfoWorkflowService, DagRapportMailBuilder]
})
export class DaginfoModule {}
