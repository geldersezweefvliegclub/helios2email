import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';

export interface HeliosDatasetResponse<T> {
  totaal?: number;
  dataset: T[];
  hash?: string;
}

export interface LidRecord {
  ID?: number;
  VOORNAAM?: string;
  NAAM: string;
  EMAIL: string;
  EMAIL_DAGINFO?: boolean;
}

@Injectable()
export class LedenService {
  constructor(private readonly apiService: APIService) {}

  async getInstructeurs(): Promise<LidRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<LidRecord>>('Leden/GetObjects', {
      INSTRUCTEURS: true
    });
    return response.dataset ?? [];
  }

  async getBeheerders(): Promise<LidRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<LidRecord>>('Leden/GetObjects', {
      BEHEERDERS: true
    });
    return response.dataset ?? [];
  }

  async getLidById(id: number): Promise<LidRecord> {
    return this.apiService.get<LidRecord>('Leden/GetObject', {
      ID: id
    });
  }
}
