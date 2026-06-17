import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosDatasetResponse } from './leden.service';

export interface AanwezigLidRecord {
  ID?: number;
  DATUM?: string;
  LID_ID?: number;
  POSITIE?: number;
  VOORAANMELDING?: boolean;
  AANKOMST?: string;
  VERTREK?: string;
  OPMERKINGEN?: string;
  OVERLAND_VLIEGTUIG_ID?: number;
  VOORKEUR_VLIEGTUIG_TYPE?: string;
  VELD_ID?: number;
  TRANSACTIE_ID?: number;

  NAAM?: string;
  VOORNAAM?: string;
  TUSSENVOEGSEL?: string;
  ACHTERNAAM?: string;
  EMAIL?: string;
  TELEFOON?: string;
  MOBIEL?: string;
  LIDNR?: string;
  LIDTYPE_ID?: number;
  LIDTYPE?: string;
  STATUSTYPE_ID?: number;
  STATUS?: string;

  INSTRUCTEUR?: boolean;
  LIERIST?: boolean;
  STARTLEIDER?: boolean;
  DDWV_CREW?: boolean;

  STARTS?: number;
  VLIEGTIJD?: string;
  VLIEGT?: boolean;
  REG_CALL?: string;
  VELD?: string;

  VERWIJDERD?: boolean;
  LAATSTE_AANPASSING?: string;
}

@Injectable()
export class AanwezigLedenService {
  constructor(private readonly apiService: APIService) {}

  async getAanwezigLeden(beginDatum: string, eindDatum: string): Promise<AanwezigLidRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<AanwezigLidRecord>>('AanwezigLeden/GetObjects', {
      BEGIN_DATUM: beginDatum,
      EIND_DATUM: eindDatum,
    });
    return response.dataset ?? [];
  }
}