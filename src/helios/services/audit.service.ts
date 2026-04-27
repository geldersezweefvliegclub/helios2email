import { Injectable, Logger } from '@nestjs/common';
import { APIService } from './api.service';
import { HeliosDatasetResponse } from './leden.service';

/**
 * Geparste inhoud van het VOOR of RESULTAAT veld van een audit record.
 * In Helios zijn dit JSON strings, hier opgeslagen als object zodat callers
 * niet zelf hoeven te parsen.
 */
export interface AuditPayload {
  DATUM?: string;
  VERSLAG?: string;
  METEO?: string;
  VLIEGBEDRIJF?: string;
  ROLLENDMATERIEEL?: string;
  VLIEGENDMATERIEEL?: string;
  INCIDENTEN?: string;

  [key: string]: unknown;
}

/**
 * Audit record zoals door de service teruggeven.
 * VOOR en RESULTAAT zijn al van JSON-string omgezet naar objecten.
 */
export interface AuditRecord {
  VOOR?: AuditPayload;
  DATA?: AuditPayload;
  RESULTAAT?: AuditPayload;
}

// Tussenliggend type dat de ruwe respons van Helios beschrijft (VOOR/RESULTAAT als JSON strings)
interface RawAuditRecord {
  VOOR?: string;
  DATA?: string;
  RESULTAAT?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly apiService: APIService) {}

  /**
   * Haalt de audit records op voor de oper_dagrapporten tabel voor een gegeven datum.
   * De velden VOOR en RESULTAAT komen van Helios als JSON strings binnen, en worden hier
   * direct geparseerd zodat de aanroepende code er als objecten mee kan werken.
   */
  async getDagrapportAudit(datum: string): Promise<AuditRecord[]> {
    const response = await this.apiService.get<HeliosDatasetResponse<RawAuditRecord>>('Audit/GetObjects', {
      DATUM: datum,
      TABEL: 'oper_dagrapporten'
    });

    const dataset = response.dataset ?? [];

    // Per record VOOR en RESULTAAT van JSON string naar object omzetten
    return dataset.map((record) => ({
      VOOR: this.parsePayload(record.VOOR),
      DATA: this.parsePayload(record.DATA),
      RESULTAAT: this.parsePayload(record.RESULTAAT)
    }));
  }

  /**
   * Parseert een JSON-string payload (VOOR of RESULTAAT) naar een AuditPayload object.
   * Nieuwe regels worden vervangen door <br> tags zodat de inhoud later veilig in HTML
   * weergegeven kan worden zonder dat JSON.parse struikelt over onge-escapete control characters.
   * Geeft undefined terug als de payload leeg is of niet geparseerd kan worden.
   */
  private parsePayload(payload?: string): AuditPayload | undefined {
    if (!payload) {
      return undefined;
    }

    try {
      const normalized = payload.trim().replace(/[\r\n]/g, '<br>');
      return JSON.parse(normalized) as AuditPayload;
    } catch (error) {
      this.logger.warn(`Verwerkingsfout audit payload: ${payload}`);
      return undefined;
    }
  }
}
