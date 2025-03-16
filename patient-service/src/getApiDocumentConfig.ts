import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export function getApiDocumentConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Patient Service API')
    .setDescription('환자 정보 관리 서비스 API 문서입니다.')
    .setVersion('1.0')
    .addTag('Patient Service')
    .build();
}
