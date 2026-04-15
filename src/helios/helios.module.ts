import { Module } from '@nestjs/common';
import { APIService } from './services/api.service';
import { LoginService } from './services/login.service';
import { LedenService } from './services/leden.service';
import { AuditService } from './services/audit.service';
import { DaginfoService } from './services/daginfo.service';
import { DagrapportenService } from './services/dagrapporten.service';
import { GoogleModule } from '../google/google.module'; // Import GoogleModule
import { RoosterService } from './services/rooster.service';
import { DienstenService } from './services/diensten.service';

@Module({
  imports: [GoogleModule], // Add GoogleModule to imports
  providers: [APIService, LoginService, LedenService, AuditService, DaginfoService, DagrapportenService, RoosterService, DienstenService],
  exports: [APIService, LoginService, LedenService, AuditService, DaginfoService, DagrapportenService, RoosterService, DienstenService]
})
export class HeliosModule {}
