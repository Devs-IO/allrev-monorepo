import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  RelationId,
  OneToMany,
} from 'typeorm';

import { Tenant } from '../../tenant/entities/tenant.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { OrderItemResponsibility } from '../../orders/entities/order-item-responsibility.entity';
import { User } from '../../user/entities/user.entity';
// Legacy mapping removed: functionality-user/client entities were migrated to orders domain

@Entity('functionalities', {
  comment: 'Stores available functionalities/services offered by tenants',
})
@Index(['tenantId', 'name', 'responsibleUserId'], { unique: true })
export class Functionality {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @RelationId((f: Functionality) => f.tenant)
  @Column({ name: 'tenant_id' })
  tenantId!: string;
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ length: 100 })
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  // valor mínimo cobrado pelo serviço
  @Column('decimal', { precision: 10, scale: 2, name: 'minimum_price' })
  minimumPrice!: number;

  // valor padrão a pagar a um assistant reviewer (opcional)
  @Column('decimal', { precision: 10, scale: 2, name: 'default_assistant_price', nullable: true })
  defaultAssistantPrice?: number;

  // usuário padrão (assistant) a ser atribuído quando aplicável (opcional)
  @RelationId((f: Functionality) => f.defaultAssistant)
  @Column('uuid', { name: 'default_assistant_id', nullable: true })
  defaultAssistantId?: string | null;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'default_assistant_id' })
  defaultAssistant?: User | null;

  @Column({ type: 'enum', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  status!: 'ACTIVE' | 'INACTIVE';

  // id do manager responsável pela criação
  @Column('uuid', { name: 'responsible_user_id' })
  responsibleUserId!: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean = true;

  // relations to legacy tables removed to avoid duplicate entity metadata after migration

  @OneToMany(() => OrderItem, (i) => i.functionality)
  orderItems!: OrderItem[];

  @OneToMany(() => OrderItemResponsibility, (r) => r.functionality)
  orderItemResponsibilities!: OrderItemResponsibility[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
