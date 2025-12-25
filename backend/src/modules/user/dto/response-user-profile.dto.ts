import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../@shared/enums/roles.enum';

export class TenantDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Nome da empresa' })
  companyName!: string;

  @ApiProperty({ description: 'Código do tenant' })
  code!: string;

  @ApiProperty({ description: 'Status do pagamento' })
  paymentStatus!: string;

  @ApiProperty({ description: 'Método de pagamento' })
  paymentMethod!: string;

  @ApiProperty({ description: 'Frequência de pagamento' })
  paymentFrequency!: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Data de vencimento do pagamento',
  })
  paymentDueDate!: Date;
}

export class ResponseUserProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty({ description: 'Indica se o usuário é ADMIN' })
  isAdmin!: boolean;

  @ApiProperty({
    type: TenantDto,
    nullable: true,
    description: 'Tenant completo quando o usuário é gerente; null para admin/assistente',
  })
  tenant!: TenantDto | null;

  @ApiProperty({
    type: 'array',
    description: 'Lista de vínculos do usuário (quando assistente): tenantId, role e companyName',
    items: {
      type: 'object',
      properties: {
        tenantId: { type: 'string' },
        role: { type: 'string', example: 'ASSISTANT_REVIEWERS' },
        companyName: { type: 'string', description: 'Nome da empresa' },
      },
      required: ['tenantId', 'role', 'companyName'],
    },
  })
  tenants!: Array<{ tenantId: string; role: Role; companyName: string }>;
}
