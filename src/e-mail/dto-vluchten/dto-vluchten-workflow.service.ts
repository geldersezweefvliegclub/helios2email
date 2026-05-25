import { Injectable, Logger } from '@nestjs/common';
import { GoogleService } from '../../google/google.service';
import { LedenService } from '../../helios/services/leden.service';
import { LoginService } from '../../helios/services/login.service';
import { StartlijstService } from '../../helios/services/startlijst.service';
import { HeliosVliegstatusTypes } from '../../helios/helios.types';
import { DtoVluchtenMailBuilder, LidMetTotalen } from './dto-vluchten-mail.builder';
import { toYmd, ymdToDutchDisplay } from '../../common/date.util';

@Injectable()
export class DtoVluchtenWorkflowService {
  private readonly logger = new Logger(DtoVluchtenWorkflowService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly ledenService: LedenService,
    private readonly startlijstService: StartlijstService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: DtoVluchtenMailBuilder,
  ) {}

  async run(baseDate = new Date()): Promise<void> {
    const huidigJaar = baseDate.getFullYear();
    this.logger.log(`Start DTO vluchten workflow, jaar ${huidigJaar}`);

    await this.loginService.login();

    const leden = await this.ledenService.getLedenDTO();
    if (!leden.length) {
      this.logger.log('Geen DBO/solist leden gevonden, geen mail nodig');
      return;
    }

    // Haal totalen op voor elk lid voor 3 jaar parallel
    const ledenMetTotalen: LidMetTotalen[] = await Promise.all(
      leden
        .filter(lid => lid.ID !== undefined)
        .map(async lid => {
          const [totaalMin2, totaalMin1, totaalHuidig] = await Promise.all([
            this.startlijstService.getTotalen(lid.ID!, huidigJaar - 2),
            this.startlijstService.getTotalen(lid.ID!, huidigJaar - 1),
            this.startlijstService.getTotalen(lid.ID!, huidigJaar),
          ]);
          return {
            lid,
            startsMin2: totaalMin2.jaar?.STARTS ?? 0,
            startsMin1: totaalMin1.jaar?.STARTS ?? 0,
            startsHuidig: totaalHuidig.jaar?.STARTS ?? 0,
          };
        })
    );

    const lidJaar = (x: LidMetTotalen) => parseInt(x.lid.LIDNR?.substring(0, 4) ?? '0', 10);

    const sorteerOp = (a: LidMetTotalen, b: LidMetTotalen) => {
      const jaarDiff = lidJaar(a) - lidJaar(b);
      if (jaarDiff !== 0) return jaarDiff;
      const achternaamDiff = (a.lid.ACHTERNAAM ?? '').localeCompare(b.lid.ACHTERNAAM ?? '', 'nl');
      return achternaamDiff !== 0 ? achternaamDiff : (a.lid.VOORNAAM ?? '').localeCompare(b.lid.VOORNAAM ?? '', 'nl');
    };

    const dboLeden = ledenMetTotalen
      .filter(x => x.lid.STATUSTYPE_ID === HeliosVliegstatusTypes.DBO)
      .sort(sorteerOp);

    const solistLeden = ledenMetTotalen
      .filter(x => x.lid.STATUSTYPE_ID === HeliosVliegstatusTypes.SOLIST)
      .sort(sorteerOp);

    const datum = ymdToDutchDisplay(toYmd(baseDate));

    const html = this.mailBuilder.buildHtml({
      datum,
      jaarMin2: huidigJaar - 2,
      jaarMin1: huidigJaar - 1,
      jaarHuidig: huidigJaar,
      dboLeden,
      solistLeden,
    });

    await this.googleService.sendHtmlEmail({
      from: process.env.LEDEN_EMAIL || 'comjeugdzaken@gezc.org',
      to: process.env.DTO_EMAIL || 'dto@gezc.org',
      cc: [process.env.BESTUUR_EMAIL || 'bestuur@gezc.org'],
      subject: `DTO vluchten overzicht ${huidigJaar}`,
      html,
    });

    this.logger.log(
      `DTO vluchten mail verstuurd (${dboLeden.length} DBO'ers, ${solistLeden.length} solisten)`
    );
  }
}
