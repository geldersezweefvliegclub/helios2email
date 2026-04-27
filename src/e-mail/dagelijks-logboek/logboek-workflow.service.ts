import { Injectable, Logger } from '@nestjs/common';
import { toDutchLongDate, toYmd } from '../../common/date.util';
import { GoogleService } from '../../google/google.service';
import { LedenService } from '../../helios/services/leden.service';
import { LoginService } from '../../helios/services/login.service';
import { StartlijstService } from '../../helios/services/startlijst.service';
import { LogboekMailBuilder } from './logboek-mail.builder';
import { HeliosLidTypes} from "../../helios/helios.types";
import { buildEmailErrorHtml} from "../../common/error-mail.builder";

/**
 * Service voor het dagelijks logboek workflow, die e-mails verstuurt naar leden met hun vluchten die ze deze dag gemaakt hebben.
 */
@Injectable()
export class LogboekWorkflowService
{
  private readonly logger = new Logger(LogboekWorkflowService.name);

  /**
   * Initialiseert de LogboekWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly startlijstService: StartlijstService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: LogboekMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit om logboek e-mails te versturen voor een bepaalde datum.
   */
  async run(baseDate = new Date()): Promise<void> {
    const datum = toYmd(baseDate);
    const datumString = toDutchLongDate(baseDate);
    this.logger.log(`Start logbook workflow, datum ${datum}`);

    await this.loginService.login();

    // ophalen startlijst
    const startlijst = await this.startlijstService.getStartsVoorDag(datum);
    if (!startlijst.length) {
      this.logger.log('Geen starts gevonden, geen dagelijks-logboek emails');
      return;
    }

    // bepaal uit de startlijst wie er allemaal aanwezig zijn geweest
    const aanwezigen = new Set<number>();
    for (const start of startlijst) {
      // geen starttijd of geen vlieger ingevoerd, dan geen mail sturen
      if (!start.STARTTIJD || !start.VLIEGER_ID) {
        continue;
      }
      aanwezigen.add(start.VLIEGER_ID);   // ook de inzittende krijgt een e-mail
      if (start.INZITTENDE_ID) {
        aanwezigen.add(start.INZITTENDE_ID);
      }
    }

    for (const lidId of aanwezigen) {
      const lid = await this.ledenService.getLidById(lidId);
      const to = this.resolvePrimaryRecipient(lid);

      // Geen emailadres gevonden, mail naar ICT sturen zodat ze actie kunnen ondernemen
      if (!to) {
        const html = buildEmailErrorHtml("Logboek, geen e-mail", `<p>${lid.NAAM} heeft gevlogen op ${datum}, maar heeft geen emailadres. Onderneem aktie</p>`);
        await this.googleService.sendHtmlEmail({
          to: process.env.ICT || 'ict@gezc.org',
          subject: 'Logboek, e-mail ontbeekt',
          html
        });
        this.logger.warn(`${lid.NAAM} heeft geen email address. Mail naar ICT gestuurd`);
        continue;
      }

      // Ophalen logboek van de vlieger voor deze datum
      const vluchten = await this.startlijstService.getLogboekVoorLid(lidId, datum);

      // Dit mag niet voorkomen omdat we de ledenlijst op basis van de startlijst hebben samengesteld,
      // maar niet mailen als er geen starts zijn
      if (!vluchten.length) {
        continue;
      }

      // Bouw de e-mail inhoud
      const html = this.mailBuilder.buildHtml({
        voornaam: lid.VOORNAAM || lid.NAAM || '',
        datumString,
        vluchten
      });

      // Verstuur de mail via de Google api
      await this.googleService.sendHtmlEmail({
        to,
        subject: `Logboek ${datumString}`,
        html
      });

      this.logger.log(`Logbook email voor ${lid.NAAM} verstuurd naar ${to}`);
    }
  }

  /**
   * Bepaalt het primaire e-mailadres voor een lid gebaseerd op hun lidtype.
   */
  private resolvePrimaryRecipient(lid: { LIDTYPE_ID?: number; EMAIL?: string }): string | undefined {
    const penningmeesterEmail = process.env.PENNINGMEESTER_EMAIL || 'penningmeester@gezc.org';
    const startadminEmail = process.env.STARTADMIN_EMAIL || 'startadmin@gezc.org';

    switch (lid.LIDTYPE_ID) {
      case HeliosLidTypes.ZUSTERCLUB:
      case HeliosLidTypes.RITTENKAARTHOUDER:
      {
        return penningmeesterEmail;
      }
      case HeliosLidTypes.NIEUW_LID:
      {
        return startadminEmail;
      }
      case HeliosLidTypes.OPROTKABEL:
      case HeliosLidTypes.PENNINGMEESTER:
      case HeliosLidTypes.SYSTEEM_ACCOUNT:
      {
        return penningmeesterEmail;
      }
      default:
        return lid.EMAIL;
    }
  }
}
