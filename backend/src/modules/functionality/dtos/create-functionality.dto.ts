import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, IsEnum, IsUUID } from 'class-validator';

export class CreateFunctionalityDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'minimumPrice deve ser maior que 0' })
  minimumPrice!: number;

  @IsOptional()
  @IsNumber()
  defaultAssistantPrice?: number;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @IsNotEmpty()
  @IsUUID()
  responsibleUserId!: string;
}
