import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FunctionalityController } from './functionality.controller';
import { FunctionalityService } from './functionality.service';
import { Functionality } from './entities/functionality.entity';
// Removed legacy entities from forFeature to avoid duplicate mappings to renamed tables
// import { FunctionalityUser } from './entities/functionality-user.entity';
// import { FunctionalityClient } from './entities/functionality-client.entity';
import { OrdersModule } from '../orders/orders.module';
import { UserModule } from '../user/user.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [TypeOrmModule.forFeature([Functionality]), UserModule, ClientModule, OrdersModule],
  controllers: [FunctionalityController],
  providers: [FunctionalityService],
  exports: [FunctionalityService, TypeOrmModule],
})
export class FunctionalityModule {}
