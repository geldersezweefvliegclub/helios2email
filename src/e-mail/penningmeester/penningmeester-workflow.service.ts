import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../../google/google.service';
import { LedenService, LidRecord } from '../../helios/services/leden.service';
import { LoginService } from '../../helios/services/login.service';
import { RoosterService } from '../../helios/services/rooster.service';
import { StartlijstService, StartlijstRecord } from '../../helios/services/startlijst.service';
import { toDutchLongDate, toYmd } from '../../common/date.util';
import { HeliosLidTypes } from '../../helios/helios.types';
import { PenningmeesterMailBuilder } from './penningmeester-mail.builder';

// Lidtypes die als 'lid van de club' gelden. Vluchten van deze leden hoeven niet
// in de penningmeester rapportage te worden opgenomen.
const LIDTYPES_LID_VAN_CLUB: number[] = [
  HeliosLidTypes.STUDENTENLID,
  HeliosLidTypes.ERELID,
  HeliosLidTypes.LID,
  HeliosLidTypes.JEUGDLID,
  HeliosLidTypes.PRIVATE_OWNER,
  HeliosLidTypes.DONATEUR,
  HeliosLidTypes.VETERAAN
];

/**
 * Service voor de penningmeester workflow, die op een puur clubdag (geen DDWV) een mail
 * stuurt met alle vluchten van vliegers die geen lid van de club zijn.
 */
@Injectable()
export class PenningmeesterWorkflowService {
  private readonly logger = new Logger(PenningmeesterWorkflowService.name);

  /**
   * Initialiseert de PenningmeesterWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly startlijstService: StartlijstService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: PenningmeesterMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit. Controleert eerst of het rooster alleen een clubdag betreft,
   * verzamelt vervolgens alle vluchten van vliegers die geen lid van de club zijn en stuurt deze
   * in een tabel naar de penningmeester.
   */
  async run(baseDate = new Date()): Promise<void> {
    const datum = toYmd(baseDate);
    this.logger.log(`Start penningmeester workflow, datum ${datum}`);

    // Inloggen bij Helios om data op te kunnen halen
    await this.loginService.login();

    // Rooster ophalen om te bepalen wat voor type vliegdag het is
    const rooster = await this.roosterService.getRooster(datum);

    // Alleen versturen als het een clubdag is en geen DDWV. Op DDWV (of gemixte) dagen vliegen
    // er sowieso veel niet-leden mee, dat hoort niet in deze rapportage.
    if (!rooster?.CLUB_BEDRIJF || rooster?.DDWV) {
      this.logger.log('Geen pure clubdag, geen penningmeester mail nodig');
      return;
    }

    // Ophalen van alle starts van vandaag
    const startlijst = await this.startlijstService.getStartsVoorDag(datum);
    if (!startlijst.length) {
      this.logger.log('Geen starts gevonden, geen penningmeester mail nodig');
      return;
    }

    // Verzamel unieke vlieger IDs uit de startlijst
    const vliegerIds = new Set<number>();
    for (const start of startlijst) {
      if (start.VLIEGER_ID) {
        vliegerIds.add(start.VLIEGER_ID);
      }
    }

    if (vliegerIds.size === 0) {
      this.logger.log('Geen vliegers in startlijst, geen penningmeester mail nodig');
      return;
    }

    // Eén batch call naar de leden API met alle vlieger IDs als CSV string,
    const vliegers = await this.ledenService.getLedenByIds([...vliegerIds]);

    // Verzamel de IDs van de vliegers die geen lid van de club zijn,
    // en houd ook het bijbehorende lid-record bij voor LIDTYPE en ZUSTERCLUB in de mail tabel.
    const nietLedenIds = new Set<number>();
    const nietLedenById = new Map<number, LidRecord>();
    for (const vlieger of vliegers) {
      if (typeof vlieger.ID === 'number' && this.isNietLidVanClub(vlieger)) {
        nietLedenIds.add(vlieger.ID);
        nietLedenById.set(vlieger.ID, vlieger);
      }
    }

    if (nietLedenIds.size === 0) {
      this.logger.log('Geen vluchten van niet-leden gevonden, geen penningmeester mail nodig');
      return;
    }

    // Filter de startlijst op vluchten van niet-leden
    const vluchten = startlijst.filter(
      (start): start is StartlijstRecord & { VLIEGER_ID: number } =>
        typeof start.VLIEGER_ID === 'number' && nietLedenIds.has(start.VLIEGER_ID)
    );

    if (vluchten.length === 0) {
      this.logger.log('Geen vluchten van niet-leden gevonden, geen penningmeester mail nodig');
      return;
    }

    // Datum in Nederlandse weergave (lange vorm met dag van de week)
    const datumString = toDutchLongDate(baseDate);

    // Bouw de inhoud van de e-mail met de vluchten van niet-leden in een tabel.
    // De map met lid info wordt meegegeven zodat de tabel ook LIDTYPE en ZUSTERCLUB kan tonen.
    const html = this.mailBuilder.buildHtml({
      datumString,
      vluchten,
      vliegerById: nietLedenById
    });

    // Bepaal het e-mailadres van de penningmeester, met default
    const ontvanger = process.env.PENNINGMEESTER_EMAIL || 'penningmeester@gezc.org';

    // Verstuur de mail via de Google api
    await this.googleService.sendHtmlEmail({
      to: ontvanger,
      subject: `Vluchten niet-leden ${datumString}`,
      html
    });

    this.logger.log(
      `Penningmeester mail verstuurd naar ${ontvanger}, ${vluchten.length} vlucht(en) van ${nietLedenIds.size} niet-lid/leden`
    );
  }

  /**
   * Bepaalt of een lid een 'niet-lid van de club' is.
   * Lid types STUDENTENLID, ERELID, LID, JEUGDLID, PRIVATE_OWNER, DONATEUR en VETERAAN gelden als lid.
   * Alle overige types (zoals NIEUW_LID, RITTENKAARTHOUDER, ZUSTERCLUB, DDWV_VLIEGER, etc.) zijn geen lid.
   */
  private isNietLidVanClub(lid: LidRecord): boolean {
    if (typeof lid.LIDTYPE_ID !== 'number') {
      return false;   // onbekend lidtype, niet rapporteren om vals positieven te voorkomen
    }
    return !LIDTYPES_LID_VAN_CLUB.includes(lid.LIDTYPE_ID);
  }
}
