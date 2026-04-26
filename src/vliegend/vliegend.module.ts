import { Module } from '@nestjs/common';
import { HeliosModule } from '../helios/helios.module';
import { GoogleModule } from '../google/google.module';
import { VliegendScheduler } from './vliegend.scheduler';
import { VliegendWorkflowService } from './vliegend-workflow.service';
import { VliegendMailBuilder } from './vliegend-mail.builder';

// Module die de scheduler, workflow en mail builder voor vliegend materieel registreert
@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [VliegendScheduler, VliegendWorkflowService, VliegendMailBuilder]
})
export class VliegendModule {}
