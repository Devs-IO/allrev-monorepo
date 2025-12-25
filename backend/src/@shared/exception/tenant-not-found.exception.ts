import { HttpException, HttpStatus } from '@nestjs/common';

export class TenantNotFoundException extends HttpException {
  constructor(tenantId: string) {
    super(`Tenant with ID ${tenantId} not found`, HttpStatus.NOT_FOUND);
    this.name = 'TenantNotFoundException';
  }
}
