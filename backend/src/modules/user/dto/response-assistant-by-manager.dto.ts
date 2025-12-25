import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../@shared/enums/roles.enum';

export class ResponseAssistantByManagerDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  email!: string;
  @ApiProperty()
  phone!: string;
  @ApiProperty()
  address?: string;
  @ApiProperty()
  isActive!: boolean;
  @ApiProperty()
  createdAt!: Date;
  @ApiProperty({ enum: Role, default: Role.ASSISTANT_REVIEWERS })
  role: Role = Role.ASSISTANT_REVIEWERS;
  @ApiProperty({ description: 'ID do tenant (empresa)', required: false })
  tenantId?: string;
  @ApiProperty({ description: 'Observação do gestor sobre o assistente', required: false })
  observation?: string;
  @ApiProperty({
    description:
      'Status temporário do assistente neste tenant (true = ativo, false = inativo temporário)',
    required: false,
  })
  isActiveForTenant?: boolean;
  @ApiProperty({
    description: 'Informações do tenant (empresa)',
    required: false,
  })
  tenant?: {
    id: string;
    companyName?: string;
    address?: string;
    phone?: string;
    logo?: string;
    code?: string;
  };
  @ApiProperty({
    description: 'Lista de funcionalidades atribuídas ao assistente no tenant atual',
    type: 'array',
    isArray: true,
  })
  functionalities!: Array<{
    assignmentId: string;
    functionalityId: string;
    functionalityName: string;
    functionalityDescription?: string;
    orderNumber?: string;
    assistantDeadline: string;
    assistantAmount: number;
    delivered: boolean;
    description?: string;
  }>;
}
