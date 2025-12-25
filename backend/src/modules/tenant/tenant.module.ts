import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { Tenant } from './entities/tenant.entity';
import { UserTenant } from '../user/entities/user-tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, UserTenant])],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService, TypeOrmModule],
})
export class TenantModule {}
