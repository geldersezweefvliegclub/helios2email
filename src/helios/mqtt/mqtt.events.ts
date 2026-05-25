import { HeliosMqttType } from './mqtt.types';
import { HeliosLid } from '../helios.types';

export const HELIOS_REF_LEDEN = 'helios.ref_leden';

export class HeliosRefLedenEvent {
  constructor(
    public readonly type: HeliosMqttType,
    public readonly voor: HeliosLid | null,
    public readonly resultaat: HeliosLid | null,
  ) {}
}
