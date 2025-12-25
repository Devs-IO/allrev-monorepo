import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  RelationId,
  Index,
  OneToMany,
} from 'typeorm';
import { Order } from './order.entity';
import { Client } from '../../client/entities/client.entity';
import { Functionality } from '../../functionality/entities/functionality.entity';
import { OrderItemResponsibility } from './order-item-responsibility.entity';

export enum OrderItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_CLIENT = 'AWAITING_CLIENT',
  AWAITING_ADVISOR = 'AWAITING_ADVISOR',
  OVERDUE = 'OVERDUE',
  FINISHED = 'FINISHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Entity('order_items')
@Index(['orderId'])
@Index(['clientId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @RelationId((i: OrderItem) => i.order)
  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId!: string | null; // será NOT NULL após backfill

  @ManyToOne(() => Order, (o) => o.items, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order!: Order | null;

  @Column({ name: 'functionality_id', type: 'uuid' })
  functionalityId!: string;
  @ManyToOne(() => Functionality, (f) => f.orderItems, { nullable: false })
  @JoinColumn({ name: 'functionality_id' })
  functionality!: Functionality;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;
  @ManyToOne(() => Client, (c) => c.orderItems, { nullable: false })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  // CÓDIGO NOVO: Adiciona a data do contrato, conforme o erro da base de dados
  @Column({ name: 'contract_date', type: 'timestamptz' })
  contractDate!: Date;
  // FIM CÓDIGO NOVO

  // Redundante para auditoria/consulta: número da ordem (FK lógica)
  @Column({ name: 'order_number', type: 'varchar', length: 50, nullable: true })
  orderNumber?: string | null;

  @Column('decimal', { precision: 12, scale: 2, name: 'price' })
  price!: number;

  @Column({ name: 'client_deadline', type: 'timestamptz' })
  clientDeadline!: Date;

  @Column({
    name: 'item_status',
    type: 'enum',
    enum: OrderItemStatus,
    default: OrderItemStatus.PENDING,
  })
  itemStatus!: OrderItemStatus;

  @OneToMany(() => OrderItemResponsibility, (r) => r.orderItem)
  responsibilities!: OrderItemResponsibility[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
