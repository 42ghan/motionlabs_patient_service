import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import { Injectable } from '@nestjs/common';

@Injectable()
export class XlsxHandlerService {
  transformFileBufferToWorkBook({
    fileBuffer,
  }: {
    fileBuffer: Buffer;
  }): XLSX.WorkBook {
    const workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellFormula: false,
      cellHTML: false,
      cellText: false,
    });
    return workbook;
  }

  validateSheets({
    requiredColumnNames,
    sheetNames,
    sheets,
  }: {
    requiredColumnNames: readonly string[];
    sheetNames: string[];
    sheets: {
      [sheetName: string]: XLSX.WorkSheet;
    };
  }): XLSX.WorkSheet[] {
    const requiredColumnIds = Array.from(
      { length: requiredColumnNames.length },
      (_, i) => `${String.fromCharCode(65 + i)}1`,
    );
    const validatedSheets = sheetNames.map((sheetName) => {
      const sheet = sheets[sheetName];
      if (!sheet) {
        throw new Error('정상적이지 않은 엑셀 파일입니다.');
      }
      const columnNames = requiredColumnIds.map(
        (columnId) => sheet[columnId]?.v,
      );
      const requiredColumnsSet = new Set(requiredColumnNames);
      if (
        !columnNames.every((columnName) => requiredColumnsSet.has(columnName))
      ) {
        throw new Error('유효하지 않은 엑셀 파일입니다.');
      }
      return sheet;
    });
    return validatedSheets;
  }

  transformSheetsToJsonRowStreams({
    sheets,
  }: {
    sheets: XLSX.WorkSheet[];
  }): Readable[] {
    return sheets.map((sheet) => {
      return XLSX.stream.to_json(sheet, {
        blankrows: false,
        rawNumbers: false,
      });
    });
  }
}
