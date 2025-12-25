import { Type } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsDate,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { PaymentFrequency } from '../../../@shared/enums/payment-frequency.enum';
import { PaymentMethod } from '../../../@shared/enums/payment-method.enum';
import { PaymentStatus } from '../../../@shared/enums/payment-status.enum';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  companyName!: string;

  @IsString()
  address!: string;

  @IsString()
  phone!: string;

  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsBoolean()
  isActive!: boolean;

  @IsEnum(PaymentFrequency)
  paymentFrequency!: PaymentFrequency;

  @Type(() => Date)
  @IsDate()
  paymentDueDate!: Date;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot be longer than 500 characters' })
  description?: string;
}
