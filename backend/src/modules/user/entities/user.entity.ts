import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

import { UserTenant } from './user-tenant.entity';
import { OrderItemResponsibility } from '../../orders/entities/order-item-responsibility.entity';

@Entity('users', { comment: 'Stores system users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  photo: string = '';

  @Column()
  name: string = '';

  @Column({ unique: true })
  email: string = '';

  @Column({ unique: true })
  phone: string = '';

  @Column()
  address: string = '';

  @Column()
  password: string = '';

  @Column({ name: 'must_change_password', type: 'boolean', default: false })
  mustChangePassword: boolean = false;

  @Column({ name: 'is_active', default: true })
  isActive: boolean = true;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string = '';

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string = '';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date = new Date();

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @OneToMany(() => OrderItemResponsibility, (r) => r.user)
  responsibilities!: OrderItemResponsibility[];

  @OneToMany(() => UserTenant, (ut) => ut.user)
  userTenants!: UserTenant[];
}
