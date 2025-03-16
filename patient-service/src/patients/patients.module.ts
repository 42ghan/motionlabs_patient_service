import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulkUpsertModule } from './bulk-create/bulk-upsert.module';
import { Patient } from './entities/patient.entity';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { ScanModule } from './scan/scan.module';

@Module({
  imports: [TypeOrmModule.forFeature([Patient]), BulkUpsertModule, ScanModule],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}
