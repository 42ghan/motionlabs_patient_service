import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { ScanService } from './scan.service';
import { Patient } from '../entities/patient.entity';

describe('ScanService', () => {
  let service: ScanService;
  let patientRepository: Repository<Patient>;

  const mockPatients = [
    {
      id: 1,
      chartNumber: '12345',
      name: '홍길동',
      memo: '메모1',
      address: '서울시',
      phoneNumber: '01012345678',
      residentRegistrationNumber: '900101-1******',
      createdAt: DateTime.fromISO('2024-01-01T00:00:00.000Z'),
      updatedAt: DateTime.fromISO('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 2,
      chartNumber: null,
      name: '김철수',
      memo: '메모2',
      address: '부산시',
      phoneNumber: '01087654321',
      residentRegistrationNumber: '900202-2******',
      createdAt: DateTime.fromISO('2024-01-02T00:00:00.000Z'),
      updatedAt: DateTime.fromISO('2024-01-02T00:00:00.000Z'),
    },
  ];

  const mockPatientRepository = {
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScanService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
      ],
    }).compile();

    service = module.get<ScanService>(ScanService);
    patientRepository = module.get<Repository<Patient>>(
      getRepositoryToken(Patient),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scanWithPagination', () => {
    it('should handle custom page and limit values', async () => {
      mockPatientRepository.findAndCount.mockResolvedValue([
        [mockPatients[0]],
        2,
      ]);

      const result = await service.scanWithPagination({
        page: 2,
        limit: 1,
      });

      expect(result).toEqual({
        results: [
          {
            id: 1,
            chartNumber: '12345',
            name: '홍길동',
            memo: '메모1',
            address: '서울시',
            phoneNumber: '01012345678',
            residentRegistrationNumber: '900101-1******',
            createdAt: mockPatients[0].createdAt.toISO()!,
            updatedAt: mockPatients[0].updatedAt.toISO()!,
          },
        ],
        total: 2,
        totalPages: 2,
        currentPage: 2,
        limit: 1,
      });

      expect(patientRepository.findAndCount).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        skip: 1,
        take: 1,
      });
    });

    it('should handle empty results', async () => {
      mockPatientRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.scanWithPagination({
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        results: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 20,
      });
    });

    it('should limit maximum page size to 100', async () => {
      mockPatientRepository.findAndCount.mockResolvedValue([mockPatients, 2]);

      await service.scanWithPagination({
        page: 1,
        limit: 200,
      });

      expect(patientRepository.findAndCount).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        skip: 0,
        take: 100,
      });
    });

    it('should handle invalid page numbers', async () => {
      mockPatientRepository.findAndCount.mockResolvedValue([mockPatients, 2]);

      await service.scanWithPagination({
        page: -1,
        limit: 20,
      });

      expect(patientRepository.findAndCount).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should transform patient data correctly', async () => {
      const patientWithNullValues = {
        ...mockPatients[0],
        chartNumber: null,
        memo: null,
        address: null,
      };

      mockPatientRepository.findAndCount.mockResolvedValue([
        [patientWithNullValues],
        1,
      ]);

      const result = await service.scanWithPagination({
        page: 1,
        limit: 20,
      });

      expect(result.results[0]).toEqual({
        id: 1,
        name: '홍길동',
        phoneNumber: '01012345678',
        residentRegistrationNumber: '900101-1******',
        createdAt: mockPatients[0].createdAt.toISO()!,
        updatedAt: mockPatients[0].updatedAt.toISO()!,
      });
    });
  });
});
