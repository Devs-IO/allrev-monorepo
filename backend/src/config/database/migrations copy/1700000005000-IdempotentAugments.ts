import { MigrationInterface, QueryRunner } from 'typeorm';

export class IdempotentAugments1700000005000 implements MigrationInterface {
  name = 'IdempotentAugments1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // -- users: must_change_password
    await queryRunner.query(
      `ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "must_change_password" boolean NOT NULL DEFAULT false;`,
    );

    // -- functionalities_clients: enum, columns, backfill contract_date
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."functionalities_clients_status_enum" AS ENUM
      ('PENDING_PAYMENT','IN_PROGRESS','AWAITING_CLIENT','AWAITING_ADVISOR','COMPLETED','CANCELED','OVERDUE');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

    await queryRunner.query(`ALTER TABLE "functionalities_clients"
      ADD COLUMN IF NOT EXISTS "status" "public"."functionalities_clients_status_enum" NOT NULL DEFAULT 'PENDING_PAYMENT',
      ADD COLUMN IF NOT EXISTS "contract_date" TIMESTAMPTZ;`);

    await queryRunner.query(
      `UPDATE "functionalities_clients" SET "contract_date" = COALESCE("contract_date", NOW());`,
    );

    await queryRunner.query(
      `ALTER TABLE "functionalities_clients" ALTER COLUMN "contract_date" SET NOT NULL;`,
    );

    // -- functionalities_users: enum and fields
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."functionalities_users_status_enum" AS ENUM
      ('ASSIGNED','IN_PROGRESS','AWAITING_CLIENT','AWAITING_ADVISOR','COMPLETED','DELIVERED','CANCELED','OVERDUE');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

    await queryRunner.query(`ALTER TABLE "functionalities_users"
      ADD COLUMN IF NOT EXISTS "service_start_date" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "service_end_date" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "status" "public"."functionalities_users_status_enum" NOT NULL DEFAULT 'ASSIGNED',
      ADD COLUMN IF NOT EXISTS "price" NUMERIC(10,2) NOT NULL DEFAULT 0;`);

    // Ensure end date exists when start date exists but end is null (idempotent)
    await queryRunner.query(`UPDATE "functionalities_users"
      SET "service_end_date" = ("service_start_date" + INTERVAL '3 days')
      WHERE "service_start_date" IS NOT NULL AND "service_end_date" IS NULL;`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op to avoid data loss
  }
}
