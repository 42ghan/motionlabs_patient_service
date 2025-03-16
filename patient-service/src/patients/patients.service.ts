import { Injectable } from '@nestjs/common';
import { BulkUpsertService } from './bulk-create/bulk-upsert.service';
import { PatientsListSuccessResponse } from './interfaces/list.patients.response';
import { UploadPatientsSuccessResponse } from './interfaces/upload.patients.response';
import { ScanService } from './scan/scan.service';

@Injectable()
export class PatientsService {
  constructor(
    private readonly bulkUpsertService: BulkUpsertService,
    private readonly scanService: ScanService,
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

  async handleScanWithPagination(params: {
    page: number;
    limit: number;
  }): Promise<PatientsListSuccessResponse> {
    return this.scanService.scanWithPagination(params);
  }
}
