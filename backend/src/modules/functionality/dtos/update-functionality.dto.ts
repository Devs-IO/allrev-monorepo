import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateFunctionalityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  minimumPrice?: number;

  @IsOptional()
  @IsNumber()
  defaultAssistantPrice?: number;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
