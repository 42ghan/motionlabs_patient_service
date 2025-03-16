import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Patient } from '../patients/entities/patient.entity';

@Injectable()
export class ConfigFactoryService {
  constructor(private readonly configService: ConfigService) {}

  get mySqlConfig(): TypeOrmModuleOptions {
    if (!this.configService.get('MYSQL_URL')) {
      throw new Error('MYSQL_URL is not set');
    }
    return {
      type: 'mysql',
      url: this.configService.get('MYSQL_URL'),
      timezone: '+09:00',
      charset: 'utf8mb4',
      entities: [Patient],
    };
  }
}
