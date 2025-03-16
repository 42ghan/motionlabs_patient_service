import { Test, TestingModule } from '@nestjs/testing';
import { XlsxHandlerService } from './xlsx-handler.service';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';

describe('XlsxHandlerService', () => {
  let service: XlsxHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XlsxHandlerService],
    }).compile();

    service = module.get<XlsxHandlerService>(XlsxHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transformFileBufferToWorkBook', () => {
    it('should transform buffer to workbook', () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['이름', '전화번호']]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer' });

      const result = service.transformFileBufferToWorkBook({
        fileBuffer: buffer,
      });

      expect(result).toBeDefined();
      expect(result.SheetNames).toContain('Sheet1');
      expect(result.Sheets['Sheet1']).toBeDefined();
    });

    it('should transform buffer with multiple sheets', () => {
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet([['이름', '전화번호']]);
      const ws2 = XLSX.utils.aoa_to_sheet([['이름', '전화번호']]);
      XLSX.utils.book_append_sheet(wb, ws1, 'Sheet1');
      XLSX.utils.book_append_sheet(wb, ws2, 'Sheet2');
      const buffer = XLSX.write(wb, { type: 'buffer' });

      const result = service.transformFileBufferToWorkBook({
        fileBuffer: buffer,
      });

      expect(result.SheetNames).toHaveLength(2);
      expect(result.SheetNames).toContain('Sheet1');
      expect(result.SheetNames).toContain('Sheet2');
    });
  });

  describe('validateSheets', () => {
    it('should validate sheets with correct column names', () => {
      const requiredColumnNames = [
        '이름',
        '전화번호',
        '주민등록번호',
        '차트번호',
        '주소',
        '메모',
      ] as const;
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호', '주민등록번호', '차트번호', '주소', '메모'],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      const result = service.validateSheets({
        requiredColumnNames,
        sheetNames: wb.SheetNames,
        sheets: wb.Sheets,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
    });

    it('should throw error for missing required columns', () => {
      const requiredColumnNames = ['이름', '전화번호', '주민등록번호'] as const;
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['이름', '잘못된컬럼']]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      expect(() =>
        service.validateSheets({
          requiredColumnNames,
          sheetNames: wb.SheetNames,
          sheets: wb.Sheets,
        }),
      ).toThrow('유효하지 않은 엑셀 파일입니다.');
    });

    it('should throw error for missing sheet', () => {
      const requiredColumnNames = ['이름', '전화번호'] as const;
      const wb = XLSX.utils.book_new();

      expect(() =>
        service.validateSheets({
          requiredColumnNames,
          sheetNames: ['NonExistentSheet'],
          sheets: wb.Sheets,
        }),
      ).toThrow('정상적이지 않은 엑셀 파일입니다.');
    });

    it('should validate multiple sheets with all required columns', () => {
      const requiredColumnNames = ['이름', '전화번호', '주민등록번호'] as const;
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호', '주민등록번호'],
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호', '주민등록번호'],
      ]);
      XLSX.utils.book_append_sheet(wb, ws1, 'Sheet1');
      XLSX.utils.book_append_sheet(wb, ws2, 'Sheet2');

      const result = service.validateSheets({
        requiredColumnNames,
        sheetNames: wb.SheetNames,
        sheets: wb.Sheets,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toBeDefined();
      expect(result[1]).toBeDefined();
    });

    it('should throw error if any sheet is missing required columns', () => {
      const requiredColumnNames = ['이름', '전화번호', '주민등록번호'] as const;
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호', '주민등록번호'],
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([['이름', '전화번호']]); // Missing column
      XLSX.utils.book_append_sheet(wb, ws1, 'Sheet1');
      XLSX.utils.book_append_sheet(wb, ws2, 'Sheet2');

      expect(() =>
        service.validateSheets({
          requiredColumnNames,
          sheetNames: wb.SheetNames,
          sheets: wb.Sheets,
        }),
      ).toThrow('유효하지 않은 엑셀 파일입니다.');
    });
  });

  describe('transformSheetsToJsonRowStreams', () => {
    it('should transform sheets to json row streams', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호', '주민등록번호'],
        ['홍길동', '010-1234-5678', '900101-1******'],
        ['김철수', '010-8765-4321', '910202-2******'],
      ]);

      const streams = service.transformSheetsToJsonRowStreams({ sheets: [ws] });

      expect(streams).toHaveLength(1);
      expect(streams[0]).toBeInstanceOf(Readable);
    });

    it('should handle empty sheets', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호', '주민등록번호'],
      ]);
      const streams = service.transformSheetsToJsonRowStreams({ sheets: [ws] });

      expect(streams).toHaveLength(1);
      expect(streams[0]).toBeInstanceOf(Readable);
    });

    it('should create streams with correct data structure', async () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호', '주민등록번호', '차트번호', '주소', '메모'],
        [
          '홍길동',
          '010-1234-5678',
          '900101-1******',
          '12345',
          '서울시',
          '메모1',
        ],
      ]);

      const streams = service.transformSheetsToJsonRowStreams({ sheets: [ws] });
      const stream = streams[0];
      const chunks: any[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        이름: '홍길동',
        전화번호: '010-1234-5678',
        주민등록번호: '900101-1******',
        차트번호: '12345',
        주소: '서울시',
        메모: '메모1',
      });
    });

    it('should handle multiple rows in a sheet', async () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호', '주민등록번호'],
        ['홍길동', '010-1234-5678', '900101-1******'],
        ['김철수', '010-8765-4321', '910202-2******'],
        ['이영희', '010-5555-5555', '920303-2******'],
      ]);

      const streams = service.transformSheetsToJsonRowStreams({ sheets: [ws] });
      const stream = streams[0];
      const chunks: any[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks.map((chunk) => chunk.이름)).toEqual([
        '홍길동',
        '김철수',
        '이영희',
      ]);
    });
  });
});
