import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { HeliosModule } from './helios/helios.module';
import { GoogleModule } from './google/google.module';
import { DagrapportModule } from './e-mail/dagrapport/dagrapport.module';
import { HerinneringDagrapportModule } from './e-mail/herinnering_dagrapport/herinnering-dagrapport.module';
import { HerinneringDienstenModule } from "./e-mail/herinnering_diensten/herinnering-diensten.module";
import {LogboekModule} from "./e-mail/dagelijks-logboek/logboek.module";
import {VluchtGeenMedicalModule} from "./e-mail/vlucht_geen_medical/vlucht-geen-medical.module";
import {MedicalVerlopenModule} from "./e-mail/medical_verlopen/medical-verlopen.module";
import {RollendModule} from "./e-mail/rollend/rollend.module";
import {VliegendModule} from "./e-mail/vliegend/vliegend.module";
import {VeiligheidModule} from "./e-mail/veiligheidsmanager/veiligheid.module";
import {SvsModule} from "./e-mail/svs/svs.module";
import {PenningmeesterModule} from "./e-mail/penningmeester/penningmeester.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HELIOS_CREDENTIAL_FILE: Joi.string().optional(),
        GOOGLE_CREDENTIALS_PATH: Joi.string().required(),
        GOOGLE_ADMIN_EMAIL: Joi.string().email().required(),
        VERZENDEN_EMAIL: Joi.string().optional(),

        CRON_DAGINFO: Joi.string().optional(),
        CRON_LOGBOEK: Joi.string().optional(),
        CRON_VLUCHT_GEEN_MEDICAL: Joi.string().optional(),
        CRON_MEDICAL_VERLOPEN: Joi.string().optional(),
        CRON_VLUCHT_BEVOEGHEID: Joi.string().optional(),
        CRON_ROLLEND: Joi.string().optional(),
        CRON_VLIEGEND: Joi.string().optional(),
        CRON_VEILIGHEIDSMANAGER: Joi.string().optional(),
        CRON_SVS: Joi.string().optional(),
        CRON_PENNINGMEESTER: Joi.string().optional(),
        CRON_HERINNERING_DAGINFO: Joi.string().optional(),
        CRON_HERINNERING_DIENSTEN: Joi.string().optional(),
        CRON_TIMEZONE: Joi.string().optional(),

        DAGINFO_ALWAYS_TO: Joi.string().allow('').optional(),

        PENNINGMEESTER_EMAIL: Joi.string().email().optional(),
        STARTADMIN_EMAIL: Joi.string().email().optional(),
        CIMT_EMAIL: Joi.string().email().optional(),
        ICT_EMAIL: Joi.string().email().optional(),
        ROLLEND_EMAIL: Joi.string().email().optional(),
        VLIEGEND_EMAIL: Joi.string().email().optional(),
        VEILIGHEID_EMAIL: Joi.string().email().optional(),
        SVS_EMAIL: Joi.string().email().optional(),
      })
    }),
    ScheduleModule.forRoot(),
    HeliosModule,
    GoogleModule,
    LogboekModule,
    DagrapportModule,
    VluchtGeenMedicalModule,
    MedicalVerlopenModule,
    RollendModule,
    VliegendModule,
    VeiligheidModule,
    SvsModule,
    PenningmeesterModule,
    HerinneringDienstenModule,
    HerinneringDagrapportModule
  ]
})
export class AppModule {}
