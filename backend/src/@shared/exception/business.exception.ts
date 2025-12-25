import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    public readonly errorCode: string,
    public readonly messageKey: string,
    public readonly params?: Record<string, any>,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(messageKey, status);
    this.name = 'BusinessException';
  }
}
