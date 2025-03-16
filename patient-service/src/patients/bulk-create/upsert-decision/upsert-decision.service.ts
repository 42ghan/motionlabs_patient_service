import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../entities/patient.entity';
import { ImportablePatientEntity } from '../record-validator/record-validator.service';

export type InsertingPatientEntity = Pick<
  Patient,
  | 'name'
  | 'phoneNumber'
  | 'address'
  | 'memo'
  | 'chartNumber'
  | 'residentRegistrationNumber'
>;

export type UpdatingPatientEntity = InsertingPatientEntity & {
  id: number;
};

@Injectable()
export class UpsertDecisionService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async decideUpdateOrInsert({
    entitiesToUpsert,
  }: {
    entitiesToUpsert: ImportablePatientEntity[];
  }): Promise<{
    toUpdateEntities: UpdatingPatientEntity[];
    toInsertEntities: InsertingPatientEntity[];
  }> {
    const existingPatients = await this.findPatientsByNamesAndPhoneNumbers({
      nameAndPhoneNumberPairs: entitiesToUpsert.map((p) => ({
        name: p.name,
        phoneNumber: p.phoneNumber,
      })),
    });

    const existingPatientsMap = this.getPatientsMapFromPatients({
      patients: existingPatients,
    });

    const { toUpdateEntities, toInsertEntities } = this.classifyUpdateOrInsert({
      existingPatientsMap,
      entitiesToUpsert,
    });

    return {
      toUpdateEntities,
      toInsertEntities,
    };
  }

  private classifyUpdateOrInsert({
    existingPatientsMap,
    entitiesToUpsert,
  }: {
    existingPatientsMap: Map<string, Patient[]>;
    entitiesToUpsert: ImportablePatientEntity[];
  }): {
    toUpdateEntities: UpdatingPatientEntity[];
    toInsertEntities: InsertingPatientEntity[];
  } {
    const toUpdateEntities: UpdatingPatientEntity[] = [];
    const toInsertEntities: InsertingPatientEntity[] = [];
    entitiesToUpsert.forEach((toUpsert) => {
      const patientsWithSameNameAndPhoneNumber = existingPatientsMap.get(
        `${toUpsert.name}${toUpsert.phoneNumber}`,
      );
      if (!patientsWithSameNameAndPhoneNumber) {
        toInsertEntities.push({
          ...toUpsert,
        });
        return;
      }

      const sameButNoChartNumber = patientsWithSameNameAndPhoneNumber.find(
        (existingPatient) => !existingPatient.chartNumber,
      );
      if (toUpsert.chartNumber) {
        const sameChartNumber = patientsWithSameNameAndPhoneNumber.find(
          (existingPatient) =>
            existingPatient.chartNumber === toUpsert.chartNumber,
        );
        if (sameChartNumber) {
          toUpdateEntities.push({
            id: sameChartNumber.id,
            ...toUpsert,
          });
          return;
        }
      }
      if (sameButNoChartNumber) {
        toUpdateEntities.push({
          id: sameButNoChartNumber.id,
          ...toUpsert,
        });
        return;
      }
      toInsertEntities.push({
        ...toUpsert,
      });
    });
    return {
      toUpdateEntities,
      toInsertEntities,
    };
  }

  private getPatientsMapFromPatients({
    patients,
  }: {
    patients: Patient[];
  }): Map<string, Patient[]> {
    const patientsMap = new Map<string, Patient[]>();
    patients.forEach((patient) => {
      const key = `${patient.name}${patient.phoneNumber}`;
      if (patientsMap.has(key)) {
        patientsMap.get(key)?.push(patient);
        return;
      }
      patientsMap.set(key, [patient]);
    });
    return patientsMap;
  }

  private async findPatientsByNamesAndPhoneNumbers({
    nameAndPhoneNumberPairs,
  }: {
    nameAndPhoneNumberPairs: {
      name: string;
      phoneNumber: string;
    }[];
  }): Promise<Patient[]> {
    const placeholders = nameAndPhoneNumberPairs.map(() => `(?, ?)`).join(', ');

    const params = nameAndPhoneNumberPairs.flatMap((p) => [
      p.name,
      p.phoneNumber,
    ]);
    const rawPatients: {
      id: string;
      name: string;
      phone_number: string;
      chart_number: string;
      resident_registration_number: string;
      address: string;
      memo: string;
    }[] = await this.patientRepository.query(
      `SELECT id, name, phone_number, chart_number, resident_registration_number, address, memo
    FROM patients
    WHERE (name, phone_number) IN (${placeholders});
    `,
      params,
    );
    return rawPatients.map((raw) =>
      this.patientRepository.create({
        id: parseInt(raw.id),
        name: raw.name,
        phoneNumber: raw.phone_number,
        chartNumber: raw.chart_number,
        residentRegistrationNumber: raw.resident_registration_number,
        address: raw.address,
        memo: raw.memo,
      }),
    );
  }
}
