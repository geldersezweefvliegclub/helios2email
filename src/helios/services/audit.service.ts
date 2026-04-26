import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosDatasetResponse } from './leden.service';

export interface AuditRecord {
  VOOR?: string;
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

  /**
   * Haalt de audit records op voor de oper_daginfo tabel voor een gegeven datum.
   * Wordt onder andere gebruikt om wijzigingen in rollend materieel te detecteren.
   */
  async getDaginfoAudit(datum: string): Promise<AuditRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<AuditRecord>>('Audit/GetObjects', {
      DATUM: datum,
      TABEL: 'oper_daginfo'
    });
    return response.dataset ?? [];
  }
}
