import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  RelationId,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';

export enum PaymentMethod {
  BOLETO = 'BOLETO',
  CREDIT_CARD = 'CREDIT_CARD',
  PIX = 'PIX',
  OTHER = 'OTHER',
}

@Entity('order_installments')
@Index(['orderId'])
@Index(['sequence'])
export class OrderInstallment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @RelationId((i: OrderInstallment) => i.order)
  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, (o) => o.installments, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_number', type: 'varchar', length: 50, nullable: true })
  orderNumber!: string;

  @Column({ type: 'int' })
  sequence!: number; // 1..3

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @Column({
    name: 'channel',
    type: 'enum',
    enum: ['pix', 'link', 'qrcode', 'boleto', 'transfer', 'deposit', 'card', 'other'],
    nullable: true,
  })
  channel?: 'pix' | 'link' | 'qrcode' | 'boleto' | 'transfer' | 'deposit' | 'card' | 'other' | null;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod?: PaymentMethod;

  @Column({
    name: 'payment_method_description',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  paymentMethodDescription?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
