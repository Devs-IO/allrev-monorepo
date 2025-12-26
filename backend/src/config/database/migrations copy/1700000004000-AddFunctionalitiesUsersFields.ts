import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFunctionalitiesUsersFields1700000004000 implements MigrationInterface {
  name = 'AddFunctionalitiesUsersFields1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for functionalities_users status if not exists
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'functionalities_users_status_enum') THEN
        CREATE TYPE "public"."functionalities_users_status_enum" AS ENUM (
          'ASSIGNED','IN_PROGRESS','AWAITING_CLIENT','AWAITING_ADVISOR','COMPLETED','DELIVERED','CANCELED','OVERDUE'
        );
      END IF;
    END $$;`);

    // Add columns if missing
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='functionalities_users' AND column_name='service_start_date'
      ) THEN
        ALTER TABLE "functionalities_users" ADD COLUMN "service_start_date" TIMESTAMPTZ NULL;
      END IF;
    END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='functionalities_users' AND column_name='service_end_date'
      ) THEN
        ALTER TABLE "functionalities_users" ADD COLUMN "service_end_date" TIMESTAMPTZ NULL;
      END IF;
    END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='functionalities_users' AND column_name='status'
      ) THEN
        ALTER TABLE "functionalities_users" ADD COLUMN "status" "public"."functionalities_users_status_enum" NOT NULL DEFAULT 'ASSIGNED';
      END IF;
    END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='functionalities_users' AND column_name='price'
      ) THEN
        ALTER TABLE "functionalities_users" ADD COLUMN "price" numeric(10,2) NOT NULL DEFAULT 0;
      END IF;
    END $$;`);

    // Ensure service_end_date is set when service_start_date exists and end is null
    await queryRunner.query(`UPDATE "functionalities_users"
      SET "service_end_date" = ("service_start_date" + INTERVAL '3 days')
      WHERE "service_start_date" IS NOT NULL AND "service_end_date" IS NULL;`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op to avoid data loss
  }
}
