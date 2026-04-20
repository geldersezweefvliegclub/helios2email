import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import { LedenService } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';
import { StartlijstService } from '../helios/services/startlijst.service';
import { toYmd } from '../common/date.util';
import { buildEmailErrorHtml } from "../common/error-mail.builder";
import { VluchtGeenMedicalMailBuilder } from './vlucht-geen-medical-mail.builder';
import { HeliosLidTypes} from "../helios/helios.types";

/**
 * Service voor het vlucht geen medical workflow, die waarschuwings e-mails verstuurt voor leden zonder geldig medical certificaat.
 */
@Injectable()
export class VluchtGeenMedicalWorkflowService {
  private readonly logger = new Logger(VluchtGeenMedicalWorkflowService.name);

  /**
   * Initialiseert de GeenMedicalWorkflowService met alle vereiste dependencies.
   */
  constructor(
    private readonly loginService: LoginService,
    private readonly startlijstService: StartlijstService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: VluchtGeenMedicalMailBuilder
  ) {}

  /**
   * Voert de volledige workflow uit om waarschuwings e-mails te versturen voor leden die hebben gevlogen zonder geldig medical.
   */
  async run(baseDate = new Date()): Promise<void> {
    const datum = toYmd(baseDate);
    this.logger.log(`Start vlucht-geen-medical workflow, datum ${datum}`);

    await this.loginService.login();

    // Ophalen van de start en te zien wie er allemaal gevlogen hebben
    const startlijst = await this.startlijstService.getStartsVoorDag(datum);
    if (!startlijst.length) {
      this.logger.log('Geen starts gevonden, geen medical check nodig.');
      return;
    }

    const selfPicLeden = new Set<number>();
    for (const start of startlijst) {
      // Als de vlieger niet bekend is, of er niet gestart is, dan geen medical check
      if (!start.STARTTIJD || !start.VLIEGER_ID) {
        continue;
      }

      // voor een instructievlucht heb je geen medical nodig
      if (start.INSTRUCTIEVLUCHT) {
        continue;
      }

      // alleen de vlieger heeft een medical nodig
      selfPicLeden.add(start.VLIEGER_ID);
    }

    for (const lidId of selfPicLeden) {
      const lid = await this.ledenService.getLidById(lidId);

      if (!this.requiresMedicalReminder(lid)) {
        continue;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Om alleen op datum te vergelijken, zonder rekening te houden met tijd

      let shouldSendEmail = false;
      if (!lid.MEDICAL) {
        this.logger.log(`Lid ${lid.ID} heeft geen medical datum. Verstuur email.`);
        shouldSendEmail = true;
      } else {
        const medicalDate = new Date(lid.MEDICAL);
        if (medicalDate < today) {
          this.logger.log(`Lid ${lid.ID} heeft een verlopen medical (${lid.MEDICAL}). Verstuur email.`);
          shouldSendEmail = true;
        }
      }
      if (shouldSendEmail) {
        // Als er geen email adres bekend is, kunnen we ook geen email sturen. Informeer ICT en CIMT, actie is nodig
        if (!lid.EMAIL) {
          const html = buildEmailErrorHtml("Medical, geen email", `<p>${lid.NAAM} heeft gevlogen op ${datum} zonder geldig medical, maar heeft geen emailadres. Onderneem aktie</p>`);
          await this.googleService.sendHtmlEmail({
            to: process.env.ICT || 'ict@gezc.org',
            cc: [process.env.CIMT_EMAIL || 'cimt@gezc.org'],
            subject: 'Medical, email ontbeekt',
            html
          });
          this.logger.warn(`${lid.NAAM} heeft geen email address. Mail naar ICT en CIMT gestuurd`);
        }
        else
        {
          // Bouw de email inhoud
          const html = this.mailBuilder.buildHtml(lid.VOORNAAM || lid.NAAM || '');

          // Verstuur de mail via de Google api
          await this.googleService.sendHtmlEmail({
            to: lid.EMAIL,
            cc: [process.env.CIMT_EMAIL || 'cimt@gezc.org'],
            subject: 'Medical',
            html
          });
          this.logger.log(`Medical herinnering voor ${lid.NAAM} gestuurd naar ${lid.EMAIL}`);
        }
      }
    }
  }

  /**
   * Bepaalt of een lid een medical herinnering nodig heeft op basis van hun lidtype.
   */
  private requiresMedicalReminder(lid: { LIDTYPE_ID?: number}): boolean {
    return [
       HeliosLidTypes.STUDENTENLID,
       HeliosLidTypes.ERELID,
       HeliosLidTypes.LID,
       HeliosLidTypes.JEUGDLID,
       HeliosLidTypes.PRIVATE_OWNER,
       HeliosLidTypes.VETERAAN
    ].includes(lid.LIDTYPE_ID || -1);
  }
}
