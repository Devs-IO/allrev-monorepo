import { IsUUID, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class FunctionalityDefinitionDto {
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  minimumPrice!: number;

  @IsOptional()
  @IsNumber()
  defaultAssistantPrice?: number;

  @IsEnum(['ACTIVE', 'INACTIVE'])
  status!: 'ACTIVE' | 'INACTIVE';

  @IsUUID()
  responsibleUserId!: string;

  createdAt!: Date;

  updatedAt!: Date;
}
