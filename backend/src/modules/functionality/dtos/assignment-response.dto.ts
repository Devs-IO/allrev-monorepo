import { ApiProperty } from '@nestjs/swagger';

export class AssignmentResponseDto {
  @ApiProperty({ description: 'Nome do cliente' })
  clientName!: string;

  @ApiProperty({ description: 'Nome do serviço' })
  serviceName!: string;

  @ApiProperty({ description: 'Valor a receber pelo assistant' })
  yourAmount!: number;

  @ApiProperty({ description: 'Prazo para entrega do assistant' })
  yourDeadline!: string;

  @ApiProperty({
    description: 'Status da atribuição',
    enum: ['PENDING', 'IN_PROGRESS', 'FINISHED'],
  })
  status!: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';

  @ApiProperty({ description: 'ID da atribuição' })
  assignmentId!: string;

  @ApiProperty({ description: 'Número da ordem de serviço' })
  orderNumber?: string;

  @ApiProperty({ description: 'Descrição do serviço' })
  serviceDescription?: string;
}
