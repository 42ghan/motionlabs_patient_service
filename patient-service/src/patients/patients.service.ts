import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BulkUpsertService } from './bulk-create/bulk-upsert.service';
import { Patient } from './entities/patient.entity';
import { UploadPatientsSuccessResponse } from './interfaces/upload.patients.response';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly bulkUpsertService: BulkUpsertService,
  ) {}

  async handleUploadedFileToBulkCreate({
    uploadedFile,
  }: {
    uploadedFile: Express.Multer.File;
  }): Promise<UploadPatientsSuccessResponse> {
    const { processedCount, failedCount } =
      await this.bulkUpsertService.bulkUpsertPatientsFromXlsxFile({
        fileBuffer: uploadedFile.buffer,
      });

    return {
      success: true,
      processedCount,
      failedCount,
    };
  }

  findAll() {
    return `This action returns all patients`;
  }
}
