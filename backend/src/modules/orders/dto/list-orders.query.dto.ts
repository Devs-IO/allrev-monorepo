import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListOrdersQueryDto {
  @IsOptional()
  @IsEnum(['PENDING', 'PARTIALLY_PAID', 'PAID'] as any)
  paymentStatus?: any;

  @IsOptional()
  @IsEnum([
    'PENDING',
    'IN_PROGRESS',
    'AWAITING_CLIENT',
    'AWAITING_ADVISOR',
    'OVERDUE',
    'COMPLETED',
    'CANCELED',
  ] as any)
  workStatus?: any;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  functionalityId?: string;

  @IsOptional()
  @IsUUID()
  responsibleId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  pageSize?: number;
}
