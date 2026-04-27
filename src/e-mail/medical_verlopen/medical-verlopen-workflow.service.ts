import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../../google/google.service';
import { LedenService } from '../../helios/services/leden.service';
import { LoginService } from '../../helios/services/login.service';
import { ymdToDutchDisplay } from '../../common/date.util';
import { MedicalVerlopenMailBuilder } from './medical-verlopen-mail.builder';

// Drempel in dagen: leden krijgen een herinnering als hun medical binnen dit aantal dagen verloopt of al verlopen is.
// Dit komt overeen met medical verloopt binnen ongeveer 2 maanden.
const MEDICAL_HERINNERING_DAGEN = 61;

/**
 * Service voor de medical verlopen workflow, die maandelijks e-mails verstuurt naar leden van wie het medical
 * binnenkort verloopt of al verlopen is. Komt overeen met de bulk-variant uit medical_verlopen.php.
 */
@Injectable()
export class MedicalVerlopenWorkflowService {
  private readonly logger = new Logger(MedicalVerlopenWorkflowService.name);

  /**
   * Initialiseert de MedicalVerlopenWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: MedicalVerlopenMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit om herinneringen te versturen voor verlopen of bijna verlopen medicals.
   * Loopt door alle relevante leden en stuurt een mail als de medical-datum binnen de drempel valt.
   */
  async run(baseDate = new Date()): Promise<void> {
    this.logger.log('Start medical-verlopen workflow');

    // Inloggen bij Helios om data op te kunnen halen
    await this.loginService.login();

    // Ophalen van leden waarvoor het medical relevant is (lidtypes 601-604)
    const leden = await this.ledenService.getLedenMetMedical();
    if (!leden.length) {
      this.logger.log('Geen leden gevonden, geen medical herinneringen nodig');
      return;
    }

    // Vandaag op middernacht zodat we alleen op datum vergelijken (zonder tijd)
    const vandaag = new Date(baseDate);
    vandaag.setHours(0, 0, 0, 0);

    for (const lid of leden) {
      // Geen medical datum bekend, dan ook geen herinnering versturen
      if (!lid.MEDICAL) {
        continue;
      }

      // Bereken het aantal dagen tussen vandaag en de medical-datum
      const medicalDatum = new Date(lid.MEDICAL);
      medicalDatum.setHours(0, 0, 0, 0);
      const verschilMs = medicalDatum.getTime() - vandaag.getTime();
      const verschilDagen = Math.floor(verschilMs / (1000 * 60 * 60 * 24));

      // Alleen versturen als de medical binnen de drempel verloopt of al verlopen is
      if (verschilDagen >= MEDICAL_HERINNERING_DAGEN) {
        continue;
      }

      // Geen e-mailadres bekend, dan kunnen we geen herinnering sturen. Sla over en log een waarschuwing.
      if (!lid.EMAIL) {
        this.logger.warn(`${lid.NAAM} heeft geen email adres, geen medical herinnering verstuurd`);
        continue;
      }

      // Bouw de inhoud van de e-mail met de Nederlandse weergave van de medical datum
      const medicalDatumNl = ymdToDutchDisplay(lid.MEDICAL.substring(0, 10));
      const html = this.mailBuilder.buildHtml({
        voornaam: lid.VOORNAAM || lid.NAAM || '',
        medicalDatum: medicalDatumNl
      });

      // Verstuur de mail via de Google api
      await this.googleService.sendHtmlEmail({
        to: lid.EMAIL,
        subject: 'Geldigheid medical',
        html
      });

      this.logger.log(`Medical herinnering verstuurd naar ${lid.NAAM} (${lid.EMAIL}), geldig tot ${medicalDatumNl}`);
    }
  }
}
