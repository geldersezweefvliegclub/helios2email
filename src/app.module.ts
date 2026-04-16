import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { HeliosModule } from './helios/helios.module';
import { GoogleModule } from './google/google.module';
import { DagrapportModule } from './dagrapport/dagrapport.module';
import { HerinneringDagrapportModule } from './herinnering_dagrapport/herinnering-dagrapport.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        GOOGLE_CREDENTIALS_PATH: Joi.string().required(),
        GOOGLE_ADMIN_EMAIL: Joi.string().email().required(),
        VERZENDEN_EMAIL: Joi.string().optional(),
        CRON_DAGINFO: Joi.string().optional(),
        CRON_HERINNERING_DAGINFO: Joi.string().optional(),
        CRON_TIMEZONE: Joi.string().optional(),
        HELIOS_CREDENTIAL_FILE: Joi.string().optional(),
        DAGINFO_ALWAYS_TO: Joi.string().allow('').optional(),
      })
    }),
    ScheduleModule.forRoot(),
    HeliosModule,
    GoogleModule,
    DagrapportModule,
    HerinneringDagrapportModule
  ]
})
export class AppModule {}
