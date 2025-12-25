// @shared/middleware/error-handling.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';

@Injectable()
export class ErrorHandlingMiddleware implements NestMiddleware {
  use(next: NextFunction) {
    next();
  }
}
