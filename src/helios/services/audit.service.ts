import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosDatasetResponse } from './leden.service';

export interface AuditRecord {
  RESULTAAT: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly apiService: APIService) {}

  async getDagrapportAudit(datum: string): Promise<AuditRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<AuditRecord>>('Audit/GetObjects', {
      DATUM: datum,
      TABEL: 'oper_dagrapporten'
    });
    return response.dataset ?? [];
  }
}
