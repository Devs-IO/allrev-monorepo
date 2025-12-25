import { ApiProperty } from '@nestjs/swagger';

export class ResponseFunctionalityDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  minimumPrice!: number;

  @ApiProperty({ required: false })
  defaultAssistantPrice?: number;

  @ApiProperty({ required: false })
  defaultAssistantId?: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] })
  status!: 'ACTIVE' | 'INACTIVE';

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  responsibleUserId!: string;

  @ApiProperty({ default: true })
  isActive!: boolean;

  @ApiProperty({
    required: false,
    enum: ['RESPONSIBLE_DELETED', 'RESPONSIBLE_INACTIVE', 'RESPONSIBLE_TEMPORARILY_INACTIVE'],
  })
  inactiveReason?:
    | 'RESPONSIBLE_DELETED'
    | 'RESPONSIBLE_INACTIVE'
    | 'RESPONSIBLE_TEMPORARILY_INACTIVE';

  @ApiProperty({ required: false })
  deletedAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
