import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  ValidateIf,
  Length,
} from 'class-validator';
import { Role } from '../../../@shared/enums/roles.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Foto do usuário',
    example: 'https://example.com/photo.jpg',
  })
  @IsString()
  @IsOptional()
  photo!: string;

  @ApiProperty({
    description: 'Senha do usuário (opcional, será gerada automaticamente)',
    example: 'Password123!',
    required: false,
  })
  @IsString()
  @Length(8, 32)
  @IsOptional()
  password?: string;

  @ApiProperty({ description: 'Papel do usuário', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  role!: Role;

  @ApiProperty({ description: 'Nome do usuário', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Telefone do usuário',
    example: '+5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ description: 'Endereço do usuário', example: 'Rua A, 123' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({
    description: 'Status do usuário',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive!: boolean;

  @IsUUID()
  @IsNotEmpty()
  @ValidateIf((dto) => !dto.tenant) // Valida somente se tenant não for fornecido
  tenantId!: string;
}
