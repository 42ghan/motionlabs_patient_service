import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import { Patient } from '../entities/patient.entity';
import { BulkUpsertService } from './bulk-upsert.service';
import { RecordValidatorService } from './record-validator/record-validator.service';
import { UpsertDecisionService } from './upsert-decision/upsert-decision.service';
import { XlsxHandlerService } from './xlsx-handler/xlsx-handler.service';

describe('BulkUpsertService', () => {
  let service: BulkUpsertService;

  const mockEntityManager: {
    query: jest.Mock;
    createQueryBuilder: jest.Mock;
    insert: jest.Mock;
    into: jest.Mock;
    values: jest.Mock;
    execute: jest.Mock;
    transaction: jest.Mock;
  } = {
    query: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    transaction: jest.fn((cb) => cb(mockEntityManager)),
  };

  const mockPatientRepository = {
    manager: mockEntityManager,
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockXlsxHandlerService = {
    transformFileBufferToWorkBook: jest.fn(),
    validateSheets: jest.fn(),
    transformSheetsToJsonRowStreams: jest.fn(),
  };

  const mockRecordValidatorService = {
    validateAndTransformToEntity: jest.fn(),
  };

  const mockUpsertDecisionService = {
    decideUpdateOrInsert: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkUpsertService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
        {
          provide: XlsxHandlerService,
          useValue: mockXlsxHandlerService,
        },
        {
          provide: RecordValidatorService,
          useValue: mockRecordValidatorService,
        },
        {
          provide: UpsertDecisionService,
          useValue: mockUpsertDecisionService,
        },
      ],
    }).compile();

    service = module.get<BulkUpsertService>(BulkUpsertService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('bulkUpsertPatientsFromXlsxFile', () => {
    const mockWorkbook: XLSX.WorkBook = {
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {},
      },
      Props: {},
    };

    const mockValidPatients = [
      {
        name: '홍길동',
        phoneNumber: '01012345678',
        residentRegistrationNumber: '900101-1******',
        chartNumber: '12345',
        address: '서울시',
        memo: '메모1',
      },
      {
        name: '김철수',
        phoneNumber: '01087654321',
        residentRegistrationNumber: '900202-1******',
        chartNumber: '67890',
        address: '부산시',
        memo: '메모2',
      },
    ];

    it('should successfully process valid excel file', async () => {
      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });

      mockXlsxHandlerService.transformFileBufferToWorkBook.mockReturnValue(
        mockWorkbook,
      );
      mockXlsxHandlerService.validateSheets.mockReturnValue([{}]);
      mockXlsxHandlerService.transformSheetsToJsonRowStreams.mockReturnValue([
        mockStream,
      ]);

      mockRecordValidatorService.validateAndTransformToEntity.mockResolvedValue(
        {
          patientEntities: mockValidPatients,
          failedCount: 0,
        },
      );

      mockUpsertDecisionService.decideUpdateOrInsert.mockResolvedValue({
        toUpdateEntities: [{ id: 1, ...mockValidPatients[0] }],
        toInsertEntities: [mockValidPatients[1]],
      });

      mockEntityManager.query.mockResolvedValue({ affected: 1 });
      mockEntityManager.execute.mockResolvedValue({ raw: [], affected: 1 });

      const result = await service.bulkUpsertPatientsFromXlsxFile({
        fileBuffer: Buffer.from('dummy'),
      });

      expect(result).toEqual({
        processedCount: 2,
        failedCount: 0,
      });

      expect(
        mockXlsxHandlerService.transformFileBufferToWorkBook,
      ).toHaveBeenCalled();
      expect(mockXlsxHandlerService.validateSheets).toHaveBeenCalled();
      expect(
        mockRecordValidatorService.validateAndTransformToEntity,
      ).toHaveBeenCalled();
      expect(mockUpsertDecisionService.decideUpdateOrInsert).toHaveBeenCalled();
      expect(mockEntityManager.query).toHaveBeenCalled();
      expect(mockEntityManager.execute).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid excel file', async () => {
      mockXlsxHandlerService.transformFileBufferToWorkBook.mockImplementation(
        () => {
          throw new Error('Invalid file');
        },
      );

      await expect(
        service.bulkUpsertPatientsFromXlsxFile({
          fileBuffer: Buffer.from('invalid'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for excel file without sheets', async () => {
      mockXlsxHandlerService.transformFileBufferToWorkBook.mockReturnValue({
        ...mockWorkbook,
        SheetNames: [],
      });

      await expect(
        service.bulkUpsertPatientsFromXlsxFile({
          fileBuffer: Buffer.from('no sheets'),
        }),
      ).rejects.toThrow('유효하지 않은 엑셀 파일입니다.');
    });

    it('should handle validation failures correctly', async () => {
      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });

      mockXlsxHandlerService.transformFileBufferToWorkBook.mockReturnValue(
        mockWorkbook,
      );
      mockXlsxHandlerService.validateSheets.mockReturnValue([{}]);
      mockXlsxHandlerService.transformSheetsToJsonRowStreams.mockReturnValue([
        mockStream,
      ]);

      mockRecordValidatorService.validateAndTransformToEntity.mockResolvedValue(
        {
          patientEntities: [mockValidPatients[0]],
          failedCount: 1,
        },
      );

      mockUpsertDecisionService.decideUpdateOrInsert.mockResolvedValue({
        toUpdateEntities: [],
        toInsertEntities: [mockValidPatients[0]],
      });

      mockEntityManager.execute.mockResolvedValue({ raw: [], affected: 1 });

      const result = await service.bulkUpsertPatientsFromXlsxFile({
        fileBuffer: Buffer.from('dummy'),
      });

      expect(result).toEqual({
        processedCount: 1,
        failedCount: 1,
      });
    });

    it('should process batch operations correctly', async () => {
      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });

      // 많은 수의 환자 데이터 생성
      const manyPatients = Array.from({ length: 1000 }, (_, i) => ({
        name: `환자${i}`,
        phoneNumber: `0101234${i.toString().padStart(4, '0')}`,
        residentRegistrationNumber: '900101-1******',
        chartNumber: i.toString(),
        address: '서울시',
        memo: `메모${i}`,
      }));

      mockXlsxHandlerService.transformFileBufferToWorkBook.mockReturnValue(
        mockWorkbook,
      );
      mockXlsxHandlerService.validateSheets.mockReturnValue([{}]);
      mockXlsxHandlerService.transformSheetsToJsonRowStreams.mockReturnValue([
        mockStream,
      ]);

      mockRecordValidatorService.validateAndTransformToEntity.mockResolvedValue(
        {
          patientEntities: manyPatients,
          failedCount: 0,
        },
      );

      mockUpsertDecisionService.decideUpdateOrInsert.mockResolvedValue({
        toUpdateEntities: manyPatients
          .slice(0, 500)
          .map((p, i) => ({ id: i + 1, ...p })),
        toInsertEntities: manyPatients.slice(500),
      });

      mockEntityManager.query.mockResolvedValue({ affected: 500 });
      mockEntityManager.execute.mockResolvedValue({ raw: [], affected: 500 });

      const result = await service.bulkUpsertPatientsFromXlsxFile({
        fileBuffer: Buffer.from('dummy'),
      });

      expect(result).toEqual({
        processedCount: 1000,
        failedCount: 0,
      });

      // 배치 처리가 올바르게 이루어졌는지 확인
      expect(mockEntityManager.query).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.execute).toHaveBeenCalledTimes(1);
    });
  });
});
