import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { UploadExceptionFilter } from './filters/upload-exception.filter';
import { PatientsListSuccessResponse } from './interfaces/list.patients.response';
import {
  UploadPatientsBadRequestErrorResponse,
  UploadPatientsInternalServerErrorResponse,
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
    type: UploadPatientsBadRequestErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: '서버 오류',
    type: UploadPatientsInternalServerErrorResponse,
  })
  @ApiExtraModels(
    UploadPatientsSuccessResponse,
    UploadPatientsBadRequestErrorResponse,
    UploadPatientsInternalServerErrorResponse,
  )
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

  @ApiOperation({ summary: '환자 정보 조회' })
  @ApiOkResponse({
    description: '환자 정보 조회 성공',
    type: PatientsListSuccessResponse,
  })
  @ApiBadRequestResponse({
    description: '유효하지 않은 query parameter',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    default: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    default: 20,
    maximum: 100,
  })
  @ApiExtraModels(PatientsListSuccessResponse)
  @Get()
  findWithPagination(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (limit && (limit > 100 || limit < 1)) {
      throw new BadRequestException('limit은 1 이상 100 이하여야 합니다.');
    }
    if (page && page < 1) {
      throw new BadRequestException('page는 1 이상이어야 합니다.');
    }
    return this.patientsService.handleScanWithPagination({
      page,
      limit,
    });
  }
}
