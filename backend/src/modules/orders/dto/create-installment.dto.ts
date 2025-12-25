import { IsDateString, IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateInstallmentDto {
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount!: number;

  @IsDateString()
  @IsNotEmpty()
  dueDate!: string;

  @IsEnum(['pix', 'link', 'qrcode', 'boleto', 'transfer', 'deposit', 'card', 'other'] as any)
  @IsNotEmpty()
  channel!: 'pix' | 'link' | 'qrcode' | 'boleto' | 'transfer' | 'deposit' | 'card' | 'other';
}
