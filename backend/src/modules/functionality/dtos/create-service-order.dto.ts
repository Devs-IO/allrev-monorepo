import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FunctionalitiesClientsStatus, FunctionalitiesUsersStatus } from '../../../@shared/enums';
import { IsEnum, ValidateIf } from 'class-validator';

export class ServiceOrderItemDto {
  @ApiProperty({ description: 'ID da funcionalidade/serviço' })
  @IsNotEmpty()
  @IsUUID()
  functionalityId!: string;

  @ApiProperty({ description: 'Valor total do serviço para o cliente' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'Valor do serviço deve ser maior que 0' })
  totalPrice!: number;

  @ApiProperty({ description: 'Método de pagamento', example: 'Pix' })
  @IsNotEmpty()
  paymentMethod!: string;

  @ApiProperty({ description: 'Data limite para entrega ao cliente' })
  @IsNotEmpty()
  @IsDateString()
  clientDeadline!: string;

  @ApiProperty({ description: 'ID do usuário responsável (assistant)', required: false })
  @IsOptional()
  @IsUUID()
  responsibleUserId?: string;

  @ApiProperty({ description: 'Prazo para o assistant entregar ao manager', required: false })
  @IsOptional()
  @ValidateIf((o) => o.assistantDeadline !== '')
  @IsDateString()
  assistantDeadline?: string;

  @ApiProperty({ description: 'Valor a ser pago ao assistant', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Valor do assistant deve ser maior que 0' })
  assistantAmount?: number;

  @ApiProperty({ description: 'Descrição adicional do serviço', required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Descrição específica para o responsável', required: false })
  @IsOptional()
  userDescription?: string;

  @ApiProperty({
    enum: FunctionalitiesClientsStatus,
    description: 'Status inicial do item da ordem (cliente)',
  })
  @IsEnum(FunctionalitiesClientsStatus)
  status!: FunctionalitiesClientsStatus;

  @ApiProperty({ description: 'Data/hora de início do serviço (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  serviceStartDate?: string;

  @ApiProperty({ description: 'Data/hora de término do serviço (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  serviceEndDate?: string;

  @ApiProperty({
    enum: FunctionalitiesUsersStatus,
    description: 'Status da atribuição do usuário (assistant/manager) para este serviço',
    required: false,
  })
  @ValidateIf((o) => !!o.responsibleUserId)
  @IsEnum(FunctionalitiesUsersStatus)
  userStatus?: FunctionalitiesUsersStatus;

  @ApiProperty({ description: 'Preço individual (para o usuário) >= 0', required: false })
  @ValidateIf((o) => !!o.responsibleUserId)
  @IsNumber()
  @Min(0)
  price?: number;
}

export class CreateServiceOrderDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsNotEmpty()
  @IsUUID()
  clientId!: string;

  @ApiProperty({ description: 'Lista de serviços da ordem', type: [ServiceOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Deve conter pelo menos um serviço' })
  @ValidateNested({ each: true })
  @Type(() => ServiceOrderItemDto)
  services!: ServiceOrderItemDto[];

  @ApiProperty({ description: 'Descrição geral da ordem de serviço', required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Data/hora do contrato (ISO 8601)' })
  @IsDateString()
  contractDate!: string;
}
