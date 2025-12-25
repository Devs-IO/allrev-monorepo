import { Injectable } from '@nestjs/common';

@Injectable()
export class MessageService {
  private readonly messages: Record<string, string> = {
    // Validation errors
    'validation.required': 'Este campo é obrigatório',
    'validation.invalid': 'Valor inválido',
    'validation.string': 'Deve ser um texto válido',
    'validation.email': 'Email inválido',
    'validation.number': 'Deve ser um número válido',
    'validation.boolean': 'Deve ser verdadeiro ou falso',
    'validation.date': 'Data inválida',
    'validation.enum': 'Valor não permitido',
    'validation.min': 'Valor muito pequeno',
    'validation.max': 'Valor muito grande',
    'validation.length': 'Tamanho inválido',

    // Business errors
    'tenant.not_found': 'Inquilino não encontrado',
    'tenant.code_already_exists': 'Código de inquilino já existe',
    'tenant.invalid_payment_status': 'Status de pagamento inválido',
    'tenant.invalid_payment_method': 'Método de pagamento inválido',
    'tenant.invalid_payment_frequency': 'Frequência de pagamento inválida',

    // Payment Status messages
    'payment_status.paid': 'Pago',
    'payment_status.unpaid': 'Não pago',
    'payment_status.overdue': 'Em atraso',
    'payment_status.pending': 'Pendente',
    'payment_status.cancelled': 'Cancelado',

    // Payment Method messages
    'payment_method.credit_card': 'Cartão de crédito',
    'payment_method.debit_card': 'Cartão de débito',
    'payment_method.bank_transfer': 'Transferência bancária',
    'payment_method.pix': 'PIX',
    'payment_method.boleto': 'Boleto',
    'payment_method.cash': 'Dinheiro',

    // Payment Frequency messages
    'payment_frequency.monthly': 'Mensal',
    'payment_frequency.annual': 'Anual',

    // Database errors
    'database.connection_error': 'Erro de conexão com o banco de dados',
    'database.constraint_violation': 'Violação de restrição do banco de dados',
    'database.duplicate_entry': 'Entrada duplicada',

    // Generic errors
    'error.internal_server': 'Erro interno do servidor',
    'error.unauthorized': 'Acesso não autorizado',
    'error.forbidden': 'Acesso negado',
    'error.bad_request': 'Requisição inválida',
  };

  getMessage(key: string, params?: Record<string, any>): string {
    let message = this.messages[key] || key;

    if (params) {
      Object.keys(params).forEach((param) => {
        message = message.replace(`{${param}}`, params[param]);
      });
    }

    return message;
  }

  hasMessage(key: string): boolean {
    return key in this.messages;
  }
}
