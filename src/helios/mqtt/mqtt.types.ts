export type HeliosMqttType = 'aanpassen' | 'toevoegen' | 'verwijderen';

// ── gezc/helios ─────────────────────────────────────────────────────────────

export interface HeliosRecord {
  type: HeliosMqttType;
  table: string;
  voor: Record<string, unknown> | null;
  data: Record<string, unknown>;
  resultaat: Record<string, unknown> | null;
  recordId: number;
  timestamp: string;
}

export interface RawHeliosMqttData {
  voor?: Record<string, unknown>[];
  data?: Record<string, unknown>;
  resultaat?: Record<string, unknown>[];
  record_id?: number;
}

export interface RawHeliosMqttMessage {
  type: HeliosMqttType;
  table: string;
  data: RawHeliosMqttData;
  timestamp: string;
}

