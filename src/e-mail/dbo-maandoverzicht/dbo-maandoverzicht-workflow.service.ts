import { Injectable, Logger } from '@nestjs/common';
import { toYmd } from '../../common/date.util';
import { GoogleService } from '../../google/google.service';
import { AanwezigLedenService, AanwezigLidRecord } from '../../helios/services/aanwezig-leden.service';
import { LoginService } from '../../helios/services/login.service';
import { RoosterService } from '../../helios/services/rooster.service';
import { HeliosVliegstatusTypes } from '../../helios/helios.types';
import { DboMaandoverzichtMailBuilder } from './dbo-maandoverzicht-mail.builder';

export interface DboVliegdag {
  datum: string;
  leden: AanwezigLidRecord[];
}

const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'
];

@Injectable()
export class DboMaandoverzichtWorkflowService {
  private readonly logger = new Logger(DboMaandoverzichtWorkflowService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly roosterService: RoosterService,
    private readonly aanwezigLedenService: AanwezigLedenService,
    private readonly googleService: GoogleService,
    private readonly mailBuilder: DboMaandoverzichtMailBuilder
  ) {}

  async run(): Promise<void> {
    const baseDate = new Date();
    const eersteVanDezeMaand = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const laasteVanVorigeMaand = new Date(eersteVanDezeMaand.getTime() - 1);
    const eersteVanVorigeMaand = new Date(laasteVanVorigeMaand.getFullYear(), laasteVanVorigeMaand.getMonth(), 1);

    const jaar = eersteVanVorigeMaand.getFullYear();
    const maand = eersteVanVorigeMaand.getMonth(); // 0-based
    const maandNaam = DUTCH_MONTHS[maand];

    const beginDatum = toYmd(eersteVanVorigeMaand);
    const eindDatum = toYmd(laasteVanVorigeMaand);

    this.logger.log(`Start DBO maandoverzicht workflow, periode ${beginDatum} t/m ${eindDatum}`);

    await this.loginService.login();

    const clubDagen = await this.roosterService.getClubBedrijfDagen(beginDatum, eindDatum);
    if (clubDagen.length === 0) {
      this.logger.log('Geen clubdagen gevonden in deze maand, geen mail verstuurd');
      return;
    }

    // Fetch all aanwezig-leden for the entire month in one call, then group per day
    const alleAanwezig = await this.aanwezigLedenService.getAanwezigLeden(beginDatum, eindDatum);
    const aanwezigPerDag = new Map<string, AanwezigLidRecord[]>();
    for (const record of alleAanwezig) {
      if (!record.DATUM) continue;
      if (!aanwezigPerDag.has(record.DATUM)) {
        aanwezigPerDag.set(record.DATUM, []);
      }
      aanwezigPerDag.get(record.DATUM)!.push(record);
    }

    const vliegdagen: DboVliegdag[] = clubDagen
      .filter(dag => dag.DATUM)
      .map(dag => ({
        datum: dag.DATUM!,
        leden: (aanwezigPerDag.get(dag.DATUM!) ?? [])
          .filter(l => l.STATUSTYPE_ID === HeliosVliegstatusTypes.DBO)
          .sort((a, b) => (a.NAAM ?? '').localeCompare(b.NAAM ?? '', 'nl')),
      }));

    const html = this.mailBuilder.buildHtml({ maandNaam, jaar, vliegdagen });
    await this.googleService.sendHtmlEmail({
      from: process.env.LEDEN_EMAIL || 'comjeugdzaken@gezc.org',
      to: process.env.DTO_EMAIL || 'dto@gezc.org',
      cc: [process.env.BESTUUR_EMAIL || 'bestuur@gezc.org'],
      subject: `DBO maandoverzicht ${maandNaam} ${jaar}`,
      html,
    });
    this.logger.log(`DBO maandoverzicht verstuurd voor ${maandNaam} ${jaar}`);
  }
}
