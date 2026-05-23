export interface HeliosLid {
  ID: number;
  NAAM: string;
  VOORNAAM: string | null;
  TUSSENVOEGSEL: string | null;
  ACHTERNAAM: string | null;
  ADRES: string | null;
  POSTCODE: string | null;
  WOONPLAATS: string | null;
  TELEFOON: string | null;
  MOBIEL: string | null;
  NOODNUMMER: string | null;
  EMAIL: string | null;
  LIDNR: string | null;
  LIDTYPE_ID: number;
  STATUSTYPE_ID: number | null;
  ZUSTERCLUB_ID: number | null;
  BUDDY_ID: number | null;
  BUDDY_ID2: number | null;
  LIERIST: boolean;
  LIERIST_IO: boolean;
  STARTLEIDER: boolean;
  INSTRUCTEUR: boolean;
  CIMT: boolean;
  DDWV_CREW: boolean;
  DDWV_BEHEERDER: boolean;
  BEHEERDER: boolean;
  STARTTOREN: boolean;
  ROOSTER: boolean;
  SLEEPVLIEGER: boolean;
  RAPPORTEUR: boolean;
  GASTENVLIEGER: boolean;
  TECHNICUS: boolean;
  CLUBBLAD_POST: boolean;
  ZELFSTART_ABONNEMENT: boolean;
  MEDICAL: string | null;
  GEBOORTE_DATUM: string | null;
  INLOGNAAM: string;
  AUTH: boolean;
  AVATAR: string | null;
  STARTVERBOD: boolean;
  OPGEZEGD: boolean;
  PRIVACY: boolean;
  SLEUTEL1: string | null;
  SLEUTEL2: string | null;
  BEROEP: string | null;
  KNVVL_LIDNUMMER: string | null;
  BREVET_NUMMER: string | null;
  EMAIL_DAGINFO: boolean;
  OPMERKINGEN: string | null;
  TEGOED: number;
  VERWIJDERD: boolean;
  LAATSTE_AANPASSING: string;
  PAX: boolean;
  LIDTYPE: string | null;
  LIDTYPE_REF: string | null;
  STATUS: string | null;
  ZUSTERCLUB: string | null;
  BUDDY: string | null;
  BUDDY2: string | null;
}

export enum HeliosLidTypes {
   STUDENTENLID = 600,
   ERELID = 601,
   LID = 602,
   JEUGDLID = 603,
   PRIVATE_OWNER = 604,
   VETERAAN = 605,
   DONATEUR = 606,
   ZUSTERCLUB = 607,
   RITTENKAARTHOUDER = 608,
   NIEUW_LID = 609,
   OPROTKABEL = 610,
   CURSIST = 611,
   PENNINGMEESTER = 612,
   SYSTEEM_ACCOUNT = 613,
   WACHTLIJST = 620,
   DDWV_VLIEGER = 625,
   SVS_SLEEPVLIEGER = 4144,
}

export enum HeliosDienstenTypes {
   OCHTEND_DDI = 1800,
   OVERLAP_INSTRUCTEUR = 1801,
   OCHTEND_LIERIST = 1802,
   OCHTEND_HULPLIERIST = 1803,
   OCHTEND_STARTLEIDER = 1804,
   MIDDAG_DDI = 1805,
   MIDDAG_INSTRUCTEUR = 1806,
   MIDDAG_LIERIST = 1807,
   MIDDAG_HULPLIERIST = 1808,
   MIDDAG_STARTLEIDER = 1809,
   SLEEPVLIEGER_VD_DAG = 1810,
   TWEEDE_OCHTEND_STARTLEIDER = 1811,
   TWEEDE_MIDDAG_STARTLEIDER = 1812,
   EERSTE_GASTENVLIEGER = 1813,
   TWEEDE_GASTENVLIEGER = 1814,
}

export enum HeliosVliegveldTypes {
   Terlet = 901,
   Elders = 904,
}

export enum HeliosStartMethodeTypes {
   Slepen = 501,
   Sleepkist = 502,
   Zelfstart = 506,
   TMG = 507,
   Overig = 508,
   Lieren = 550
}
