import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PatientsListQuery {
  @IsOptional()
  @IsPositive()
  @Min(1, {
    message: '페이지는 1 이상이어야 합니다.',
  })
  page?: number;

  @IsOptional()
  @IsPositive()
  @Min(1, {
    message: '최소 1개 이상의 데이터를 조회해야 합니다.',
  })
  @Max(100, {
    message: '최대 100개의 데이터를 조회할 수 있습니다.',
  })
  limit?: number;
}
