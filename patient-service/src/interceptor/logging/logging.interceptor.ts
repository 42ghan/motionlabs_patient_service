import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, path } = request;
    const requestId = nanoid();

    const startTime = DateTime.now();
    this.logger.log(`REQ - ${requestId} - ${method} ${path}`);

    return next.handle().pipe(
      tap(() => {
        const endTime = DateTime.now();
        const duration = endTime.diff(startTime).toMillis() / 1000;
        this.logger.log(
          `RES - ${requestId} - ${method} ${path} - in ${duration}s`,
        );
      }),
    );
  }
}
