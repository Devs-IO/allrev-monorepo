import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { MessageService } from '../services/message.service';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  constructor(private readonly messageService: MessageService) {}

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const formattedErrors = this.formatValidationErrors(errors);
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Dados de entrada inválidos',
        details: formattedErrors,
      });
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatValidationErrors(errors: any[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    errors.forEach((error) => {
      const field = error.property;
      const constraints = error.constraints || {};

      result[field] = Object.keys(constraints).map((key) => {
        return this.getValidationMessage(key, field, error.value);
      });
    });

    return result;
  }

  private getValidationMessage(constraint: string, field: string, value: any): string {
    const messageKey = `validation.${constraint}`;

    if (this.messageService.hasMessage(messageKey)) {
      return this.messageService.getMessage(messageKey, { field, value });
    }

    // Fallback messages for common validation constraints
    switch (constraint) {
      case 'isNotEmpty':
        return this.messageService.getMessage('validation.required');
      case 'isString':
        return this.messageService.getMessage('validation.string');
      case 'isEmail':
        return this.messageService.getMessage('validation.email');
      case 'isNumber':
        return this.messageService.getMessage('validation.number');
      case 'isBoolean':
        return this.messageService.getMessage('validation.boolean');
      case 'isDate':
        return this.messageService.getMessage('validation.date');
      case 'isEnum':
        return this.messageService.getMessage('validation.enum');
      default:
        return this.messageService.getMessage('validation.invalid');
    }
  }
}
