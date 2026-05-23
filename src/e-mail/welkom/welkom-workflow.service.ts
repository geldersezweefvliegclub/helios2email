import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import {
  HELIOS_REF_LEDEN,
  SYNC_REF_LEDEN,
  HeliosRefLedenEvent,
  SyncRefLedenEvent,
} from '../../helios/mqtt/mqtt.events';
import { GoogleService } from '../../google/google.service';
import { WelkomMailBuilder } from './welkom-mail.builder';

interface HeliosCacheEntry {
  event: HeliosRefLedenEvent;
  addedAt: Date;
}

interface SyncCacheEntry {
  event: SyncRefLedenEvent;
  addedAt: Date;
}

@Injectable()
export class WelkomWorkflowService
{
  private readonly logger = new Logger(WelkomWorkflowService.name);

  private readonly heliosCache = new Map<number, HeliosCacheEntry[]>();
  private readonly syncCache = new Map<number, SyncCacheEntry[]>();

  private static readonly STALE_MS = 2 * 60 * 1000;

  constructor(
    private readonly googleService: GoogleService,
    private readonly mailBuilder: WelkomMailBuilder,
  ) {}

  @OnEvent(HELIOS_REF_LEDEN)
  onHeliosRefLeden(event: HeliosRefLedenEvent): void {
    const lidId = event.resultaat?.ID ?? event.voor?.ID;
    if (!lidId) return;
    const entries = this.heliosCache.get(lidId) ?? [];
    entries.push({ event, addedAt: new Date() });
    this.heliosCache.set(lidId, entries);
    this.logger.debug(`helios cache: lid ${lidId} toegevoegd (${event.type})`);
  }

  @OnEvent(SYNC_REF_LEDEN)
  onSyncRefLeden(event: SyncRefLedenEvent): void {
    const lidId = event.lid.ID;
    const entries = this.syncCache.get(lidId) ?? [];
    entries.push({ event, addedAt: new Date() });
    this.syncCache.set(lidId, entries);
    this.logger.debug(`sync cache: lid ${lidId} (${event.lid.INLOGNAAM}) toegevoegd`);
  }

  @Cron('* * * * *')
  async checkCaches(): Promise<void> {
    await this.samevoegenEnMailVersturen();
    this.removeStaleEntries();
  }

  private async samevoegenEnMailVersturen(): Promise<void> {
    for (const [lidId, heliosEntries] of this.heliosCache) {
      const syncEntries = this.syncCache.get(lidId);
      if (!syncEntries?.length) continue;

      // Pair FIFO — always consume both entries regardless of whether an email is sent.
      // This prevents stale-entry alerts when events arrive but conditions aren't met.
      while (heliosEntries.length > 0 && syncEntries.length > 0) {
        const helios = heliosEntries.shift()!;
        const sync = syncEntries.shift()!;

        let isNieuweInlognaam = false;

        switch (helios.event.type) {
          case 'aanpassen':
            isNieuweInlognaam = !helios.event.voor?.INLOGNAAM && !!helios.event.resultaat?.INLOGNAAM;
            break;
          case 'toevoegen':
            isNieuweInlognaam = !!helios.event.resultaat?.INLOGNAAM;
            break;
        }

        const heeftWachtwoord = !!sync.event.lid.INGEVOERD_WACHTWOORD;

        if (isNieuweInlognaam && heeftWachtwoord) {
          const lid = helios.event.resultaat!;
          if (!lid.EMAIL) {
            this.logger.warn(`Lid ${lid.INLOGNAAM} heeft geen e-mailadres, welkomstmail niet verstuurd`);
          } else {
            this.logger.log(`Welkomstmail versturen → ${lid.EMAIL} (${lid.INLOGNAAM})`);
            const html = this.mailBuilder.buildHtml({
              voornaam: lid.VOORNAAM || lid.NAAM || '',
              inlogNaam: lid.INLOGNAAM,
              wachtwoord: sync.event.lid.INGEVOERD_WACHTWOORD!,
            });
            await this.googleService.sendHtmlEmail({
              to: lid.EMAIL,
              subject: 'Welkom bij de Gelderse Zweefvliegclub',
              html,
            });
            this.logger.log(`Welkomstmail verstuurd naar ${lid.EMAIL}`);
          }
        }
      }

      if (heliosEntries.length === 0) this.heliosCache.delete(lidId);
      if (syncEntries.length === 0) this.syncCache.delete(lidId);
    }
  }

  private removeStaleEntries(): void {
    const cutoff = Date.now() - WelkomWorkflowService.STALE_MS;

    for (const [lidId, entries] of this.heliosCache) {
      const [stale, fresh] = partition(entries, e => e.addedAt.getTime() < cutoff);
      if (stale.length === 0) continue;
      stale.forEach(e => this.logger.warn(
        `Stale helios entry lid ${lidId} (${e.event.resultaat?.INLOGNAAM ?? e.event.voor?.INLOGNAAM}): sync niet ontvangen`
      ));
      if (fresh.length === 0) this.heliosCache.delete(lidId);
      else this.heliosCache.set(lidId, fresh);
    }

    for (const [lidId, entries] of this.syncCache) {
      const [stale, fresh] = partition(entries, e => e.addedAt.getTime() < cutoff);
      if (stale.length === 0) continue;
      stale.forEach(e => this.logger.warn(
        `Stale sync entry lid ${lidId} (${e.event.lid.INLOGNAAM}): helios niet ontvangen`
      ));
      if (fresh.length === 0) this.syncCache.delete(lidId);
      else this.syncCache.set(lidId, fresh);
    }
  }
}

function partition<T>(arr: T[], pred: (x: T) => boolean): [T[], T[]] {
  const yes: T[] = [], no: T[] = [];
  for (const x of arr) (pred(x) ? yes : no).push(x);
  return [yes, no];
}
