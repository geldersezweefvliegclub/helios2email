import { Module } from '@nestjs/common';
import { HeliosModule } from '../helios/helios.module';
import { GoogleModule } from '../google/google.module';
import { RollendScheduler } from './rollend.scheduler';
import { RollendWorkflowService } from './rollend-workflow.service';
import { RollendMailBuilder } from './rollend-mail.builder';

// Module die de scheduler, workflow en mail builder voor rollend materieel registreert
@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [RollendScheduler, RollendWorkflowService, RollendMailBuilder]
})
export class RollendModule {}
