import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as mqtt from 'mqtt';
import { RawHeliosMqttMessage } from './mqtt.types';
import { HeliosLid } from '../helios.types';
import { HELIOS_REF_LEDEN, HeliosRefLedenEvent } from './mqtt.events';

@Injectable()
export class MqttService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(MqttService.name);
  private client!: mqtt.MqttClient;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  onApplicationBootstrap(): void {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    const topic = process.env.MQTT_TOPIC || 'gezc/+';
    const username = process.env.MQTT_USERNAME || undefined;
    const password = process.env.MQTT_PASSWORD || undefined;

    this.client = mqtt.connect(brokerUrl, { username, password });

    this.client.on('connect', () => {
      this.logger.log(`Verbonden met MQTT broker: ${brokerUrl}`);
      this.client.subscribe(topic, (err) => {
        if (err) {
          this.logger.error(`Fout bij subscriben op topic ${topic}: ${err.message}`);
        } else {
          this.logger.log(`Abbonement op topic: ${topic}`);
        }
      });
    });

    this.client.on('message', (receivedTopic, payload) => {
      if (receivedTopic === 'gezc/helios') {
        this.handleHeliosMessage(payload);
      } else {
        this.logger.debug(`Onbekend topic: ${receivedTopic}`);
      }
    });

    this.client.on('error', (err) => {
      this.logger.error(`MQTT fout: ${err.message}`);
    });

    this.client.on('disconnect', () => {
      this.logger.warn('MQTT verbinding verbroken');
    });
  }

  onApplicationShutdown(): void {
    this.client?.end();
  }

  // ── gezc/helios ─────────────────────────────────────────────────────────────

  private handleHeliosMessage(payload: Buffer): void {
    let raw: RawHeliosMqttMessage;
    try {
      raw = JSON.parse(payload.toString());
    } catch {
      this.logger.error(`Ongeldig JSON op gezc/helios: ${payload.toString()}`);
      return;
    }

    this.logger.log(`helios: ${raw.type} op ${raw.table} (id: ${raw.data.record_id})`);

    switch (raw.table) {
      case 'ref_leden':
        this.eventEmitter.emit(HELIOS_REF_LEDEN, new HeliosRefLedenEvent(
          raw.type,
          (raw.data.voor?.[0] ?? null) as HeliosLid | null,
          (raw.data.resultaat?.[0] ?? null) as HeliosLid | null,
        ));
        break;
      default:
        this.logger.debug(`Geen handler voor tabel: ${raw.table}`);
    }
  }

}
