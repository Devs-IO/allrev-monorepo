export class OrderInstallmentDto {
  id!: string;
  sequence!: number;
  amount!: number;
  dueDate!: string;
  paidAt?: string | null;
}

export class OrderResponsibleDto {
  user!: { id: string; name?: string };
  assistantDeadline?: string;
  amount?: number;
  paidAt?: string | null;
  delivered?: boolean;
}

export class OrderItemDto {
  id!: string;
  functionality!: { id: string; name?: string | null };
  price!: number;
  clientDeadline!: string;
  itemStatus!: string;
  responsible?: OrderResponsibleDto | null;
}

export class OrderResponseDto {
  id!: string;
  orderNumber!: string;
  client!: { id: string };
  contractDate!: string;
  description?: string | null;
  paymentMethod!: string;
  paymentTerms!: string;
  paymentStatus!: string;
  amountTotal!: number;
  amountPaid!: number;
  workStatus!: string;
  items!: OrderItemDto[];
  installments!: OrderInstallmentDto[];
}
