import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientsListQuery } from '../interfaces/list.patiens.query';
import {
  PatientsListSuccessResponse,
  PatientsListItem,
} from '../interfaces/list.patients.response';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class ScanService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async scanWithPagination({
    page = 1,
    limit = 20,
  }: PatientsListQuery): Promise<PatientsListSuccessResponse> {
    const safeLimit = Math.min(limit, 100); // Prevent very large requests
    const validPage = Math.max(1, page);
    const offset = (validPage - 1) * safeLimit;

    const [patients, total] = await this.patientRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: offset,
      take: safeLimit,
    });

    const results = patients.map((patient) =>
      this.transformPatientToListItem(patient),
    );

    return {
      results,
      total,
      totalPages: Math.ceil(total / safeLimit),
      currentPage: validPage,
      limit: safeLimit,
    };
  }

  private transformPatientToListItem(patient: Patient): PatientsListItem {
    return {
      id: patient.id,
      chartNumber: patient.chartNumber ? patient.chartNumber : undefined,
      name: patient.name,
      memo: patient.memo,
      address: patient.address,
      phoneNumber: patient.phoneNumber,
      residentRegistrationNumber: patient.residentRegistrationNumber,
      createdAt: patient.createdAt.toISO()!,
      updatedAt: patient.updatedAt.toISO()!,
    };
  }
}
