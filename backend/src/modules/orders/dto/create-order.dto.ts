import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderPaymentTerms, OrderWorkStatus, OrderPaymentStatus } from '../entities/order.entity';
import { PaymentMethod } from '../entities/order-installment.entity';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsUUID()
  functionalityId!: string;

  @ApiProperty({ description: 'Preço do item' })
  @IsNumber()
  @Min(0.01)
  price!: number;

  @ApiProperty({ description: 'Prazo do cliente (ISO date)' })
  @IsDateString()
  clientDeadline!: string;

  @ApiProperty({ enum: OrderWorkStatus, required: false })
  @IsOptional()
  @IsEnum(OrderWorkStatus)
  itemStatus?: any;

  @ApiProperty({ required: false, description: 'ID do usuário responsável (assistant)' })
  @IsOptional()
  @IsUUID()
  responsibleUserId?: string;

  @ApiProperty({ required: false, description: 'Prazo do assistant (ISO date)' })
  @IsOptional()
  @IsDateString()
  assistantDeadline?: string;

  @ApiProperty({ required: false, description: 'Valor a pagar ao assistant' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  assistantAmount?: number;
}

export class CreateInstallmentDto {
  @ApiProperty({ description: 'Valor da parcela' })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ description: 'Data de vencimento (ISO date)' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({
    enum: ['pix', 'link', 'qrcode', 'boleto', 'transfer', 'deposit', 'card', 'other'],
  })
  @IsEnum(['pix', 'link', 'qrcode', 'boleto', 'transfer', 'deposit', 'card', 'other'] as any)
  channel!: 'pix' | 'link' | 'qrcode' | 'boleto' | 'transfer' | 'deposit' | 'card' | 'other';

  @ApiProperty({ enum: PaymentMethod, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    required: false,
    description: 'Descrição customizada do método de pagamento (usado quando method=OTHER)',
  })
  @IsOptional()
  paymentMethodDescription?: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  clientId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsDateString()
  contractDate!: string;

  @ApiProperty({ enum: ['pix', 'transfer', 'deposit', 'card', 'other'] })
  @IsEnum(['pix', 'transfer', 'deposit', 'card', 'other'] as any)
  paymentMethod!: 'pix' | 'transfer' | 'deposit' | 'card' | 'other';

  @ApiProperty({ enum: OrderPaymentTerms, required: false })
  @IsOptional()
  @IsEnum(OrderPaymentTerms)
  paymentTerms?: OrderPaymentTerms;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty({
    type: [CreateInstallmentDto],
    required: false,
    description: 'Parcelas personalizadas (máximo 5, se omitido auto-gera baseado em paymentTerms)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Máximo de 5 parcelas permitidas' })
  @ValidateNested({ each: true })
  @Type(() => CreateInstallmentDto)
  installments?: CreateInstallmentDto[];

  @ApiProperty({ required: false, description: 'Indicar se a ordem possui nota fiscal' })
  @IsOptional()
  @IsBoolean()
  hasInvoice?: boolean;
}

export class ListOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderPaymentStatus)
  paymentStatus?: OrderPaymentStatus;

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
  @IsDateString()
  contractDateFrom?: string;

  @IsOptional()
  @IsDateString()
  contractDateTo?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class AddOrderItemDto extends CreateOrderItemDto {}

export class UpdateUnpaidInstallmentDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ description: 'Nova data de vencimento (ISO date)' })
  @IsDateString()
  dueDate!: string;
}

export class UpdateInstallmentsDto {
  @ApiProperty({ type: [UpdateUnpaidInstallmentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateUnpaidInstallmentDto)
  installments!: UpdateUnpaidInstallmentDto[];
}

export class PayInstallmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['pix', 'link', 'qrcode', 'boleto', 'transfer', 'deposit', 'card', 'other'] as any)
  channel?: any;

  @ApiProperty({ required: false, description: 'Data do pagamento (ISO). Se omitido, agora.' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
