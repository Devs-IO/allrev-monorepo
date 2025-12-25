// @shared/filters/http-exception.filter.ts
import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../exception/business.exception';
import { TenantNotFoundException } from '../exception/tenant-not-found.exception';
import { MessageService } from '../services/message.service';
import { ErrorResponse } from '../exception/dto/api-response.dto';

@Catch()
export class GlobalExceptionHandler implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionHandler.name);

  constructor(private readonly messageService: MessageService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error('Exception caught:', exception);

    const errorResponse = this.handleException(exception);

    response.status(errorResponse.status).json({
      success: false,
      error: {
        code: errorResponse.code,
        message: errorResponse.message,
      },
    } as ErrorResponse);
  }

  private handleException(exception: any): { status: number; code: string; message: string } {
    // Business Exception
    if (exception instanceof BusinessException) {
      return {
        status: exception.getStatus(),
        code: exception.errorCode,
        message: this.messageService.getMessage(exception.messageKey, exception.params),
      };
    }

    // Tenant Not Found Exception
    if (exception instanceof TenantNotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        code: 'TENANT_NOT_FOUND',
        message: this.messageService.getMessage('tenant.not_found'),
      };
    }

    // Database Constraint Violations (TypeORM)
    if (exception instanceof QueryFailedError) {
      return this.handleDatabaseError(exception);
    }

    // HTTP Exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        status,
        code: this.getHttpErrorCode(status),
        message: this.getHttpErrorMessage(status, exception.message),
      };
    }

    // Generic Error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: this.messageService.getMessage('error.internal_server'),
    };
  }

  private handleDatabaseError(error: QueryFailedError): {
    status: number;
    code: string;
    message: string;
  } {
    const errorCode = (error as any).code;

    // Duplicate entry
    if (errorCode === 'ER_DUP_ENTRY' || errorCode === '23505') {
      return {
        status: HttpStatus.CONFLICT,
        code: 'DUPLICATE_ENTRY',
        message: this.messageService.getMessage('database.duplicate_entry'),
      };
    }

    // Foreign key constraint
    if (errorCode === 'ER_NO_REFERENCED_ROW_2' || errorCode === '23503') {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'CONSTRAINT_VIOLATION',
        message: this.messageService.getMessage('database.constraint_violation'),
      };
    }

    // Generic database error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'DATABASE_ERROR',
      message: this.messageService.getMessage('database.connection_error'),
    };
  }

  private getHttpErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      default:
        return 'HTTP_ERROR';
    }
  }

  private getHttpErrorMessage(status: number, originalMessage: string): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return this.messageService.getMessage('error.bad_request');
      case HttpStatus.UNAUTHORIZED:
        return this.messageService.getMessage('error.unauthorized');
      case HttpStatus.FORBIDDEN:
        return this.messageService.getMessage('error.forbidden');
      default:
        return originalMessage || this.messageService.getMessage('error.internal_server');
    }
  }
}
