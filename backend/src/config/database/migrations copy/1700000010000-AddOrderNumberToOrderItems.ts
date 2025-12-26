import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderNumberToOrderItems1700000010000 implements MigrationInterface {
  name = 'AddOrderNumberToOrderItems1700000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column if missing
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_name='order_items' AND column_name='order_number'
        ) THEN
          ALTER TABLE "order_items" ADD COLUMN "order_number" varchar(50);
        END IF;
      END $$;
    `);

    // Backfill from orders table when possible
    await queryRunner.query(`
      UPDATE "order_items" i
      SET "order_number" = o."order_number"
      FROM "orders" o
      WHERE i."order_id" = o."id" AND (i."order_number" IS NULL OR i."order_number" = '')
    `);

    // Enforce NOT NULL if possible
    await queryRunner.query(`
      DO $$ BEGIN
        -- Set any still-null values to derived sequence for safety
        UPDATE "order_items" SET "order_number" = 'ORD-' || to_char(now(), 'YYYYMMDD') || '-000'
        WHERE "order_number" IS NULL;
        -- Set not null constraint
        ALTER TABLE "order_items" ALTER COLUMN "order_number" SET NOT NULL;
      EXCEPTION WHEN others THEN
        -- If setting NOT NULL fails due to legacy anomalies, keep it nullable but log via RAISE NOTICE
        RAISE NOTICE 'Could not enforce NOT NULL on order_items.order_number';
      END $$;
    `);

    // Optional index for lookups
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = 'IDX_order_items_order_number' AND n.nspname = 'public'
        ) THEN
          CREATE INDEX "IDX_order_items_order_number" ON "order_items" ("order_number");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = 'IDX_order_items_order_number' AND n.nspname = 'public'
        ) THEN
          DROP INDEX IF EXISTS "IDX_order_items_order_number";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_name='order_items' AND column_name='order_number'
        ) THEN
          ALTER TABLE "order_items" DROP COLUMN "order_number";
        END IF;
      END $$;
    `);
  }
}
