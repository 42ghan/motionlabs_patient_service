import {
  Controller,
  Get,
  HttpCode,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { UploadExceptionFilter } from './filters/upload-exception.filter';
import {
  UploadPatientsErrorResponse,
  UploadPatientsSuccessResponse,
} from './interfaces/upload.patients.response';
import { PatientsService } from './patients.service';
import { uploadFilePipeValidators } from './pipes/validators';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @ApiOperation({ summary: 'xlsx 파일 upload 하여 환자 정보 저장' })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    description: '환자 정보 업로드 성공',
    type: UploadPatientsSuccessResponse,
  })
  @ApiBadRequestResponse({
    description: '파일 업로드 실패',
    type: UploadPatientsErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: '서버 오류',
    type: UploadPatientsErrorResponse,
  })
  @ApiExtraModels(UploadPatientsSuccessResponse, UploadPatientsErrorResponse)
  @HttpCode(200)
  @Post('upload')
  @UseFilters(UploadExceptionFilter)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: uploadFilePipeValidators,
      }),
    )
    uploadedFile: Express.Multer.File,
  ): Promise<UploadPatientsSuccessResponse> {
    return this.patientsService.handleUploadedFileToBulkCreate({
      uploadedFile,
    });
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }
}
