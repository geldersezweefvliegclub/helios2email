import { Module } from '@nestjs/common';
import { MessageBirdService } from './messagebird.service';

// Module die de MessageBird SMS service beschikbaar maakt voor andere modules
@Module({
  providers: [MessageBirdService],
  exports: [MessageBirdService]
})
export class SmsModule {}
