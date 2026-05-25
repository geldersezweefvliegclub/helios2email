import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosLidTypes, HeliosVliegstatusTypes } from '../helios.types';

export interface HeliosDatasetResponse<T> {
  totaal?: number;
  dataset: T[];
  hash?: string;
}

export interface LidRecord {
  ID?: number;
  VOORNAAM?: string;
  TUSSENVOEGSEL?: string;
  ACHTERNAAM?: string;
  NAAM: string;
  EMAIL: string;
  EMAIL_DAGINFO?: boolean;
  LIDNR?: string;
  LIDTYPE_ID?: number;
  LIDTYPE?: string;
  STATUSTYPE_ID?: number;
  STATUS?: string;
  ZUSTERCLUB?: string;
  MEDICAL?: string;
  TELEFOON?: string;
  MOBIEL?: string;
  INLOGNAAM?: string;
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
   * Haalt meerdere leden tegelijk op via de GetObjects API met een ID lijst als CSV string.
   * Veel efficienter dan per ID een aparte call doen, zeker bij grote aantallen.
   * Geeft een lege array terug als er geen IDs zijn meegegeven.
   */
  async getLedenByIds(ids: number[]): Promise<LidRecord[]> {
    if (ids.length === 0) {
      return [];
    }

    // De API verwacht de IDs als comma-separated string in het ID parameter
    const idCsv = ids.join(',');
    const response = await this.apiService.get<HeliosDatasetResponse<LidRecord>>('Leden/GetObjects', {
      ID: idCsv
    });
    return response.dataset ?? [];
  }

  /**
   * Haalt alle leden op met vliegstatus DBO of Solist, gefilterd op relevante lidtypes.
   * De API ondersteunt geen statusfilter, dus statusfiltering vindt client-side plaats.
   */
  async getLedenDTO(): Promise<LidRecord[]> {
    const types = [
      HeliosLidTypes.STUDENTENLID,
      HeliosLidTypes.LID,
      HeliosLidTypes.JEUGDLID,
      HeliosLidTypes.VETERAAN,
    ].join(',');

    const response = await this.apiService.get<HeliosDatasetResponse<LidRecord>>('Leden/GetObjects', {
      TYPES: types,
    });
    return (response.dataset ?? []).filter(lid =>
      lid.STATUSTYPE_ID === HeliosVliegstatusTypes.DBO ||
      lid.STATUSTYPE_ID === HeliosVliegstatusTypes.SOLIST
    );
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
