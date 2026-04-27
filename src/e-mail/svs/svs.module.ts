import { Module } from '@nestjs/common';
import { HeliosModule } from '../../helios/helios.module';
import { GoogleModule } from '../../google/google.module';
import { SvsScheduler } from './svs.scheduler';
import { SvsWorkflowService } from './svs-workflow.service';
import { SvsMailBuilder } from './svs-mail.builder';

// Module die de scheduler, workflow en mail builder voor de SVS rapportage registreert
@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [SvsScheduler, SvsWorkflowService, SvsMailBuilder]
})
export class SvsModule {}
