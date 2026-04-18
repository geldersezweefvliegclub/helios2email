import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import { LedenService } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';
import { StartlijstService } from '../helios/services/startlijst.service';
import { toYmd } from '../common/date.util';
import { buildEmailErrorHtml } from "../common/error-mail.builder";
import { VluchtGeenMedicalMailBuilder } from './vlucht-geen-medical-mail.builder';
import { HeliosLidTypes} from "../helios/helios.types";

@Injectable()
export class VluchtGeenMedicalWorkflowService {
  private readonly logger = new Logger(VluchtGeenMedicalWorkflowService.name);
  private readonly MIDDAG_INSTR = 1806;       // uit type tabel

  constructor(
    private readonly loginService: LoginService,
    private readonly startlijstService: StartlijstService,
    private readonly ledenService: LedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: VluchtGeenMedicalMailBuilder
  ) {}

  async run(baseDate = new Date()): Promise<void> {
    const datum = toYmd(baseDate);
    this.logger.log(`Start vlucht-geen-medical workflow, datum ${datum}`);

    await this.loginService.login();

    const startlijst = await this.startlijstService.getStartsVoorDag(datum);
    if (!startlijst.length) {
      this.logger.log('Geen starts gevonden, geen medical check nodig.');
      return;
    }

    const selfPicLeden = new Set<number>();
    for (const start of startlijst) {
      if (!start.STARTTIJD || !start.VLIEGER_ID) {
        continue;
      }
      selfPicLeden.add(start.VLIEGER_ID);
    }

    for (const lidId of selfPicLeden) {
      const lid = await this.ledenService.getLidById(lidId);

      if (!this.requiresMedicalReminder(lid)) {
        continue;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // To compare dates without time

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
          const html = this.mailBuilder.buildHtml(lid.VOORNAAM || lid.NAAM || '');
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
