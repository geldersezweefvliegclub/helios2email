import { Module } from '@nestjs/common';
import { APIService } from './services/api.service';
import { LoginService } from './services/login.service';
import { LedenService } from './services/leden.service';
import { AuditService } from './services/audit.service';
import { DaginfoService } from './services/daginfo.service';
import { DagrapportenService } from './services/dagrapporten.service';
import { GoogleModule } from '../google/google.module'; // Import GoogleModule

@Module({
  imports: [GoogleModule], // Add GoogleModule to imports
  providers: [APIService, LoginService, LedenService, AuditService, DaginfoService, DagrapportenService],
  exports: [APIService, LoginService, LedenService, AuditService, DaginfoService, DagrapportenService]
})
export class HeliosModule {}
