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

// ── gezc/sync ────────────────────────────────────────────────────────────────

export interface SyncLid {
  ID: number;
  NAAM: string;
  VOORNAAM?: string;
  TUSSENVOEGSEL?: string;
  ACHTERNAAM?: string;
  INLOGNAAM: string;
  EMAIL?: string;
  LIDTYPE_ID: number;
  STATUSTYPE_ID?: number;
  VERWIJDERD: boolean;
  LIDNR?: string;
  MEDICAL?: string;
  MOBIEL?: string;
  NOODNUMMER?: string;
  AVATAR?: string;
  BEHEERDER: boolean;
  LIERIST: boolean;
  LIERIST_IO: boolean;
  STARTLEIDER: boolean;
  INSTRUCTEUR: boolean;
  CIMT: boolean;
  DDWV_CREW: boolean;
  DDWV_BEHEERDER: boolean;
  STARTTOREN: boolean;
  ROOSTER: boolean;
  SLEEPVLIEGER: boolean;
  RAPPORTEUR: boolean;
  GASTENVLIEGER: boolean;
  TECHNICUS: boolean;
  INGEVOERD_WACHTWOORD?: string;
}

export interface SyncRecord {
  type: string;
  table?: string;
  lid: SyncLid;
  syncId?: number;
  timestamp?: string;
}

export interface RawSyncInnerData {
  LID_ID: number;
  DATA: SyncLid;
  ID?: number;
}

export interface RawSyncMessage {
  type: string;
  table?: string;
  data: string;   // JSON-encoded string, needs a second JSON.parse
  timestamp?: string;
}
