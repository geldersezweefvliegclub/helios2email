import { Module } from '@nestjs/common';
import { HeliosModule } from '../../helios/helios.module';
import { GoogleModule } from '../../google/google.module';
import { VeiligheidScheduler } from './veiligheid.scheduler';
import { VeiligheidWorkflowService } from './veiligheid-workflow.service';
import { VeiligheidMailBuilder } from './veiligheid-mail.builder';

// Module die de scheduler, workflow en mail builder voor de veiligheidsmanager registreert
@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [VeiligheidScheduler, VeiligheidWorkflowService, VeiligheidMailBuilder]
})
export class VeiligheidModule {}
