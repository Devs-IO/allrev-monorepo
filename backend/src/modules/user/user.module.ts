import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserTenant } from './entities/user-tenant.entity';
import { TenantModule } from '../tenant/tenant.module';
import { TenantGuard } from '../../@shared/guards/tenant.guard';
import { EmailModule } from '../email/email.module';
import { OrderItemResponsibility } from '../orders/entities/order-item-responsibility.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserTenant, OrderItemResponsibility]),
    TenantModule,
    EmailModule,
  ],
  controllers: [UserController],
  providers: [UserService, TenantGuard],
  exports: [UserService, TypeOrmModule, TenantGuard],
})
export class UserModule {}
