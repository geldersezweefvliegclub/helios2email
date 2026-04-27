import { Module } from '@nestjs/common';
import { HeliosModule } from '../../helios/helios.module';
import { GoogleModule } from '../../google/google.module';
import { VluchtBevoegheidScheduler } from './vlucht-bevoegheid.scheduler';
import { VluchtBevoegheidWorkflowService } from './vlucht-bevoegheid-workflow.service';
import { VluchtBevoegheidMailBuilder } from './vlucht-bevoegheid-mail.builder';

@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [VluchtBevoegheidScheduler, VluchtBevoegheidWorkflowService, VluchtBevoegheidMailBuilder]
})
export class VluchtBevoegheidModule {}
