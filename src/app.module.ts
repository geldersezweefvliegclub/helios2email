import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { HeliosModule } from './helios/helios.module';
import { GoogleModule } from './google/google.module';
import { DagrapportModule } from './dagrapport/dagrapport.module';
import { HerinneringDagrapportModule } from './herinnering_dagrapport/herinnering-dagrapport.module';
import { HerinneringDienstenModule } from "./herinnering_diensten/herinnering-diensten.module";
import {LogboekModule} from "./dagelijks-logboek/logboek.module";

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
        CRON_LOGBOOK: Joi.string().optional(),
        CRON_VLUCHT_GEEN_MEDICAL: Joi.string().optional(),
        CRON_VLUCHT_BEVOEGHEID: Joi.string().optional(),
        CRON_PENNINGMEESTER: Joi.string().optional(),
        CRON_HERINNERING_DAGINFO: Joi.string().optional(),
        CRON_HERINNERING_DIENSTEN: Joi.string().optional(),
        CRON_TIMEZONE: Joi.string().optional(),

        DAGINFO_ALWAYS_TO: Joi.string().allow('').optional(),

        PENNINGMEESTER_EMAIL: Joi.string().email().optional(),
        STARTADMIN_EMAIL: Joi.string().email().optional(),
        CIMT_EMAIL: Joi.string().email().optional(),
      })
    }),
    ScheduleModule.forRoot(),
    HeliosModule,
    GoogleModule,
    LogboekModule,
    DagrapportModule,
    HerinneringDienstenModule,
    HerinneringDagrapportModule
  ]
})
export class AppModule {}
