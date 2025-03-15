import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('upload')
  upload(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.handleUploadedFileToBulkCreate(
      createPatientDto,
    );
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }
}
