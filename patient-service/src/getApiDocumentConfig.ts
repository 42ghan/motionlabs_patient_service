import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export function getApiDocumentConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('API')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('API')
    .build();
}
