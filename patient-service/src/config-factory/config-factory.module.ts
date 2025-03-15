import { Module } from '@nestjs/common';
import { ConfigFactoryService } from './config-factory.service';

@Module({
  providers: [ConfigFactoryService],
  exports: [ConfigFactoryService],
})
export class ConfigFactoryModule {}
