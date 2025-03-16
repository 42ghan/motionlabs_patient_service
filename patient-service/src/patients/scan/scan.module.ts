import { Module } from '@nestjs/common';
import { ScanService } from './scan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../entities/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  providers: [ScanService],
  exports: [ScanService],
})
export class ScanModule {}
