import { Module } from '@nestjs/common';
import { HeliosModule } from '../helios/helios.module';
import { GoogleModule } from '../google/google.module';
import { MedicalVerlopenScheduler } from './medical-verlopen.scheduler';
import { MedicalVerlopenWorkflowService } from './medical-verlopen-workflow.service';
import { MedicalVerlopenMailBuilder } from './medical-verlopen-mail.builder';

// Module die de scheduler, workflow en mail builder voor medical_verlopen registreert
@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [MedicalVerlopenScheduler, MedicalVerlopenWorkflowService, MedicalVerlopenMailBuilder]
})
export class MedicalVerlopenModule {}
