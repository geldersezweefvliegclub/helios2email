import { HeliosMqttType } from './mqtt.types';
import { HeliosLid } from '../helios.types';
import { SyncLid } from './mqtt.types';

export const HELIOS_REF_LEDEN = 'helios.ref_leden';
export const SYNC_REF_LEDEN = 'sync.ref_leden';

export class HeliosRefLedenEvent {
  constructor(
    public readonly type: HeliosMqttType,
    public readonly voor: HeliosLid | null,
    public readonly resultaat: HeliosLid | null,
  ) {}
}

export class SyncRefLedenEvent {
  constructor(
    public readonly lid: SyncLid,
  ) {}
}
