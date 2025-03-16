import { Test, TestingModule } from '@nestjs/testing';
import { RecordValidatorService } from './record-validator.service';
import { Readable } from 'stream';

describe('RecordValidatorService', () => {
  let service: RecordValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecordValidatorService],
    }).compile();

    service = module.get<RecordValidatorService>(RecordValidatorService);
  });

  describe('validateAndTransformToEntity', () => {
    it('should validate and transform valid patient records', async () => {
      const validRows = [
        {
          이름: '홍길동',
          전화번호: '010-1234-5678',
          주민등록번호: '900101-1******',
          차트번호: '12345',
          주소: '서울시 강남구',
          메모: '특이사항 없음',
        },
        {
          이름: '김철수',
          전화번호: '01087654321',
          주민등록번호: '910202',
          주소: '경기도 성남시',
          메모: '특이사항 없음',
        },
      ];

      const stream = Readable.from(validRows);

      const result = await service.validateAndTransformToEntity({
        jsonRowStreams: [stream],
      });

      expect(result.failedCount).toBe(0);
      expect(result.patientEntities).toHaveLength(2);
      expect(result.patientEntities[0]).toEqual({
        name: '홍길동',
        phoneNumber: '01012345678',
        residentRegistrationNumber: '900101-1******',
        chartNumber: '12345',
        address: '서울시 강남구',
        memo: '특이사항 없음',
      });
      expect(result.patientEntities[1]).toEqual({
        name: '김철수',
        phoneNumber: '01087654321',
        residentRegistrationNumber: '910202-*******',
        address: '경기도 성남시',
        memo: '특이사항 없음',
      });
    });

    it('should handle duplicate records', async () => {
      const row = {
        이름: '홍길동',
        전화번호: '010-1234-5678',
        주민등록번호: '900101-1******',
      };

      const stream = Readable.from([row, row]); // Same record twice

      const result = await service.validateAndTransformToEntity({
        jsonRowStreams: [stream],
      });

      expect(result.failedCount).toBe(1);
      expect(result.patientEntities).toHaveLength(1);
    });

    it('should validate phone number format', async () => {
      const invalidPhoneRow = {
        이름: '홍길동',
        전화번호: 'invalid-phone',
        주민등록번호: '900101-1******',
      };

      const stream = Readable.from([invalidPhoneRow]);

      const result = await service.validateAndTransformToEntity({
        jsonRowStreams: [stream],
      });

      expect(result.failedCount).toBe(1);
      expect(result.patientEntities).toHaveLength(0);
    });

    it('should validate resident registration number format', async () => {
      const invalidResidentNumberRow = {
        이름: '홍길동',
        전화번호: '010-1234-5678',
        주민등록번호: '12345', // Invalid format
      };

      const stream = Readable.from([invalidResidentNumberRow]);

      const result = await service.validateAndTransformToEntity({
        jsonRowStreams: [stream],
      });

      expect(result.failedCount).toBe(1);
      expect(result.patientEntities).toHaveLength(0);
    });

    it('should validate name length', async () => {
      const longNameRow = {
        이름: '이름이너무길어서안되는케이스테스트', // 16자 초과
        전화번호: '010-1234-5678',
        주민등록번호: '900101-1******',
      };

      const stream = Readable.from([longNameRow]);

      const result = await service.validateAndTransformToEntity({
        jsonRowStreams: [stream],
      });

      expect(result.failedCount).toBe(1);
      expect(result.patientEntities).toHaveLength(0);
    });

    it('should handle multiple streams', async () => {
      const validRow1 = {
        이름: '홍길동',
        전화번호: '010-1234-5678',
        주민등록번호: '900101-1******',
      };

      const validRow2 = {
        이름: '김철수',
        전화번호: '010-8765-4321',
        주민등록번호: '910202-2******',
      };

      const stream1 = Readable.from([validRow1]);
      const stream2 = Readable.from([validRow2]);

      const result = await service.validateAndTransformToEntity({
        jsonRowStreams: [stream1, stream2],
      });

      expect(result.failedCount).toBe(0);
      expect(result.patientEntities).toHaveLength(2);
    });

    it('should handle empty streams', async () => {
      const stream = Readable.from([]);

      const result = await service.validateAndTransformToEntity({
        jsonRowStreams: [stream],
      });

      expect(result.failedCount).toBe(0);
      expect(result.patientEntities).toHaveLength(0);
    });

    it('should validate chart number format', async () => {
      const invalidChartNumberRow = {
        이름: '홍길동',
        전화번호: '010-1234-5678',
        주민등록번호: '900101-1******',
        차트번호: 'not-a-number',
      };

      const stream = Readable.from([invalidChartNumberRow]);

      const result = await service.validateAndTransformToEntity({
        jsonRowStreams: [stream],
      });

      expect(result.failedCount).toBe(1);
      expect(result.patientEntities).toHaveLength(0);
    });

    it('should handle resident registration number masking', async () => {
      const testCases = [
        {
          input: '900101',
          expected: '900101-*******',
        },
        {
          input: '900101-1234567',
          expected: '900101-1******',
        },
      ];

      for (const testCase of testCases) {
        const row = {
          이름: '홍길동',
          전화번호: '010-1234-5678',
          주민등록번호: testCase.input,
        };

        const stream = Readable.from([row]);

        const result = await service.validateAndTransformToEntity({
          jsonRowStreams: [stream],
        });

        expect(result.failedCount).toBe(0);
        expect(result.patientEntities[0].residentRegistrationNumber).toBe(
          testCase.expected,
        );
      }
    });
  });
});
