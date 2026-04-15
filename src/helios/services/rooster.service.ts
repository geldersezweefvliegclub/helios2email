import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';

export interface RoosterRecord {
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
}
