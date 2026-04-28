import { Module } from '@nestjs/common';
import { HeliosModule } from '../../helios/helios.module';
import { GoogleModule } from '../../google/google.module';
import { DdwvScheduler } from './ddwv.scheduler';
import { DdwvWorkflowService } from './ddwv-workflow.service';
import { DdwvMailBuilder } from './ddwv-mail.builder';

// Module die de scheduler, workflow en mail builder voor de DDWV rapportage registreert
@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [DdwvScheduler, DdwvWorkflowService, DdwvMailBuilder]
})
export class DdwvModule {}
