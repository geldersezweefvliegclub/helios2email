import { Module } from '@nestjs/common';
import { HeliosModule } from '../helios/helios.module';
import { GoogleModule } from '../google/google.module';
import { LogboekScheduler } from './logboek.scheduler';
import { LogboekWorkflowService } from './logboek-workflow.service';
import { LogboekMailBuilder } from './logboek-mail.builder';

@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [LogboekScheduler, LogboekWorkflowService, LogboekMailBuilder]
})
export class LogboekModule
{}
