import { Injectable } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  handleUploadedFileToBulkCreate(createPatientDto: CreatePatientDto) {
    return 'This action adds a new patient';
  }

  findAll() {
    return `This action returns all patients`;
  }
}
