import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  RelationId,
  Index,
} from 'typeorm';

import { Tenant } from '../../tenant/entities/tenant.entity';
import { OneToMany } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
// Legacy relation removed: functionality-client entity migrated to orders domain

export enum ClientLegalNature {
  PERSON_PHYSICAL = 'PERSON_PHYSICAL',
  PERSON_LEGAL = 'PERSON_LEGAL',
}

@Index('UQ_clients_tenant_email', ['tenantId', 'email'], { unique: true })
@Entity('clients', { comment: 'Stores clients and their metadata' })
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @RelationId((client: Client) => client.tenant)
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 50 })
  name: string = '';

  @Column({ name: 'password', type: 'varchar', nullable: true, select: false })
  password?: string; // O select: false blinda a API de vazar senhas

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @Column({ type: 'varchar' })
  email: string = '';

  @Column({ type: 'varchar', nullable: true })
  course?: string = '';

  @Column({ type: 'varchar', nullable: true })
  university?: string = '';

  @Column({ type: 'varchar', nullable: true })
  institution?: string = '';

  @Column({ type: 'varchar', nullable: true })
  phone?: string = '';

  @Column({ type: 'text', nullable: true })
  observation?: string = '';

  @Column({ type: 'text', nullable: true })
  note?: string = '';

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string = '';

  @Column({ name: 'is_active', default: true })
  isActive: boolean = true;

  @Column({
    name: 'legal_nature',
    type: 'enum',
    enum: ClientLegalNature,
    nullable: true,
  })
  legalNature?: ClientLegalNature;

  @Column({ type: 'varchar', length: 11, nullable: true })
  cpf?: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cnpj?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date = new Date();

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @OneToMany(() => Order, (o) => o.client)
  orders!: Order[];

  @OneToMany(() => OrderItem, (i) => i.client)
  orderItems!: OrderItem[];
}
