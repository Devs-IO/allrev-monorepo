import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../@shared/enums';

export class ResponseUserDto {
  @ApiProperty({ description: 'ID do usuário' })
  id!: string;

  @ApiProperty({ description: 'Nome do usuário' })
  name!: string;

  @ApiProperty({ description: 'E-mail do usuário' })
  email!: string;

  @ApiProperty({ description: 'Se o usuário está ativo' })
  isActive!: boolean;

  @ApiProperty({ description: 'Papel principal do usuário' })
  role!: Role;

  @ApiProperty({ description: 'Flag auxiliar indicando se é ADMIN' })
  isAdmin!: boolean;

  @ApiProperty({
    description: 'Lista de vínculos (tenant + role) associados ao usuário',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        tenantId: { type: 'string' },
        role: { type: 'string', enum: Object.values(Role) },
      },
      required: ['tenantId', 'role'],
    },
  })
  tenants!: { tenantId: string; role: Role }[];
}
