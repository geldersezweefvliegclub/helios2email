import { Injectable, Logger } from '@nestjs/common';
import { toYmd } from '../../common/date.util';
import { GoogleService } from '../../google/google.service';
import { LedenService } from '../../helios/services/leden.service';
import { LoginService } from '../../helios/services/login.service';
import { ProgressieService } from '../../helios/services/progressie.service';
import { StartlijstService } from '../../helios/services/startlijst.service';
import { VliegtuigenService } from '../../helios/services/vliegtuigen.service';
import { VluchtBevoegheidMailBuilder } from './vlucht-bevoegheid-mail.builder';
import {buildEmailErrorHtml} from "../../common/error-mail.builder";

@Injectable()
export class VluchtBevoegheidWorkflowService {
  private readonly logger = new Logger(VluchtBevoegheidWorkflowService.name);


  constructor(
    private readonly loginService: LoginService,
    private readonly startlijstService: StartlijstService,
    private readonly vliegtuigenService: VliegtuigenService,
    private readonly ledenService: LedenService,
    private readonly progressieService: ProgressieService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: VluchtBevoegheidMailBuilder
  ) {}

  /**
   * Voert de vlucht-bevoegheid workflow uit voor een gegeven datum.
   * Controleert alle vluchten van de dag en stuurt emails naar vliegers die onbevoegd hebben gevlogen.
   */
  async run(baseDate = new Date()): Promise<void> {
    const datum = toYmd(baseDate);
    this.logger.log(`Start vlucht-bevoegheid workflow, datum ${datum}`);

    // Inloggen bij Helios
    await this.loginService.login();

    // Haal starts op voor de dag
    const starts = await this.startlijstService.getStartsVoorDag(datum);
    if (!starts.length) {
      this.logger.log('Geen starts gevonden, geen bevoegdheid check nodig.');
      return;
    }

    // Haal clubvliegtuigen op en bouw indexen
    const clubVliegtuigen = await this.vliegtuigenService.getClubVliegtuigen();
    const clubVliegtuigenById = new Map<number, typeof clubVliegtuigen[number]>();
    const competentieIds = new Set<number>();

    for (const vliegtuig of clubVliegtuigen) {
      if (!vliegtuig.ID) continue;
      clubVliegtuigenById.set(vliegtuig.ID, vliegtuig);

      // maak een lijst van alle bevoegdheden van alle vliegtuigen, maakt straks ophalen progressie makkelijker
      if (vliegtuig.BEVOEGDHEID_LOKAAL_ID) competentieIds.add(vliegtuig.BEVOEGDHEID_LOKAAL_ID);
      if (vliegtuig.BEVOEGDHEID_OVERLAND_ID) competentieIds.add(vliegtuig.BEVOEGDHEID_OVERLAND_ID);
    }

    // Verzamel unieke vlieger IDs van starts die geen instructievlucht zijn
    const vliegers = new Set<number>();
    for (const start of starts) {
      if (start.STARTTIJD && start.VLIEGER_ID && !start.INSTRUCTIEVLUCHT) {
        vliegers.add(start.VLIEGER_ID);
      }
    }

    // Controleer bevoegdheid voor elke vlieger
    for (const lidId of vliegers) {
      const lid = await this.ledenService.getLidById(lidId);    // ophalen lid gegevens

      // Haal progressies en bevoegdheden die lid heeft, beperk de opvraag tot de benodigde competenties
      const progressies = await this.progressieService.getProgressiesForLid(lidId, [...competentieIds]);
      const bevoegdheden = new Set(progressies.map((p) => p.COMPETENTIE_ID).filter((v): v is number => typeof v === 'number'));
      const vluchten = await this.startlijstService.getLogboekVoorLid(lidId, datum);
      const onbevoegdIds = new Set<number>();

      // Controleer elke vlucht of de bevoegdheid aanwezig is
      for (const vlucht of vluchten) {
        const zelfPic = vlucht.VLIEGER_ID === lidId && vlucht.INSTRUCTIEVLUCHT === false;
        if (!zelfPic || !vlucht.VLIEGTUIG_ID) {
          continue;
        }

        // Welke bevoegdheden nodig zijn om te vliegen met het vliegtuig
        const vliegtuig = clubVliegtuigenById.get(vlucht.VLIEGTUIG_ID);
        if (!vliegtuig) {
          continue;   // Er is niet gevlogen op een clubkist, dus we hoeven de bevoegdheid niet controleren
        }

        const lokaal = vliegtuig.BEVOEGDHEID_LOKAAL_ID;
        const overland = vliegtuig.BEVOEGDHEID_OVERLAND_ID;
        const vereist = [lokaal, overland].filter((v): v is number => typeof v === 'number');
        if (!vereist.length) {
          continue;
        }
        // vereist bevat nu een array met lokaal en overland competenties die nodig zijn voor dit vliegtuig

        // minimaal 1 bevoegdheid is nodig om op dit vliegtuig te vliegen
        const bevoegd = vereist.some((id) => bevoegdheden.has(id));
        if (!bevoegd && vliegtuig.ID) {
          onbevoegdIds.add(vliegtuig.ID);       // ojee, vlieger heeft niet de juiste competentie
        }
      }

      if (!onbevoegdIds.size) {
        continue;                               // alles is in orde, geen e-mail nodig
      }

      // Bouw callsigns lijst voor de e-mail
      const callsigns = [...onbevoegdIds]
        .map((id) => clubVliegtuigenById.get(id)?.CALLSIGN)
        .filter(Boolean)
        .join(', ');

      // Als we geen e-mail adres hebben, dan ICT en CIMT verwittigen
      if (!lid.EMAIL) {
        const html = buildEmailErrorHtml("Bevoegdheden, geen e-mail", `<p>${lid.NAAM} heeft gevlogen op ${datum} zonder bevoegheid op ${callsigns}, maar heeft geen emailadres. Onderneem aktie</p>`);
        await this.googleService.sendHtmlEmail({
          to: process.env.ICT || 'ict@gezc.org',
          cc: [process.env.CIMT_EMAIL || 'cimt@gezc.org'],
          subject: 'Bevoegdheid, e-mail ontbeekt',
          html
        });
        this.logger.warn(`${lid.NAAM} heeft geen email address. Mail naar ICT en CIMT gestuurd`);
        continue;
      }

      // maak de inhoud van de e-mail
      const html = this.mailBuilder.buildHtml({
        voornaam: lid.VOORNAAM || lid.NAAM || '',
        callsigns
      });

      // Verstuur e-mail
      await this.googleService.sendHtmlEmail({
        to: lid.EMAIL,
        cc: [process.env.CIMT_EMAIL || 'cimt@gezc.org'],
        subject: `Bevoegdheid ${callsigns} ${lid.NAAM}`,
        html
      });
      this.logger.log(`Bevoegdheid email verzonden naar ${lid.EMAIL}`);
    }
  }
}
