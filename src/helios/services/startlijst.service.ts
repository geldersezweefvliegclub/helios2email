import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosDatasetResponse } from './leden.service';

export interface StartlijstRecord {
  DATUM?: string;
  VLIEGER_ID?: number;
  INZITTENDE_ID?: number;
  STARTTIJD?: string;
  VLIEGTUIG_ID?: number;
  VLIEGTUIG?: string;
  VLIEGERNAAM?: string;
  INZITTENDENAAM?: string;
  REG_CALL?: string;
  VELD?: string;
  STARTMETHODE?: string;
  LANDINGSTIJD?: string;
  DUUR?: string;
  OPMERKINGEN?: string;
  INSTRUCTIEVLUCHT?: boolean;
}

@Injectable()
export class StartlijstService {
  constructor(private readonly apiService: APIService) {}

  async getStartsVoorDag(datum: string): Promise<StartlijstRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<StartlijstRecord>>('Startlijst/GetObjects', {
      SORT: 'VLIEGER_ID,STARTTIJD',
      BEGIN_DATUM: datum,
      EIND_DATUM: datum
    });
    return response.dataset ?? [];
  }


  async getLogboekVoorLid(lidId: number, datum: string): Promise<StartlijstRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<StartlijstRecord>>('Startlijst/GetLogboek', {
      LID_ID: lidId,
      BEGIN_DATUM: datum,
      EIND_DATUM: datum,
      SORT: 'starttijd'
    });
    return response.dataset ?? [];
  }
}
