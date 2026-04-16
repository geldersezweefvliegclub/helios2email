import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosDatasetResponse } from './leden.service';

export interface ProgressieRecord {
  COMPETENTIE_ID?: number;
}

@Injectable()
export class ProgressieService {
  constructor(private readonly apiService: APIService) {}

  async getProgressiesForLid(lidId: number, competentieIds: number[]): Promise<ProgressieRecord[]> {
    if (!competentieIds.length) {
      return [];
    }

    const response = await this.apiService.get<HeliosDatasetResponse<ProgressieRecord>>('Progressie/GetObjects', {
      LID_ID: lidId,
      IN: competentieIds.join(',')
    });
    return response.dataset ?? [];
  }
}
