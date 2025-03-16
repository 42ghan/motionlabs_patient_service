import { Readable } from 'stream';
import { EntityManager, InsertResult, Repository } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from '../entities/patient.entity';
import { UploadPatientsSuccessResponse } from '../interfaces/upload.patients.response';
import { RAW_PATIENT_PROPERTIES } from './constants';
import { RecordValidatorService } from './record-validator/record-validator.service';
import {
  InsertingPatientEntity,
  UpdatingPatientEntity,
  UpsertDecisionService,
} from './upsert-decision/upsert-decision.service';
import { XlsxHandlerService } from './xlsx-handler/xlsx-handler.service';

@Injectable()
export class BulkUpsertService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly xlsxHandlerService: XlsxHandlerService,
    private readonly recordValidatorService: RecordValidatorService,
    private readonly upsertDecisionService: UpsertDecisionService,
  ) {}

  async bulkUpsertPatientsFromXlsxFile({
    fileBuffer,
  }: {
    fileBuffer: Buffer;
  }): Promise<Omit<UploadPatientsSuccessResponse, 'success'>> {
    let jsonRowStreams: Readable[];
    try {
      jsonRowStreams = this.extractDataFromFileBuffer({ fileBuffer });
    } catch {
      throw new BadRequestException('유효하지 않은 엑셀 파일입니다.');
    }

    const { patientEntities, failedCount } =
      await this.recordValidatorService.validateAndTransformToEntity({
        jsonRowStreams,
      });

    const { toUpdateEntities, toInsertEntities } =
      await this.upsertDecisionService.decideUpdateOrInsert({
        entitiesToUpsert: patientEntities,
      });

    await this.bulkUpsertPatients({
      toUpdateEntities,
      toInsertEntities,
    });

    return {
      failedCount,
      processedCount: patientEntities.length,
    };
  }

  private async bulkUpsertPatients({
    toUpdateEntities,
    toInsertEntities,
  }: {
    toUpdateEntities: UpdatingPatientEntity[];
    toInsertEntities: InsertingPatientEntity[];
  }) {
    await this.patientRepository.manager.transaction(async (manager) => {
      await this.executeBatch({
        targets: toUpdateEntities,
        executeFn: async (batch) => {
          await this.updateBulkPatients({ batch, manager });
        },
      });
      const promises: Promise<InsertResult>[] = [];
      await this.executeBatch({
        targets: toInsertEntities,
        executeFn: async (batch) => {
          promises.push(this.insertBulkPatients({ batch, manager }));
        },
      });
      await Promise.all(promises);
      return;
    });
  }

  private extractDataFromFileBuffer({
    fileBuffer,
  }: {
    fileBuffer: Buffer;
  }): Readable[] {
    const workbook = this.xlsxHandlerService.transformFileBufferToWorkBook({
      fileBuffer,
    });
    if (workbook.SheetNames.length === 0) {
      throw new Error('sheet 가 없습니다.');
    }
    const validatedSheets = this.xlsxHandlerService.validateSheets({
      requiredColumnNames: RAW_PATIENT_PROPERTIES,
      sheetNames: workbook.SheetNames,
      sheets: workbook.Sheets,
    });
    return this.xlsxHandlerService.transformSheetsToJsonRowStreams({
      sheets: validatedSheets,
    });
  }

  private async updateBulkPatients({
    batch,
    manager,
  }: {
    batch: Pick<
      Patient,
      | 'id'
      | 'address'
      | 'memo'
      | 'chartNumber'
      | 'residentRegistrationNumber'
      | 'phoneNumber'
      | 'name'
    >[];
    manager: EntityManager;
  }) {
    if (batch.length === 0) {
      return;
    }

    const updateParams: (string | number | null)[] = [];
    const setClauses: { column: string; clause: string }[] = [];

    const updatableFields = [
      'address',
      'memo',
      'chart_number',
      'resident_registration_number',
    ];

    updatableFields.forEach((column) => {
      const cases = batch.map(() => `WHEN ? THEN ?`).join(' ');
      setClauses.push({ column, clause: `CASE id ${cases} END` });

      batch.forEach((p) => {
        const id = p.id;
        let value = null;
        switch (column) {
          case 'address':
            value = p.address ?? null;
            break;
          case 'memo':
            value = p.memo ?? null;
            break;
          case 'chart_number':
            value = p.chartNumber ?? '';
            break;
          case 'resident_registration_number':
            value = p.residentRegistrationNumber ?? null;
            break;
          default:
        }
        updateParams.push(id, value);
      });
    });

    // Extract patient IDs for the WHERE clause
    const ids = batch.map((p) => p.id);
    updateParams.push(...ids);

    // Construct final update query
    const updateQuery = `
      UPDATE patients
      SET 
        ${setClauses.map(({ column, clause }) => `${column} = ${clause}`).join(', ')}
      WHERE id IN (${ids.map(() => '?').join(', ')});
    `;

    return manager.query(updateQuery, updateParams);
  }

  private async insertBulkPatients({
    batch,
    manager,
  }: {
    batch: Partial<Patient>[];
    manager: EntityManager;
  }) {
    return manager
      .createQueryBuilder()
      .insert()
      .into(Patient)
      .values(batch)
      .execute();
  }

  private async executeBatch<T>({
    targets,
    batchSize = 500,
    executeFn,
  }: {
    targets: T[];
    batchSize?: number;
    executeFn: (batch: T[]) => Promise<void>;
  }) {
    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      await executeFn(batch);
    }
  }
}
