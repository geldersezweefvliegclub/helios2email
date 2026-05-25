import { Module } from '@nestjs/common';
import { HeliosModule } from '../../helios/helios.module';
import { GoogleModule } from '../../google/google.module';
import { DtoVluchtenScheduler } from './dto-vluchten.scheduler';
import { DtoVluchtenWorkflowService } from './dto-vluchten-workflow.service';
import { DtoVluchtenMailBuilder } from './dto-vluchten-mail.builder';

@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [DtoVluchtenScheduler, DtoVluchtenWorkflowService, DtoVluchtenMailBuilder],
})
export class DtoVluchtenModule {}