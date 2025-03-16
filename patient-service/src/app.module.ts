import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigFactoryService } from './config-factory/config-factory.service';
import { PatientsModule } from './patients/patients.module';
import { ConfigFactoryModule } from './config-factory/config-factory.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './interceptor/logging/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigFactoryModule],
      useFactory: (configFactoryService: ConfigFactoryService) =>
        configFactoryService.mySqlConfig,
      inject: [ConfigFactoryService],
    }),
    PatientsModule,
  ],
  providers: [
    ConfigFactoryService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
