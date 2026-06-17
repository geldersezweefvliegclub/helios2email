import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosDatasetResponse } from './leden.service';

export interface RoosterRecord {
  CLUB_BEDRIJF?: boolean;
  DDWV?: boolean;
}

export interface RoosterDagRecord {
  DATUM?: string;
  CLUB_BEDRIJF?: boolean;
  DDWV?: boolean;
}

@Injectable()
export class RoosterService {
  constructor(private readonly apiService: APIService) {}

  async getRooster(datum: string): Promise<RoosterRecord> {
    return this.apiService.get<RoosterRecord>('Rooster/GetObject', {
      DATUM: datum
    });
  }

  async getClubBedrijfDagen(beginDatum: string, eindDatum: string): Promise<RoosterDagRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<RoosterDagRecord>>('Rooster/GetObjects', {
      BEGIN_DATUM: beginDatum,
      EIND_DATUM: eindDatum,
    });
    return (response.dataset ?? []).filter(r => r.CLUB_BEDRIJF === true);
  }
}