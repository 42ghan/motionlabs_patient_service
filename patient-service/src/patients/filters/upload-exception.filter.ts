import { Response } from 'express';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class UploadExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.getResponse();

      response.status(status).json({
        success: false,
        message: message,
      });
      return;
    }
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
