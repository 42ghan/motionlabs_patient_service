import { ApiProperty } from '@nestjs/swagger';

export class UploadPatientsSuccessResponse {
  @ApiProperty({
    description: '파일 업로드 및 환자 정보 저장 성공',
    example: true,
  })
  success!: true;

  @ApiProperty({
    description: '처리된 행 수',
    example: 90,
  })
  processedCount!: number;

  @ApiProperty({
    description: '실패한 행 수',
    example: 10,
  })
  failedCount!: number;
}

export class UploadPatientsErrorResponse {
  @ApiProperty({
    description: '파일 업로드 실패',
    example: false,
  })
  success!: false;

  @ApiProperty({
    description: '실패 이유',
    example: '파일 크기가 너무 큽니다.',
  })
  message!: string;
}
