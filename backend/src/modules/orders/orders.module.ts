import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemResponsibility } from './entities/order-item-responsibility.entity';
import { OrderInstallment } from './entities/order-installment.entity';
import { Client } from '../client/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderItemResponsibility, OrderInstallment, Client]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule {}
