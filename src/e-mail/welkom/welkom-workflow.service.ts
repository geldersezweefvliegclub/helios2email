import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HELIOS_REF_LEDEN, HeliosRefLedenEvent } from '../../helios/mqtt/mqtt.events';
import { GoogleService } from '../../google/google.service';
import { WelkomMailBuilder } from './welkom-mail.builder';
import { HeliosLidTypes } from '../../helios/helios.types';

const WELKOM_LIDTYPES = new Set<number>([
  HeliosLidTypes.STUDENTENLID,
  HeliosLidTypes.LID,
  HeliosLidTypes.DONATEUR,
  HeliosLidTypes.ERELID,
  HeliosLidTypes.JEUGDLID,
  HeliosLidTypes.PRIVATE_OWNER,
  HeliosLidTypes.VETERAAN,
  HeliosLidTypes.DDWV_VLIEGER,
]);

@Injectable()
export class WelkomWorkflowService {
  private readonly logger = new Logger(WelkomWorkflowService.name);

  constructor(
    private readonly googleService: GoogleService,
    private readonly mailBuilder: WelkomMailBuilder,
  ) {}

  @OnEvent(HELIOS_REF_LEDEN)
  async onHeliosRefLeden(event: HeliosRefLedenEvent): Promise<void> {
    const isNieuweInlognaam =
      event.type === 'toevoegen'
        ? !!event.resultaat?.INLOGNAAM
        : event.type === 'aanpassen'
          ? !event.voor?.INLOGNAAM && !!event.resultaat?.INLOGNAAM
          : false;

    if (!isNieuweInlognaam) return;

    const lid = event.resultaat!;

    if (!WELKOM_LIDTYPES.has(lid.LIDTYPE_ID)) {
      this.logger.log(`Geen welkom email voor lidtype ${lid.LIDTYPE_ID} (${lid.INLOGNAAM})`);
      return;
    }

    if (!lid.EMAIL) {
      this.logger.warn(`Lid ${lid.INLOGNAAM} heeft geen e-mailadres, welkomstmail niet verstuurd`);
      return;
    }

    const html = this.mailBuilder.buildHtml({
      voornaam: lid.VOORNAAM || lid.NAAM || '',
      inlogNaam: lid.INLOGNAAM,
    });

    await this.googleService.sendHtmlEmail({
      from: process.env.ICT_EMAIL || 'ict@gezc.org',
      to: lid.EMAIL,
      subject: 'Welkom bij de Gelderse Zweefvliegclub',
      html,
    });

    this.logger.log(`Welkomstmail verstuurd naar ${lid.EMAIL} (${lid.INLOGNAAM})`);
  }
}
