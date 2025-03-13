import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getApiDocumentConfig } from './getApiDocumentConfig';
import { SwaggerModule } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set up swagger
  const apiDocConfig = getApiDocumentConfig();
  const document = SwaggerModule.createDocument(app, apiDocConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
