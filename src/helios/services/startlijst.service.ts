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
  VLIEGERNAAM_LID?: string;
  INZITTENDENAAM?: string;
  INZITTENDENAAM_LID?: string;
  REG_CALL?: string;
  VELD?: string;
  VELD_ID?: number;
  STARTMETHODE?: string;
  STARTMETHODE_ID?: number;
  SLEEPKIST?: string;
  SLEEP_HOOGTE?: string;
  LANDINGSTIJD?: string;
  DUUR?: string;
  OPMERKINGEN?: string;
  INSTRUCTIEVLUCHT?: boolean;
  VLIEGER_LIDTYPE_ID?: number;
  INZITTENDE_LIDTYPE_ID?: number;
}

export interface LogboekTotalenJaar {
  STARTS?: number;
  INSTRUCTIE_STARTS?: number;
  INSTRUCTIE_UREN?: string;
  VLIEGTIJD?: string;
}

export interface LogboekTotalenStart {
  METHODE?: string;
  AANTAL?: number;
}

export interface LogboekTotalenVliegtuig {
  REG_CALL?: string;
  STARTS?: number;
}

export interface LogboekTotalen {
  totaal?: number;
  starts?: LogboekTotalenStart[];
  vliegtuigen?: LogboekTotalenVliegtuig[];
  jaar?: LogboekTotalenJaar;
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


  async getTotalen(lidId: number, jaar: number): Promise<LogboekTotalen> {
    return this.apiService.get<LogboekTotalen>('Startlijst/GetLogboekTotalen', {
      LID_ID: lidId,
      JAAR: jaar,
    });
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
