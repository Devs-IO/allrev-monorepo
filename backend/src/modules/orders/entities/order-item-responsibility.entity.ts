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
import { OrderItem } from './order-item.entity';
import { User } from '../../user/entities/user.entity';
import { Functionality } from '../../functionality/entities/functionality.entity';

@Entity('order_item_responsibilities')
@Index(['orderItemId'])
@Index(['userId'])
export class OrderItemResponsibility {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @RelationId((r: OrderItemResponsibility) => r.orderItem)
  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId!: string;

  @ManyToOne(() => OrderItem, { nullable: false })
  @JoinColumn({ name: 'order_item_id' })
  orderItem!: OrderItem;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;
  @ManyToOne(() => User, (u) => u.responsibilities, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'functionality_id', type: 'uuid' })
  functionalityId!: string;
  @ManyToOne(() => Functionality, (f) => f.orderItemResponsibilities, { nullable: false })
  @JoinColumn({ name: 'functionality_id' })
  functionality!: Functionality;

  @Column({ name: 'assistant_deadline', type: 'timestamptz' })
  assistantDeadline!: Date;

  @Column('decimal', { precision: 12, scale: 2, name: 'amount' })
  amount!: number;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  // Banco legada usa a coluna 'is_delivered'; mapeamos para a prop 'delivered'
  @Column({ name: 'is_delivered', type: 'boolean', default: false })
  delivered!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
