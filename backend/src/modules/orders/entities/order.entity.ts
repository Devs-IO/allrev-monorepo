import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderInstallment } from './order-installment.entity';
import { Client } from '../../client/entities/client.entity';

export enum OrderPaymentTerms {
  ONE = 'ONE',
  TWO = 'TWO',
  THREE = 'THREE',
}

export enum OrderPaymentStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export enum OrderWorkStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_CLIENT = 'AWAITING_CLIENT',
  AWAITING_ADVISOR = 'AWAITING_ADVISOR',
  OVERDUE = 'OVERDUE',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

@Entity('orders')
@Index(['tenantId', 'orderNumber'], { unique: true })
@Index(['clientId'])
@Index(['paymentStatus'])
@Index(['workStatus'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @ManyToOne(() => Client, (c) => c.orders, { nullable: false })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @Column({ name: 'order_number', type: 'varchar', length: 50 })
  orderNumber!: string;

  @Column({ name: 'contract_date', type: 'timestamptz' })
  contractDate!: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  observation?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column('decimal', { precision: 12, scale: 2, name: 'amount_total', default: 0 })
  amountTotal!: number;

  @Column('decimal', { precision: 12, scale: 2, name: 'amount_paid', default: 0 })
  amountPaid!: number;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: ['pix', 'transfer', 'deposit', 'card', 'other'],
  })
  paymentMethod!: 'pix' | 'transfer' | 'deposit' | 'card' | 'other';

  @Column({
    name: 'payment_terms',
    type: 'enum',
    enum: OrderPaymentTerms,
    default: OrderPaymentTerms.ONE,
  })
  paymentTerms!: OrderPaymentTerms;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: OrderPaymentStatus,
    default: OrderPaymentStatus.PENDING,
  })
  paymentStatus!: OrderPaymentStatus;

  @Column({
    name: 'work_status',
    type: 'enum',
    enum: OrderWorkStatus,
    default: OrderWorkStatus.PENDING,
  })
  workStatus!: OrderWorkStatus;

  @Column({ name: 'has_invoice', default: false })
  hasInvoice: boolean = false;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];

  @OneToMany(() => OrderInstallment, (inst) => inst.order)
  installments!: OrderInstallment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
