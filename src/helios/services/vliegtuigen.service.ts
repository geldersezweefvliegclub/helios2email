import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosDatasetResponse } from './leden.service';

export interface VliegtuigRecord {
  ID?: number;
  CALLSIGN?: string;
  CLUBKIST?: boolean;
  BEVOEGDHEID_LOKAAL?: boolean;
  BEVOEGDHEID_LOKAAL_ID?: number;
  BEVOEGDHEID_OVERLAND?: boolean;
  BEVOEGDHEID_OVERLAND_ID?: number;
}

@Injectable()
export class VliegtuigenService {
  constructor(private readonly apiService: APIService) {}

  async getClubVliegtuigen(): Promise<VliegtuigRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<VliegtuigRecord>>('Vliegtuigen/GetObjects', {
      CLUBKIST: true
    });
    return response.dataset ?? [];
  }
}
