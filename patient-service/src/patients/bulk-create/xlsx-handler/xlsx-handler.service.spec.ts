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
      // Create a simple Excel workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['이름', '전화번호']]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // Convert to buffer
      const buffer = XLSX.write(wb, { type: 'buffer' });

      // Test the transformation
      const result = service.transformFileBufferToWorkBook({
        fileBuffer: buffer,
      });

      expect(result).toBeDefined();
      expect(result.SheetNames).toContain('Sheet1');
      expect(result.Sheets['Sheet1']).toBeDefined();
    });
  });

  describe('validateSheets', () => {
    it('should validate sheets with correct column names', () => {
      const requiredColumnNames = ['이름', '전화번호'] as const;
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['이름', '전화번호']]);
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
      const requiredColumnNames = ['이름', '전화번호'] as const;
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['이름', '잘못된컬럼']]); // Wrong column name
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

    it('should validate multiple sheets', () => {
      const requiredColumnNames = ['이름', '전화번호'] as const;
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet([['이름', '전화번호']]);
      const ws2 = XLSX.utils.aoa_to_sheet([['이름', '전화번호']]);
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
  });

  describe('transformSheetsToJsonRowStreams', () => {
    it('should transform sheets to json row streams', () => {
      // Create test worksheet with sample data
      const ws = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호'],
        ['홍길동', '010-1234-5678'],
        ['김철수', '010-8765-4321'],
      ]);

      const streams = service.transformSheetsToJsonRowStreams({
        sheets: [ws],
      });

      expect(streams).toHaveLength(1);
      expect(streams[0]).toBeInstanceOf(Readable);
    });

    it('should handle multiple sheets', () => {
      const ws1 = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호'],
        ['홍길동', '010-1234-5678'],
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호'],
        ['김철수', '010-8765-4321'],
      ]);

      const streams = service.transformSheetsToJsonRowStreams({
        sheets: [ws1, ws2],
      });

      expect(streams).toHaveLength(2);
      expect(streams[0]).toBeInstanceOf(Readable);
      expect(streams[1]).toBeInstanceOf(Readable);
    });

    it('should create streams with correct data', async () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['이름', '전화번호'],
        ['홍길동', '010-1234-5678'],
      ]);

      const streams = service.transformSheetsToJsonRowStreams({
        sheets: [ws],
      });

      const stream = streams[0];
      const chunks: any[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        이름: '홍길동',
        전화번호: '010-1234-5678',
      });
    });
  });
});
