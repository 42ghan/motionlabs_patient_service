import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Patient } from '../patients/entities/patient.entity';

@Injectable()
export class ConfigFactoryService {
  constructor(private readonly configService: ConfigService) {}

  get mySqlConfig(): TypeOrmModuleOptions {
    const mysqlUrl = this.configService.get('MYSQL_URL');
    if (!mysqlUrl) {
      throw new Error('MYSQL_URL is not set');
    }
    return {
      type: 'mysql',
      url: mysqlUrl,
      timezone: '+09:00',
      charset: 'utf8mb4',
      entities: [Patient],
      ssl: false,
    };
  }
}
