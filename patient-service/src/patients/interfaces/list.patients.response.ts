import { ApiProperty } from '@nestjs/swagger';

export class PatientsListItem {
  @ApiProperty({
    description: '환자 아이디',
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: '환자 이름',
    example: '홍길동',
  })
  name!: string;

  @ApiProperty({
    description: '환자 전화번호',
    example: '01012345678',
  })
  phoneNumber!: string;

  @ApiProperty({
    description: '환자 주민등록번호',
    example: '1234567890123',
  })
  residentRegistrationNumber!: string;

  @ApiProperty({
    description: '환자 차트 번호',
    example: '1234',
    required: false,
  })
  chartNumber?: string;

  @ApiProperty({
    description: '메모',
    example: '당뇨, 고혈압, 비만',
    required: false,
  })
  memo?: string;

  @ApiProperty({
    description: '환자 주소',
    example: '서울특별시 강남구 테헤란로 14길 6 남도빌딩 3층',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: '데이터 생성 시간, ISO date string',
    example: '2025-03-16T00:00:00.000Z+09:00',
  })
  createdAt!: string;

  @ApiProperty({
    description: '데이터 수정 시간, ISO date string',
    example: '2025-03-16T00:00:00.000Z+09:00',
  })
  updatedAt!: string;
}

export class PatientsListSuccessResponse {
  @ApiProperty({
    description: '환자 목록',
    type: [PatientsListItem],
  })
  results!: PatientsListItem[];

  @ApiProperty({
    description: '환자 목록 총 개수',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: '환자 목록 총 페이지 수',
    example: 10,
  })
  totalPages!: number;

  @ApiProperty({
    description: '현재 페이지 번호',
    example: 1,
  })
  currentPage!: number;

  @ApiProperty({
    description: '페이지당 조회되는 데이터 개수',
    example: 20,
  })
  limit!: number;
}
