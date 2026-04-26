import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosLidTypes } from '../helios.types';

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
  LIDTYPE_ID?: number;
  MEDICAL?: string;
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

  /**
   * Haalt alle leden op die in aanmerking komen voor een medical herinnering.
   * Filtert op de lidtypes ERELID, LID, JEUGDLID en PRIVATE_OWNER.
   */
  async getLedenMetMedical(): Promise<LidRecord[]> {
    const types = [
      HeliosLidTypes.ERELID,
      HeliosLidTypes.LID,
      HeliosLidTypes.JEUGDLID,
      HeliosLidTypes.STUDENTENLID,
      HeliosLidTypes.PRIVATE_OWNER
    ].join(',');

    const response = await this.apiService.get<HeliosDatasetResponse<LidRecord>>('Leden/GetObjects', {
      TYPES: types,
    });
    return response.dataset ?? [];
  }
}
