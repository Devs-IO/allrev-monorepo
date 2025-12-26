import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFunctionalitiesClientsStatus1700000003000 implements MigrationInterface {
  name = 'UpdateFunctionalitiesClientsStatus1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create new enum if not exists
    await queryRunner.query(
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'functionalities_clients_status_enum_v2') THEN
           CREATE TYPE "public"."functionalities_clients_status_enum_v2" AS ENUM ('PENDING_PAYMENT','IN_PROGRESS','AWAITING_CLIENT','AWAITING_ADVISOR','COMPLETED','CANCELED','OVERDUE');
         END IF;
       END $$;`,
    );

    // Add contract_date column if missing
    await queryRunner.query(
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns
            WHERE table_name='functionalities_clients' AND column_name='contract_date'
         ) THEN
           ALTER TABLE "functionalities_clients" ADD COLUMN "contract_date" TIMESTAMPTZ;
           UPDATE "functionalities_clients" SET "contract_date" = NOW() WHERE "contract_date" IS NULL;
           ALTER TABLE "functionalities_clients" ALTER COLUMN "contract_date" SET NOT NULL;
         END IF;
       END $$;`,
    );

    // If old enum exists, migrate to new enum
    const hasOldEnum = await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'functionalities_clients_status_enum'`,
    );
    if (hasOldEnum.length > 0) {
      // Add temporary column with new enum type
      await queryRunner.query(
        `ALTER TABLE "functionalities_clients" ADD COLUMN IF NOT EXISTS "status_tmp" "public"."functionalities_clients_status_enum_v2" DEFAULT 'PENDING_PAYMENT'`,
      );

      // Map old values to new ones
      await queryRunner.query(
        `UPDATE "functionalities_clients" SET "status_tmp" = CASE ("status"::text)
           WHEN 'PENDING' THEN 'PENDING_PAYMENT'::"public"."functionalities_clients_status_enum_v2"
           WHEN 'PAID' THEN 'COMPLETED'::"public"."functionalities_clients_status_enum_v2"
           WHEN 'OVERDUE' THEN 'OVERDUE'::"public"."functionalities_clients_status_enum_v2"
           ELSE 'PENDING_PAYMENT'::"public"."functionalities_clients_status_enum_v2"
         END`,
      );

      // Drop default, drop old column and type, then rename
      await queryRunner.query(
        `ALTER TABLE "functionalities_clients" ALTER COLUMN "status" DROP DEFAULT`,
      );
      await queryRunner.query(`ALTER TABLE "functionalities_clients" DROP COLUMN "status"`);
      await queryRunner.query(`DROP TYPE IF EXISTS "public"."functionalities_clients_status_enum"`);
      await queryRunner.query(
        `ALTER TABLE "functionalities_clients" RENAME COLUMN "status_tmp" TO "status"`,
      );
      await queryRunner.query(
        `ALTER TABLE "functionalities_clients" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`,
      );
    } else {
      // If no old enum, ensure the column exists with new enum type
      await queryRunner.query(
        `DO $$ BEGIN
           IF NOT EXISTS (
             SELECT 1 FROM information_schema.columns
              WHERE table_name='functionalities_clients' AND column_name='status'
           ) THEN
             ALTER TABLE "functionalities_clients" ADD COLUMN "status" "public"."functionalities_clients_status_enum_v2" NOT NULL DEFAULT 'PENDING_PAYMENT';
           END IF;
         END $$;`,
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op down migration to avoid data loss.
  }
}
