import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { TenantModule } from '../tenant/tenant.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Client]), TenantModule, EmailModule],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService, TypeOrmModule],
})
export class ClientModule {}
