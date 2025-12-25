import { ApiProperty } from '@nestjs/swagger';
import { FunctionalitiesClientsStatus, FunctionalitiesUsersStatus } from '../../../@shared/enums';

export class ServiceOrderItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderNumber!: string;

  @ApiProperty({ required: false })
  orderDescription?: string;

  @ApiProperty({ description: 'Data/hora do contrato' })
  contractDate!: Date;

  @ApiProperty()
  functionalityId!: string;

  @ApiProperty()
  functionalityName!: string;

  @ApiProperty()
  totalPrice!: number;

  @ApiProperty()
  paymentMethod!: string;

  @ApiProperty()
  clientDeadline!: string;

  @ApiProperty({ enum: FunctionalitiesClientsStatus })
  status!: FunctionalitiesClientsStatus;

  @ApiProperty({ required: false })
  paidAt?: string;

  @ApiProperty({ required: false })
  responsibleUserId?: string;

  @ApiProperty({ required: false })
  responsibleUserName?: string;

  @ApiProperty({ required: false })
  assistantDeadline?: string;

  @ApiProperty({ required: false })
  assistantAmount?: number;

  @ApiProperty({ required: false })
  assistantPaidAt?: string;

  @ApiProperty({ required: false })
  delivered?: boolean;

  // Novos campos do colaborador (schedule/status/price)
  @ApiProperty({ required: false, description: 'Início do serviço (colaborador)' })
  serviceStartDate?: Date;

  @ApiProperty({ required: false, description: 'Término do serviço (colaborador)' })
  serviceEndDate?: Date;

  @ApiProperty({
    required: false,
    enum: FunctionalitiesUsersStatus,
    description: 'Status do colaborador',
  })
  userStatus?: FunctionalitiesUsersStatus;

  @ApiProperty({ required: false, description: 'Valor do colaborador' })
  price?: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  createdAt!: Date;
}

export class ServiceOrderResponseDto {
  @ApiProperty()
  orderId!: string;

  @ApiProperty({ description: 'Número da ordem criada' })
  orderNumber!: string;

  @ApiProperty()
  clientId!: string;

  @ApiProperty()
  clientName!: string;

  @ApiProperty()
  clientEmail!: string;

  @ApiProperty({ required: false })
  clientInstitution?: string;

  @ApiProperty()
  deadline!: string; // Menor prazo entre todos os serviços

  @ApiProperty({
    required: false,
    description: 'Data do contrato (menor entre os serviços do cliente)',
  })
  contractDate?: string;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalAssistantAmount!: number;

  @ApiProperty()
  serviceCount!: number;

  @ApiProperty({ enum: FunctionalitiesClientsStatus })
  status!: FunctionalitiesClientsStatus;

  @ApiProperty({ required: false, description: 'Se possui algum colaborador em atraso' })
  hasOverdueCollaborators?: boolean;

  @ApiProperty({ type: [ServiceOrderItemResponseDto] })
  services!: ServiceOrderItemResponseDto[];

  @ApiProperty()
  createdAt!: Date;
}
