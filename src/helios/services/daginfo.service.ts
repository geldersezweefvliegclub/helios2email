import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosDatasetResponse } from './leden.service';

export interface DaginfoRecord {
  VELD_OMS?: string;
  BAAN_OMS?: string;
  STARTMETHODE_OMS?: string;
  DIENSTEN?: string;
  DDWV?: boolean;
  CLUB_BEDRIJF?: boolean;
}

@Injectable()
export class DaginfoService {
  constructor(private readonly apiService: APIService) {}

  async getDaginfo(datum: string): Promise<HeliosDatasetResponse<DaginfoRecord>> {
    return this.apiService.get<HeliosDatasetResponse<DaginfoRecord>>('Daginfo/GetObjects', {
      DATUM: datum
    });
  }
}
