import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../entities/patient.entity';
import { BulkUpsertService } from './bulk-upsert.service';
import { RecordValidatorService } from './record-validator/record-validator.service';
import { UpsertDecisionService } from './upsert-decision/upsert-decision.service';
import { XlsxHandlerService } from './xlsx-handler/xlsx-handler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  providers: [
    BulkUpsertService,
    XlsxHandlerService,
    RecordValidatorService,
    UpsertDecisionService,
  ],
  exports: [BulkUpsertService],
})
export class BulkUpsertModule {}
