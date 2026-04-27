import { Module } from '@nestjs/common';
import { HeliosModule } from '../../helios/helios.module';
import { GoogleModule } from '../../google/google.module';
import { VluchtGeenMedicalScheduler } from './vlucht-geen-medical.scheduler';
import { VluchtGeenMedicalWorkflowService } from './vlucht-geen-medical-workflow.service';
import { VluchtGeenMedicalMailBuilder } from './vlucht-geen-medical-mail.builder';

@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [VluchtGeenMedicalScheduler, VluchtGeenMedicalWorkflowService, VluchtGeenMedicalMailBuilder]
})
export class VluchtGeenMedicalModule {}
