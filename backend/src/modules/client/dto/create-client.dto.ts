import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  Length,
  IsEnum,
  Matches,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ClientLegalNature } from '../entities/client.entity';

export class CreateClientDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @Length(1, 50)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(ClientLegalNature)
  legalNature?: ClientLegalNature;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter exatamente 11 dígitos' })
  cpf?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter exatamente 14 dígitos' })
  cnpj?: string;

  // Senha opcional: se enviada, será sincronizada para todas as instâncias deste e-mail
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  // Flag para gerar e enviar senha (quando password não for informado)
  @IsOptional()
  @IsBoolean()
  sendPassword?: boolean;
}
