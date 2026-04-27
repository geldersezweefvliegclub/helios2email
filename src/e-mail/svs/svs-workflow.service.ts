import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../../google/google.service';
import { LoginService } from '../../helios/services/login.service';
import { StartlijstService, StartlijstRecord } from '../../helios/services/startlijst.service';
import { toDutchLongDate, toYmd } from '../../common/date.util';
import { SvsMailBuilder } from './svs-mail.builder';
import {HeliosStartMethodeTypes, HeliosVliegveldTypes} from "../../helios/helios.types";

/**
 * Service voor de SVS workflow, die dagelijks de sleepstarts vanaf Terlet ophaalt
 * en deze in een tabel naar de SVS beheerder mailt. Komt overeen met svs.e-mail.php.
 */
@Injectable()
export class SvsWorkflowService {
  private readonly logger = new Logger(SvsWorkflowService.name);

  /**
   * Initialiseert de SvsWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly startlijstService: StartlijstService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: SvsMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit. Haalt de startlijst op voor de gegeven datum,
   * filtert op sleepstarts vanaf Terlet en stuurt indien er starts zijn een mail naar
   * de SVS beheerder met een tabel van de relevante starts.
   */
  async run(baseDate = new Date()): Promise<void> {
    const datum = toYmd(baseDate);
    this.logger.log(`Start SVS workflow, datum ${datum}`);

    // Inloggen bij Helios om de startlijst op te kunnen halen
    await this.loginService.login();

    // Ophalen van alle starts van vandaag
    const startlijst = await this.startlijstService.getStartsVoorDag(datum);
    if (!startlijst.length) {
      this.logger.log('Geen starts gevonden, geen SVS mail nodig');
      return;
    }

    // Filteren op sleepstarts vanaf Terlet, conform svs.e-mail.php
    const sleepstarts = startlijst.filter((start) => this.isSleepStartTerlet(start));
    if (!sleepstarts.length) {
      this.logger.log('Geen sleepstarts vanaf Terlet, geen SVS mail nodig');
      return;
    }

    // Datum in Nederlandse weergave (lange vorm met dag van de week) voor onderwerp en mailinhoud
    const datumString = toDutchLongDate(baseDate);

    // Bouw de inhoud van de e-mail met de sleepstarts in een tabel
    const html = this.mailBuilder.buildHtml({
      datumString,
      starts: sleepstarts
    });

    // Bepaal het e-mailadres van de SVS beheerder, met default
    const ontvanger = process.env.SVS_EMAIL || 'slepen@gmail.com';

    // Verstuur de mail via de Google api
    await this.googleService.sendHtmlEmail({
      to: ontvanger,
      subject: `Startlijst ${datumString}`,
      html
    });

    this.logger.log(`SVS mail verstuurd naar ${ontvanger} met ${sleepstarts.length} sleepstart(s)`);
  }

  /**
   * Bepaalt of een start een sleepstart vanaf Terlet is. Alleen deze starts zijn relevant voor de SVS rapportage.
   */
  private isSleepStartTerlet(start: StartlijstRecord): boolean {
    return start.STARTMETHODE_ID === HeliosStartMethodeTypes.Slepen && start.VELD_ID === HeliosVliegveldTypes.Terlet;
  }
}
