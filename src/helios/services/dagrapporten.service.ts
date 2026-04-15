import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosDatasetResponse } from './leden.service';

export interface DagrapportRecord {
  LAATSTE_AANPASSING?: string;
  INGEVOERD?: string;
  VELD_OMS?: string;
  VLIEGENDMATERIEEL?: string;
  ROLLENDMATERIEEL?: string;
  VERSLAG?: string;
  INCIDENTEN?: string;
}

@Injectable()
export class DagrapportenService {
  constructor(private readonly apiService: APIService) {}

  async getDagrapporten(datum: string): Promise<HeliosDatasetResponse<DagrapportRecord>> {
    return this.apiService.get<HeliosDatasetResponse<DagrapportRecord>>('DagRapporten/GetObjects', {
      DATUM: datum
    });
  }
}
