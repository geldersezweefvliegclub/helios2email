import { Module } from '@nestjs/common';
import { HeliosModule } from '../../helios/helios.module';
import { GoogleModule } from '../../google/google.module';
import { DboMaandoverzichtScheduler } from './dbo-maandoverzicht.scheduler';
import { DboMaandoverzichtWorkflowService } from './dbo-maandoverzicht-workflow.service';
import { DboMaandoverzichtMailBuilder } from './dbo-maandoverzicht-mail.builder';

@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [DboMaandoverzichtScheduler, DboMaandoverzichtWorkflowService, DboMaandoverzichtMailBuilder]
})
export class DboMaandoverzichtModule {}
