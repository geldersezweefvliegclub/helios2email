import { Module } from '@nestjs/common';
import { HeliosModule } from '../../helios/helios.module';
import { GoogleModule } from '../../google/google.module';
import { PenningmeesterScheduler } from './penningmeester.scheduler';
import { PenningmeesterWorkflowService } from './penningmeester-workflow.service';
import { PenningmeesterMailBuilder } from './penningmeester-mail.builder';

// Module die de scheduler, workflow en mail builder voor de penningmeester rapportage registreert
@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [PenningmeesterScheduler, PenningmeesterWorkflowService, PenningmeesterMailBuilder]
})
export class PenningmeesterModule {}
