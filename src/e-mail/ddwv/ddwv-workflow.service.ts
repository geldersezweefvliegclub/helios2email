import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../../google/google.service';
import { LoginService } from '../../helios/services/login.service';
import { RoosterService } from '../../helios/services/rooster.service';
import { StartlijstService, StartlijstRecord } from '../../helios/services/startlijst.service';
import { toDutchLongDate, toYmd } from '../../common/date.util';
import { HeliosLidTypes } from '../../helios/helios.types';
import { DdwvMailBuilder } from './ddwv-mail.builder';

/**
 * Service voor de DDWV workflow, die op een DDWV dag een mail stuurt naar de DDWV beheerder
 * met alle (of, op een gecombineerde dag, alleen DDWV-) vluchten van die dag.
 * Komt overeen met ddwv.e-mail.php.
 */
@Injectable()
export class DdwvWorkflowService {
  private readonly logger = new Logger(DdwvWorkflowService.name);

  /**
   * Initialiseert de DdwvWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly startlijstService: StartlijstService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: DdwvMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit. Controleert of het een DDWV dag is, verzamelt de
   * relevante starts en stuurt deze in een tabel naar de DDWV beheerder.
   */
  async run(baseDate = new Date()): Promise<void> {
    const datum = toYmd(baseDate);
    this.logger.log(`Start DDWV workflow, datum ${datum}`);

    // Inloggen bij Helios om data op te kunnen halen
    await this.loginService.login();

    // Rooster ophalen om te bepalen of het een DDWV dag is
    const rooster = await this.roosterService.getRooster(datum);

    // Geen DDWV dag, dan hoeven we geen mail te sturen
    if (!rooster?.DDWV) {
      this.logger.log('Geen DDWV dag, geen DDWV mail nodig');
      return;
    }

    // Een gecombineerde dag betekent dat er ook een club bedrijf is. In dat geval
    // willen we alleen de vluchten van DDWV-vliegers laten zien.
    const isCombiDag = rooster.CLUB_BEDRIJF === true;

    // Ophalen van alle starts van vandaag
    const startlijst = await this.startlijstService.getStartsVoorDag(datum);
    if (!startlijst.length) {
      this.logger.log('Geen starts gevonden, geen DDWV mail nodig');
      return;
    }

    // Op een gecombineerde dag filteren we op DDWV-vliegers, anders nemen we alle starts mee
    const vluchten = isCombiDag
      ? startlijst.filter((start) => this.isDdwvVlucht(start))
      : startlijst;

    if (vluchten.length === 0) {
      this.logger.log('Geen DDWV vluchten gevonden, geen DDWV mail nodig');
      return;
    }

    // Datum in Nederlandse weergave (lange vorm met dag van de week)
    const datumString = toDutchLongDate(baseDate);

    // Bouw de inhoud van de e-mail met de juiste intro tekst en de vluchten in een tabel
    const html = this.mailBuilder.buildHtml({
      datumString,
      isCombiDag,
      starts: vluchten
    });

    // Bepaal het e-mailadres van de DDWV beheerder, met default
    const ontvanger = process.env.DDWV_EMAIL || 'ddwv@gezc.org';

    // Verstuur de mail via de Google api
    await this.googleService.sendHtmlEmail({
      to: ontvanger,
      subject: `Startlijst ${datumString}`,
      html
    });

    this.logger.log(`DDWV mail verstuurd naar ${ontvanger} met ${vluchten.length} vlucht(en)`);
  }

  /**
   * Bepaalt of een vlucht door een DDWV-vlieger is gemaakt op basis van het lidtype van de vlieger.
   */
  private isDdwvVlucht(start: StartlijstRecord): boolean {
    return start.VLIEGER_LIDTYPE_ID === HeliosLidTypes.DDWV_VLIEGER;
  }
}
