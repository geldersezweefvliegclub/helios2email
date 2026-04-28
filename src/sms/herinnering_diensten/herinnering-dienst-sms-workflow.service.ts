import { Injectable, Logger } from '@nestjs/common';
import { DienstenService } from '../../helios/services/diensten.service';
import { LedenService } from '../../helios/services/leden.service';
import { LoginService } from '../../helios/services/login.service';
import { RoosterService } from '../../helios/services/rooster.service';
import { toDutchLongDate, toYmd } from '../../common/date.util';
import { MessageBirdService } from '../messagebird.service';
import { HerinneringDienstSmsBuilder } from './herinnering-dienst-sms.builder';

/**
 * Service voor de SMS herinnering diensten workflow. Op de avond vooraf wordt een SMS
 * gestuurd naar elk lid met een dienst op de volgende dag, mits het een clubdag is.
 * Komt overeen met herinnering_dienst.sms.php.
 */
@Injectable()
export class HerinneringDienstSmsWorkflowService {
  private readonly logger = new Logger(HerinneringDienstSmsWorkflowService.name);

  /**
   * Initialiseert de HerinneringDienstSmsWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly dienstenService: DienstenService,
    private readonly ledenService: LedenService,
    private readonly messageBirdService: MessageBirdService,
    private readonly smsBuilder: HerinneringDienstSmsBuilder
  ) {}

  /**
   * Voert de volledige workflow uit. Pakt de diensten van morgen op een clubdag en stuurt
   * elk ingeroosterd lid een SMS herinnering.
   */
  async run(baseDate = new Date()): Promise<void> {
    // Bepaal de datum van morgen, dat is de dag waarvoor we de herinnering versturen
    const forDate = new Date(baseDate);
    forDate.setDate(forDate.getDate() + 1);

    const datum = toYmd(forDate);
    this.logger.log(`Start herinnering_dienst_sms workflow, datum ${datum}`);

    // Inloggen bij Helios om data op te kunnen halen
    await this.loginService.login();

    // Rooster ophalen voor morgen om te bepalen of het een clubdag is
    const rooster = await this.roosterService.getRooster(datum);

    // We sturen alleen een SMS herinnering op clubdagen
    if (!rooster?.CLUB_BEDRIJF) {
      this.logger.log('Geen clubdag, geen SMS herinnering nodig');
      return;
    }

    // Diensten ophalen voor morgen
    const diensten = await this.dienstenService.getDiensten(datum);
    if (diensten.length === 0) {
      this.logger.log('Geen ingeroosterde diensten gevonden, geen SMS herinneringen');
      return;
    }

    // Verzamel unieke lid IDs uit de diensten zodat we de leden in één batch call kunnen ophalen
    const lidIds = new Set<number>();
    for (const dienst of diensten) {
      if (dienst.LID_ID) {
        lidIds.add(dienst.LID_ID);
      }
    }

    if (lidIds.size === 0) {
      this.logger.log('Geen leden gekoppeld aan diensten, geen SMS herinneringen');
      return;
    }

    // Eén batch call naar de leden API met alle lid IDs als CSV string,
    // i.p.v. per lid een aparte call. Scheelt server load bij veel diensten.
    const leden = await this.ledenService.getLedenByIds([...lidIds]);
    const lidById = new Map<number, typeof leden[number]>();
    for (const lid of leden) {
      if (typeof lid.ID === 'number') {
        lidById.set(lid.ID, lid);
      }
    }

    // Datum in Nederlandse weergave (lange vorm met dag van de week)
    const datumString = toDutchLongDate(forDate);
    this.logger.log(`Versturen SMS herinneringen voor ${datumString}`);

    for (const dienst of diensten) {
      // Dit zou niet mogen gebeuren, maar als we geen lid hebben, kunnen we ook geen SMS sturen
      if (!dienst.LID_ID) {
        this.logger.warn(`Dienst zonder lid, ${JSON.stringify(dienst)}`);
        continue;
      }

      const lid = lidById.get(dienst.LID_ID);
      if (!lid) {
        this.logger.warn(`Lid ${dienst.LID_ID} niet gevonden, geen SMS verstuurd`);
        continue;
      }

      // Zonder mobiel nummer kunnen we geen SMS sturen
      if (!lid.MOBIEL) {
        this.logger.warn(`${lid.NAAM} heeft geen mobiel nummer, geen SMS verstuurd`);
        continue;
      }

      // Bouw de SMS tekst
      const body = this.smsBuilder.buildText({
        voornaam: lid.VOORNAAM || lid.NAAM || '',
        datumString,
        typeDienst: dienst.TYPE_DIENST || ''
      });

      // Verstuur de SMS via MessageBird
      try {
        await this.messageBirdService.sendSms({
          recipient: lid.MOBIEL,
          body
        });
        this.logger.log(`Herinnering SMS verstuurd: ${dienst.TYPE_DIENST}: ${lid.NAAM} [${lid.MOBIEL}]`);
      } catch (error: any) {
        this.logger.error(`SMS naar ${lid.NAAM} (${lid.MOBIEL}) mislukt: ${error.message}`);
      }
    }
  }
}
