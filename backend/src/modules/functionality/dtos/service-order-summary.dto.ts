import { ApiProperty } from '@nestjs/swagger';

export class ServiceOrderSummaryDto {
  @ApiProperty()
  totalOrders!: number;

  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty()
  totalCosts!: number;

  @ApiProperty()
  totalProfit!: number;

  @ApiProperty()
  pendingOrders!: number;

  @ApiProperty()
  paidOrders!: number;

  @ApiProperty()
  overdueOrders!: number;

  @ApiProperty()
  totalServices!: number;

  @ApiProperty()
  pendingDeliveries!: number;

  @ApiProperty()
  completedDeliveries!: number;
}
