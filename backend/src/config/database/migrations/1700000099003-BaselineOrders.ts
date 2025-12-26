import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineOrders1700000099003 implements MigrationInterface {
  name = 'BaselineOrders1700000099003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create order-related enums
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_payment_terms_enum') THEN
          CREATE TYPE order_payment_terms_enum AS ENUM ('CASH', 'INSTALLMENT');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_payment_status_enum') THEN
          CREATE TYPE order_payment_status_enum AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_work_status_enum') THEN
          CREATE TYPE order_work_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_payment_method_enum') THEN
          CREATE TYPE order_payment_method_enum AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'CHECK', 'OTHER');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_item_status_enum') THEN
          CREATE TYPE order_item_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_installment_channel_enum') THEN
          CREATE TYPE order_installment_channel_enum AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'CHECK', 'OTHER');
        END IF;
      END $$;
    `);

    // Create orders table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL,
        client_id UUID NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        remaining_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        payment_terms order_payment_terms_enum NOT NULL DEFAULT 'CASH',
        payment_status order_payment_status_enum NOT NULL DEFAULT 'PENDING',
        work_status order_work_status_enum NOT NULL DEFAULT 'PENDING',
        order_date DATE NOT NULL,
        installments_count INTEGER DEFAULT 1,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        deleted_at TIMESTAMP,
        CONSTRAINT FK_orders_tenant 
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT FK_orders_client 
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
      )
    `);

    // Create order_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL,
        functionality_id UUID NOT NULL,
        contract_date DATE,
        client_deadline DATE,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        item_status order_item_status_enum NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        deleted_at TIMESTAMP,
        CONSTRAINT FK_order_items_order 
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_order_items_functionality 
          FOREIGN KEY (functionality_id) REFERENCES functionalities(id) ON DELETE RESTRICT
      )
    `);

    // Create order_installments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_installments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL,
        sequence INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        due_date DATE NOT NULL,
        paid_at TIMESTAMP,
        paid_amount DECIMAL(10, 2) DEFAULT 0,
        payment_method order_payment_method_enum,
        channel order_installment_channel_enum,
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        deleted_at TIMESTAMP,
        CONSTRAINT FK_order_installments_order 
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Create order_item_responsibilities table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_item_responsibilities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_item_id UUID NOT NULL,
        user_id UUID NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        paid_at TIMESTAMP,
        delivered BOOLEAN NOT NULL DEFAULT false,
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        deleted_at TIMESTAMP,
        CONSTRAINT FK_order_item_responsibilities_order_item 
          FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
        CONSTRAINT FK_order_item_responsibilities_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_orders_tenant 
      ON orders(tenant_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_orders_client 
      ON orders(client_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_order_items_order 
      ON order_items(order_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_order_installments_order 
      ON order_installments(order_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_order_item_responsibilities_order_item 
      ON order_item_responsibilities(order_item_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_order_item_responsibilities_order_item`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_order_installments_order`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_order_items_order`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_orders_client`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_orders_tenant`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS order_item_responsibilities`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_installments`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS order_installment_channel_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_item_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_payment_method_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_work_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_payment_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_payment_terms_enum`);
  }
}
