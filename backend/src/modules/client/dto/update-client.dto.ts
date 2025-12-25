import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Senha opcional para acesso ao portal; se enviada, será aplicada a todos os registros do mesmo e-mail
  @IsOptional()
  @IsString()
  @Length(6, 100)
  password?: string;
}
