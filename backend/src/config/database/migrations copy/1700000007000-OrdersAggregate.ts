import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrdersAggregate1700000007000 implements MigrationInterface {
  name = 'OrdersAggregate1700000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid-ossp extension is available for uuid_generate_v4()
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    // 1) Create enums for orders
    await queryRunner.query("CREATE TYPE order_payment_terms_enum AS ENUM ('ONE','TWO','THREE')");
    await queryRunner.query(
      "CREATE TYPE order_payment_status_enum AS ENUM ('PENDING','PARTIALLY_PAID','PAID')",
    );
    await queryRunner.query(
      "CREATE TYPE order_work_status_enum AS ENUM ('PENDING','IN_PROGRESS','AWAITING_CLIENT','AWAITING_ADVISOR','OVERDUE','COMPLETED','CANCELED')",
    );
    await queryRunner.query(
      "CREATE TYPE order_payment_method_enum AS ENUM ('pix','transfer','deposit','card','other')",
    );
    await queryRunner.query(
      "CREATE TYPE order_item_status_enum AS ENUM ('PENDING','IN_PROGRESS','AWAITING_CLIENT','AWAITING_ADVISOR','OVERDUE','FINISHED','DELIVERED')",
    );
    await queryRunner.query(
      "CREATE TYPE order_installment_channel_enum AS ENUM ('pix','link','qrcode','boleto','transfer','deposit','card','other')",
    );

    // 2) Create orders table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id uuid NOT NULL,
        client_id uuid NOT NULL,
        order_number varchar(50) NOT NULL,
        contract_date timestamptz NOT NULL,
        description text NULL,
        amount_total numeric(12,2) NOT NULL DEFAULT 0,
        amount_paid numeric(12,2) NOT NULL DEFAULT 0,
        payment_method order_payment_method_enum NOT NULL,
        payment_terms order_payment_terms_enum NOT NULL DEFAULT 'ONE',
        payment_status order_payment_status_enum NOT NULL DEFAULT 'PENDING',
        work_status order_work_status_enum NOT NULL DEFAULT 'PENDING',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz NULL
      );
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS UQ_orders_tenant_ordernumber ON orders(tenant_id, order_number)`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_orders_client ON orders(client_id)`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_orders_payment_status ON orders(payment_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_orders_work_status ON orders(work_status)`,
    );

    // 3) Create order_installments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_installments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL,
        sequence int NOT NULL,
        amount numeric(12,2) NOT NULL,
        due_date date NOT NULL,
        paid_at timestamptz NULL,
        channel order_installment_channel_enum NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz NULL,
        CONSTRAINT FK_order_installments_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_order_installments_order ON order_installments(order_id)`,
    );

    // 4) Rename functionalities_clients -> order_items, keep columns for backfill, then clean
    // noop: detect/rename handled below
    // rename safely even if already renamed
    await queryRunner.query(
      `DO $$ BEGIN IF to_regclass('public.order_items') IS NULL AND to_regclass('public.functionalities_clients') IS NOT NULL THEN ALTER TABLE functionalities_clients RENAME TO order_items; END IF; END $$;`,
    );

    // Add order_id nullable for now
    await queryRunner.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS order_id uuid NULL`);

    // Add price column and copy from total_price
    await queryRunner.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price numeric(12,2)`);
    await queryRunner.query(`UPDATE order_items SET price = COALESCE(price, total_price::numeric)`);

    // Add item_status new enum column and backfill from old status values
    await queryRunner.query(
      `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_status order_item_status_enum DEFAULT 'PENDING' NOT NULL`,
    );
    await queryRunner.query(`
      UPDATE order_items SET item_status = CASE
        WHEN status = 'PENDING_PAYMENT' THEN 'PENDING'::order_item_status_enum
        WHEN status = 'IN_PROGRESS' THEN 'IN_PROGRESS'::order_item_status_enum
        WHEN status = 'AWAITING_CLIENT' THEN 'AWAITING_CLIENT'::order_item_status_enum
        WHEN status = 'AWAITING_ADVISOR' THEN 'AWAITING_ADVISOR'::order_item_status_enum
        WHEN status = 'OVERDUE' THEN 'OVERDUE'::order_item_status_enum
        WHEN status = 'COMPLETED' THEN 'FINISHED'::order_item_status_enum
        WHEN status = 'CANCELED' THEN 'FINISHED'::order_item_status_enum
        ELSE 'PENDING'::order_item_status_enum
      END
      WHERE status IS NOT NULL
    `);

    // client_deadline -> timestamptz
    await queryRunner.query(
      `ALTER TABLE order_items ALTER COLUMN client_deadline TYPE timestamptz USING client_deadline::timestamptz`,
    );

    // 5) Rename functionalities_users -> order_item_responsibilities and FK column
    await queryRunner.query(
      `DO $$ BEGIN IF to_regclass('public.order_item_responsibilities') IS NULL AND to_regclass('public.functionalities_users') IS NOT NULL THEN ALTER TABLE functionalities_users RENAME TO order_item_responsibilities; END IF; END $$;`,
    );

    // Column rename functionality_client_id -> order_item_id
    await queryRunner.query(
      `DO $$ BEGIN IF (SELECT 1 FROM information_schema.columns WHERE table_name='order_item_responsibilities' AND column_name='functionality_client_id') IS NOT NULL THEN ALTER TABLE order_item_responsibilities RENAME COLUMN functionality_client_id TO order_item_id; END IF; END $$;`,
    );

    // Ensure column exists and type uuid
    await queryRunner.query(
      `ALTER TABLE order_item_responsibilities ALTER COLUMN order_item_id TYPE uuid USING order_item_id::uuid`,
    );

    // Add FK to order_items
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_item_responsibilities_item'
        ) THEN
          ALTER TABLE order_item_responsibilities
          ADD CONSTRAINT FK_order_item_responsibilities_item FOREIGN KEY(order_item_id)
          REFERENCES order_items(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // assistant_deadline, paid_at -> timestamptz
    await queryRunner.query(
      `ALTER TABLE order_item_responsibilities ALTER COLUMN assistant_deadline TYPE timestamptz USING assistant_deadline::timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE order_item_responsibilities ALTER COLUMN paid_at TYPE timestamptz USING paid_at::timestamptz`,
    );

    // 6) Backfill orders from order_items grouped by (tenant_id via clients, client_id, order_number)
    // amountPaid and max paid_at for each group
    await queryRunner.query(`
      INSERT INTO orders (id, tenant_id, client_id, order_number, contract_date, description, amount_total, amount_paid, payment_method, payment_terms, payment_status, work_status)
      SELECT uuid_generate_v4() AS id,
             c.tenant_id,
             oi.client_id,
             oi.order_number,
             COALESCE(min(oi.contract_date), now()) AS contract_date,
             MAX(oi.order_description) FILTER (WHERE oi.order_description IS NOT NULL) AS description,
             COALESCE(SUM(oi.price), 0)::numeric(12,2) AS amount_total,
             COALESCE(SUM(CASE WHEN oi.paid_at IS NOT NULL THEN oi.price ELSE 0 END), 0)::numeric(12,2) AS amount_paid,
             (
               CASE
                 WHEN lower(coalesce(min(oi.payment_method), 'pix')) IN ('pix') THEN 'pix'
                 WHEN lower(coalesce(min(oi.payment_method), 'pix')) IN ('transfer','bank transfer','bank_transfer','transferencia','transferência') THEN 'transfer'
                 WHEN lower(coalesce(min(oi.payment_method), 'pix')) IN ('deposit','deposito','depósito') THEN 'deposit'
                 WHEN lower(coalesce(min(oi.payment_method), 'pix')) IN ('card','credit card','credit_card','debit card','debit_card','cartao','cartão') THEN 'card'
                 WHEN lower(coalesce(min(oi.payment_method), 'pix')) IN ('boleto','cash','dinheiro') THEN 'other'
                 ELSE 'other'
               END
             )::order_payment_method_enum AS payment_method,
             'ONE'::order_payment_terms_enum AS payment_terms,
             CASE
               WHEN COALESCE(SUM(CASE WHEN oi.paid_at IS NOT NULL THEN oi.price ELSE 0 END), 0) = 0 THEN 'PENDING'
               WHEN COALESCE(SUM(CASE WHEN oi.paid_at IS NOT NULL THEN oi.price ELSE 0 END), 0) < COALESCE(SUM(oi.price), 0) THEN 'PARTIALLY_PAID'
               ELSE 'PAID'
             END::order_payment_status_enum AS payment_status,
             CASE
               WHEN BOOL_OR(oi.item_status = 'OVERDUE') THEN 'OVERDUE'
               WHEN BOOL_OR(oi.item_status = 'IN_PROGRESS') THEN 'IN_PROGRESS'
               WHEN BOOL_AND(oi.item_status IN ('FINISHED','DELIVERED')) THEN 'COMPLETED'
               ELSE 'PENDING'
             END::order_work_status_enum AS work_status
      FROM order_items oi
      JOIN clients c ON c.id = oi.client_id
      WHERE oi.order_number IS NOT NULL
      GROUP BY c.tenant_id, oi.client_id, oi.order_number;
    `);

    // Set order_id back to order_items by joining on keys
    await queryRunner.query(`
      UPDATE order_items oi
      SET order_id = o.id
      FROM orders o
      WHERE o.client_id = oi.client_id
        AND o.order_number = oi.order_number;
    `);

    // 7) Create installments
    // a) installment 1 for paid amount
    await queryRunner.query(`
      INSERT INTO order_installments (id, order_id, sequence, amount, due_date, paid_at)
      SELECT uuid_generate_v4(), o.id, 1,
             o.amount_paid,
             (o.contract_date)::date,
             sub.max_paid_at
      FROM orders o
      JOIN (
        SELECT c.tenant_id, oi.client_id, oi.order_number, MAX(oi.paid_at) AS max_paid_at
        FROM order_items oi
        JOIN clients c ON c.id = oi.client_id
        WHERE oi.paid_at IS NOT NULL
        GROUP BY c.tenant_id, oi.client_id, oi.order_number
      ) sub ON sub.tenant_id = o.tenant_id AND sub.client_id = o.client_id AND sub.order_number = o.order_number
      WHERE o.amount_paid > 0;
    `);

    // b) remaining amount as one future installment (30d)
    await queryRunner.query(`
      INSERT INTO order_installments (id, order_id, sequence, amount, due_date)
      SELECT uuid_generate_v4(), o.id, CASE WHEN o.amount_paid > 0 THEN 2 ELSE 1 END,
             (o.amount_total - o.amount_paid),
             (o.contract_date + interval '30 days')::date
      FROM orders o
      WHERE (o.amount_total - o.amount_paid) > 0;
    `);

    // Update payment_terms according to number of installments created
    await queryRunner.query(`
      UPDATE orders o
      SET payment_terms = CASE
        WHEN o.amount_paid = 0 OR (o.amount_total - o.amount_paid) = 0 THEN 'ONE'::order_payment_terms_enum
        ELSE 'TWO'::order_payment_terms_enum
      END
    `);

    // 8) Clean up item payment-related columns now that backfill is done
    // Drop old status column
    await queryRunner.query(
      `DO $$ BEGIN IF (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='status') IS NOT NULL THEN ALTER TABLE order_items DROP COLUMN status; END IF; END $$;`,
    );

    // Drop payment columns not used anymore
    await queryRunner.query(
      `DO $$ BEGIN IF (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='total_price') IS NOT NULL THEN ALTER TABLE order_items DROP COLUMN total_price; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='payment_method') IS NOT NULL THEN ALTER TABLE order_items DROP COLUMN payment_method; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='paid_at') IS NOT NULL THEN ALTER TABLE order_items DROP COLUMN paid_at; END IF; END $$;`,
    );

    // 9) Set NOT NULL and FKs/Indexes for order_items
    await queryRunner.query(`
      ALTER TABLE order_items
      ALTER COLUMN order_id SET NOT NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_items_order'
        ) THEN
          ALTER TABLE order_items
          ADD CONSTRAINT FK_order_items_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_order_items_order ON order_items(order_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_order_items_client ON order_items(client_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_order_items_item_status ON order_items(item_status)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort down migration
    // Drop FKs
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_items_order') THEN ALTER TABLE order_items DROP CONSTRAINT FK_order_items_order; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_item_responsibilities_item') THEN ALTER TABLE order_item_responsibilities DROP CONSTRAINT FK_order_item_responsibilities_item; END IF; END $$;`,
    );

    // Attempt to re-add old columns
    await queryRunner.query(
      `DO $$ BEGIN IF (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='total_price') IS NULL THEN ALTER TABLE order_items ADD COLUMN total_price numeric(10,2); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='payment_method') IS NULL THEN ALTER TABLE order_items ADD COLUMN payment_method varchar(50); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='paid_at') IS NULL THEN ALTER TABLE order_items ADD COLUMN paid_at date; END IF; END $$;`,
    );

    // Rename order_item_responsibilities back
    await queryRunner.query(
      `DO $$ BEGIN IF to_regclass('public.functionalities_users') IS NULL AND to_regclass('public.order_item_responsibilities') IS NOT NULL THEN ALTER TABLE order_item_responsibilities RENAME TO functionalities_users; END IF; END $$;`,
    );

    // Rename order_items back
    await queryRunner.query(
      `DO $$ BEGIN IF to_regclass('public.functionalities_clients') IS NULL AND to_regclass('public.order_items') IS NOT NULL THEN ALTER TABLE order_items RENAME TO functionalities_clients; END IF; END $$;`,
    );

    // Drop order_installments and orders
    await queryRunner.query('DROP TABLE IF EXISTS order_installments');
    await queryRunner.query('DROP TABLE IF EXISTS orders');

    // Drop enums
    await queryRunner.query('DROP TYPE IF EXISTS order_installment_channel_enum');
    await queryRunner.query('DROP TYPE IF EXISTS order_item_status_enum');
    await queryRunner.query('DROP TYPE IF EXISTS order_payment_method_enum');
    await queryRunner.query('DROP TYPE IF EXISTS order_work_status_enum');
    await queryRunner.query('DROP TYPE IF EXISTS order_payment_status_enum');
    await queryRunner.query('DROP TYPE IF EXISTS order_payment_terms_enum');
  }
}
