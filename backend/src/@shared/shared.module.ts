// @shared/shared.module.ts
import { MiddlewareConsumer, Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorHandlingMiddleware } from './middleware/error-handling.middleware';
import { MessageService } from './services/message.service';
import { GlobalExceptionHandler } from './filters/http-exception.filter';
import { ValidationPipe } from './pipes/validation.pipe';
import { ResponseInterceptor } from './interceptors/response.interceptor';

@Global()
@Module({
  providers: [
    MessageService,
    {
      provide: APP_FILTER,
      useFactory: (messageService: MessageService) => new GlobalExceptionHandler(messageService),
      inject: [MessageService],
    },
    {
      provide: APP_PIPE,
      useFactory: (messageService: MessageService) => new ValidationPipe(messageService),
      inject: [MessageService],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  exports: [MessageService],
})
export class SharedModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ErrorHandlingMiddleware).forRoutes('*');
  }
}
