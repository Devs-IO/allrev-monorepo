import { ApiProperty } from '@nestjs/swagger';

export class ResponseUserAsAssistantDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ example: 'assistant_reviewers' })
  role: string = 'assistant_reviewers';

  @ApiProperty({
    type: 'array',
    description: 'Funcionalidades atribuídas ao assistente',
    example: [
      {
        id: 'func-id',
        name: 'Revisão Técnica',
        description: 'Analisar documentos e emitir parecer',
        delivered: false,
        assistantDeadline: '2025-01-10',
      },
    ],
  })
  functionalities!: Array<{
    id: string;
    name: string;
    description: string;
    delivered: boolean;
    assistantDeadline?: Date;
  }>;
}
