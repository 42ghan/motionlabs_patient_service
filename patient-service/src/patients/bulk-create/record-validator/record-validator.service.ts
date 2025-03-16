import { Patient } from '../../entities/patient.entity';
import { Readable } from 'stream';
import { Injectable } from '@nestjs/common';
import { RAW_PATIENT_PROPERTIES } from '../constants';

type RawPatientRow = Partial<
  Record<(typeof RAW_PATIENT_PROPERTIES)[number], string>
>;

type ValidatedPatientRow = Required<
  Pick<RawPatientRow, '이름' | '전화번호' | '주민등록번호'>
> &
  Partial<Pick<RawPatientRow, '차트번호' | '주소' | '메모'>>;

export type ImportablePatientEntity = Pick<
  Patient,
  | 'name'
  | 'phoneNumber'
  | 'residentRegistrationNumber'
  | 'chartNumber'
  | 'address'
  | 'memo'
>;

@Injectable()
export class RecordValidatorService {
  async validateAndTransformToEntity({
    jsonRowStreams,
  }: {
    jsonRowStreams: Readable[];
  }): Promise<{
    patientEntities: ImportablePatientEntity[];
    failedCount: number;
  }> {
    const patientEntitiesMap = new Map<string, ImportablePatientEntity>();
    let failedCount = 0;
    for (const stream of jsonRowStreams) {
      for await (const row of stream) {
        if (!this.validateRawPatientRow(row)) {
          failedCount++;
          continue;
        }
        const patient = this.transformRowToPatient({ row });
        const patientUniqueId = this.getPatientUniqueId({
          patient,
        });
        if (patientEntitiesMap.has(patientUniqueId)) {
          failedCount++;
        }
        patientEntitiesMap.set(patientUniqueId, patient);
      }
    }

    return {
      patientEntities: Array.from(patientEntitiesMap.values()),
      failedCount,
    };
  }

  private validateRawPatientRow(row: unknown): row is ValidatedPatientRow {
    if (!this.isRawPatientRow(row)) {
      return false;
    }

    const rowWithTrimmedValues = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, value.trim()]),
    );

    // 필수값 검증
    if (
      !rowWithTrimmedValues['이름'] ||
      !rowWithTrimmedValues['전화번호'] ||
      !rowWithTrimmedValues['주민등록번호']
    ) {
      return false;
    }
    const name = rowWithTrimmedValues['이름'];
    const phoneNumber = rowWithTrimmedValues['전화번호'];
    const residentRegistrationNumber = rowWithTrimmedValues['주민등록번호'];

    // 이름 길이 검증
    if (name.length === 0 || name.length > 16) {
      return false;
    }

    // 전화번호 검증
    if (
      phoneNumber.length > 13 ||
      !/^(\d+(-\d+){1,2}|\d+)$/.test(phoneNumber)
    ) {
      return false;
    }

    if (
      !/^([0-9]{6}|[0-9]{6}-[0-9]\*{6}|[0-9]{6}-[0-9]{7})$/.test(
        residentRegistrationNumber,
      )
    ) {
      return false;
    }

    const chartNumber = rowWithTrimmedValues['차트번호'];
    if (chartNumber && isNaN(parseInt(chartNumber))) {
      return false;
    }

    const address = rowWithTrimmedValues['주소'];
    if (address && address.length > 255) {
      return false;
    }

    const memo = rowWithTrimmedValues['메모'];
    if (memo && memo.length > 255) {
      return false;
    }

    return true;
  }

  private isRawPatientRow(row: unknown): row is RawPatientRow {
    if (typeof row !== 'object' || row === null) {
      return false;
    }
    return Object.entries(row).every(
      ([key, value]) =>
        RAW_PATIENT_PROPERTIES.includes(
          key as (typeof RAW_PATIENT_PROPERTIES)[number],
        ) && typeof value === 'string',
    );
  }

  private transformRowToPatient({
    row,
  }: {
    row: ValidatedPatientRow;
  }): Pick<
    Patient,
    | 'name'
    | 'phoneNumber'
    | 'residentRegistrationNumber'
    | 'chartNumber'
    | 'address'
    | 'memo'
  > {
    const name = row['이름'];
    const phoneNumber = row['전화번호'].split('-').join('');

    let residentRegistrationNumber = row['주민등록번호'];
    if (residentRegistrationNumber.length === 6) {
      residentRegistrationNumber += '-*******';
    } else if (residentRegistrationNumber.length === 14) {
      residentRegistrationNumber =
        residentRegistrationNumber.slice(0, 8) + '******';
    }
    const chartNumber = row['차트번호'];
    const address = row['주소'];
    const memo = row['메모'];

    return {
      name,
      phoneNumber,
      residentRegistrationNumber,
      chartNumber,
      address,
      memo,
    };
  }

  private getPatientUniqueId({
    patient,
  }: {
    patient: Pick<Patient, 'name' | 'phoneNumber' | 'chartNumber'>;
  }): string {
    const name = patient.name;
    const phoneNumber = patient.phoneNumber;
    const chartNumber = patient.chartNumber ?? '';
    return `${name}${phoneNumber}${chartNumber}`;
  }
}
