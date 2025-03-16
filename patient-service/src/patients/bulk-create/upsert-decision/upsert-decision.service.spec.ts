import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportablePatientEntity } from '../record-validator/record-validator.service';
import { Patient } from '../../entities/patient.entity';
import { UpsertDecisionService } from './upsert-decision.service';

describe('UpsertDecisionService', () => {
  let service: UpsertDecisionService;
  let patientRepository: Repository<Patient>;

  const mockPatientRepository = {
    create: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsertDecisionService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
      ],
    }).compile();

    service = module.get<UpsertDecisionService>(UpsertDecisionService);
    patientRepository = module.get<Repository<Patient>>(
      getRepositoryToken(Patient),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('decideUpdateOrInsert', () => {
    it('should decide to insert when no matching patient exists', async () => {
      const newPatient: ImportablePatientEntity = {
        name: '홍길동',
        phoneNumber: '01012345678',
        residentRegistrationNumber: '900101-1******',
        chartNumber: '12345',
        address: '서울시',
        memo: '메모',
      };

      mockPatientRepository.query.mockResolvedValue([]);
      mockPatientRepository.create.mockImplementation((entity) => entity);

      const result = await service.decideUpdateOrInsert({
        entitiesToUpsert: [newPatient],
      });

      expect(result.toInsertEntities).toHaveLength(1);
      expect(result.toUpdateEntities).toHaveLength(0);
      expect(result.toInsertEntities[0]).toEqual(newPatient);
    });

    it('should decide to update when patient with same chart number exists', async () => {
      const existingPatient = {
        id: '1',
        name: '홍길동',
        phone_number: '01012345678',
        chart_number: '12345',
        resident_registration_number: '900101-1******',
        address: '서울시',
        memo: '이전 메모',
      };

      const newPatientData: ImportablePatientEntity = {
        name: '홍길동',
        phoneNumber: '01012345678',
        residentRegistrationNumber: '900101-1******',
        chartNumber: '12345',
        address: '서울시 강남구',
        memo: '새로운 메모',
      };

      mockPatientRepository.query.mockResolvedValue([existingPatient]);
      mockPatientRepository.create.mockImplementation((entity) => ({
        ...entity,
        id: parseInt(existingPatient.id),
      }));

      const result = await service.decideUpdateOrInsert({
        entitiesToUpsert: [newPatientData],
      });

      expect(result.toUpdateEntities).toHaveLength(1);
      expect(result.toInsertEntities).toHaveLength(0);
      expect(result.toUpdateEntities[0]).toEqual({
        id: 1,
        ...newPatientData,
      });
    });

    it('should decide to update when patient exists without chart number', async () => {
      const existingPatient = {
        id: '1',
        name: '홍길동',
        phone_number: '01012345678',
        chart_number: null,
        resident_registration_number: '900101-1******',
        address: '서울시',
        memo: '이전 메모',
      };

      const newPatientData: ImportablePatientEntity = {
        name: '홍길동',
        phoneNumber: '01012345678',
        residentRegistrationNumber: '900101-1******',
        chartNumber: '12345',
        address: '서울시 강남구',
        memo: '새로운 메모',
      };

      mockPatientRepository.query.mockResolvedValue([existingPatient]);
      mockPatientRepository.create.mockImplementation((entity) => ({
        ...entity,
        id: parseInt(existingPatient.id),
      }));

      const result = await service.decideUpdateOrInsert({
        entitiesToUpsert: [newPatientData],
      });

      expect(result.toUpdateEntities).toHaveLength(1);
      expect(result.toInsertEntities).toHaveLength(0);
      expect(result.toUpdateEntities[0]).toEqual({
        id: 1,
        ...newPatientData,
      });
    });

    it('should decide to insert when patient exists with different chart number', async () => {
      const existingPatient = {
        id: '1',
        name: '홍길동',
        phone_number: '01012345678',
        chart_number: '99999',
        resident_registration_number: '900101-1******',
        address: '서울시',
        memo: '이전 메모',
      };

      const newPatientData: ImportablePatientEntity = {
        name: '홍길동',
        phoneNumber: '01012345678',
        residentRegistrationNumber: '900101-1******',
        chartNumber: '12345',
        address: '서울시 강남구',
        memo: '새로운 메모',
      };

      mockPatientRepository.query.mockResolvedValue([existingPatient]);
      mockPatientRepository.create.mockImplementation((entity) => ({
        ...entity,
        id: parseInt(existingPatient.id),
      }));

      const result = await service.decideUpdateOrInsert({
        entitiesToUpsert: [newPatientData],
      });

      expect(result.toInsertEntities).toHaveLength(1);
      expect(result.toUpdateEntities).toHaveLength(0);
      expect(result.toInsertEntities[0]).toEqual(newPatientData);
    });

    it('should handle multiple patients correctly', async () => {
      const existingPatients = [
        {
          id: '1',
          name: '홍길동',
          phone_number: '01012345678',
          chart_number: '12345',
          resident_registration_number: '900101-1******',
          address: '서울시',
          memo: '메모1',
        },
        {
          id: '2',
          name: '김철수',
          phone_number: '01087654321',
          chart_number: null,
          resident_registration_number: '900202-1******',
          address: '부산시',
          memo: '메모2',
        },
      ];

      const newPatientsData: ImportablePatientEntity[] = [
        {
          name: '홍길동',
          phoneNumber: '01012345678',
          residentRegistrationNumber: '900101-1******',
          chartNumber: '12345',
          address: '서울시 강남구',
          memo: '새로운 메모1',
        },
        {
          name: '김철수',
          phoneNumber: '01087654321',
          residentRegistrationNumber: '900202-1******',
          chartNumber: '67890',
          address: '부산시 해운대구',
          memo: '새로운 메모2',
        },
        {
          name: '이영희',
          phoneNumber: '01011112222',
          residentRegistrationNumber: '900303-2******',
          chartNumber: '13579',
          address: '대구시',
          memo: '새로운 메모3',
        },
      ];

      mockPatientRepository.query.mockResolvedValue(existingPatients);
      mockPatientRepository.create.mockImplementation((entity) => {
        const matchingExisting = existingPatients.find(
          (ep) =>
            ep.name === entity.name && ep.phone_number === entity.phoneNumber,
        );
        return matchingExisting
          ? { ...entity, id: parseInt(matchingExisting.id) }
          : entity;
      });

      const result = await service.decideUpdateOrInsert({
        entitiesToUpsert: newPatientsData,
      });

      expect(result.toUpdateEntities).toHaveLength(2);
      expect(result.toInsertEntities).toHaveLength(1);

      // 홍길동: 차트번호가 같아서 업데이트
      expect(result.toUpdateEntities).toContainEqual({
        id: 1,
        ...newPatientsData[0],
      });

      // 김철수: 차트번호가 없었던 환자라 업데이트
      expect(result.toUpdateEntities).toContainEqual({
        id: 2,
        ...newPatientsData[1],
      });

      // 이영희: 새로운 환자라 삽입
      expect(result.toInsertEntities).toContainEqual(newPatientsData[2]);
    });

    it('should handle empty input correctly', async () => {
      const result = await service.decideUpdateOrInsert({
        entitiesToUpsert: [],
      });

      expect(result.toUpdateEntities).toHaveLength(0);
      expect(result.toInsertEntities).toHaveLength(0);
      expect(patientRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.any(Array),
      );
    });
  });
});
