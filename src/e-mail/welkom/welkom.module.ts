import { Module } from '@nestjs/common';
import { WelkomWorkflowService } from './welkom-workflow.service';
import { WelkomMailBuilder } from './welkom-mail.builder';
import { GoogleModule } from '../../google/google.module';

@Module({
  imports: [GoogleModule],
  providers: [WelkomWorkflowService, WelkomMailBuilder],
})
export class WelkomModule {}
