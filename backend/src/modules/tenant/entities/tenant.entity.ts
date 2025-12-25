import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

import { User } from '../../../modules/user/entities/user.entity';
import { UserTenant } from '../../../modules/user/entities/user-tenant.entity';
import { Functionality } from '../../functionality/entities/functionality.entity';
import { PaymentFrequency } from '../../../@shared/enums/payment-frequency.enum';
import { PaymentMethod } from '../../../@shared/enums/payment-method.enum';
import { PaymentStatus } from '../../../@shared/enums/payment-status.enum';

@Entity('tenants', { comment: 'Stores tenant organizations and their subscription details' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code: string = '';

  @Column({ name: 'company_name' })
  companyName: string = '';

  @Column()
  address: string = '';

  @Column({ unique: true })
  phone: string = '';

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus = PaymentStatus.UNPAID;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod!: PaymentMethod;

  @Column({ name: 'is_active', default: true })
  isActive: boolean = true;

  @Column({
    name: 'payment_frequency',
    type: 'enum',
    enum: PaymentFrequency,
    default: PaymentFrequency.MONTHLY,
  })
  paymentFrequency: PaymentFrequency = PaymentFrequency.MONTHLY;

  @Column({ name: 'payment_due_date', type: 'date' })
  paymentDueDate: Date = new Date();

  @Column({ nullable: true })
  logo: string = '';

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string = '';

  @OneToMany(() => User, (user) => (user as any).tenant)
  users!: User[];

  @OneToMany(() => UserTenant, (ut) => ut.tenant)
  userTenants!: UserTenant[];

  @OneToMany(() => Functionality, (functionality) => functionality.tenant)
  functionalities!: Functionality[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date = new Date();

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
