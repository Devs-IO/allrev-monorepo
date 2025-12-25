import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceFunctionalityUniqueAndFK1748800004000 implements MigrationInterface {
  name = 'EnforceFunctionalityUniqueAndFK1748800004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure unique (tenant_id, name)
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'UQ_functionalities_tenant_name'
      ) THEN
        CREATE UNIQUE INDEX "UQ_functionalities_tenant_name" ON "functionalities" (tenant_id, name);
      END IF;
    END $$;`);

    // Ensure responsible_user_id column is NOT NULL and has FK to users(id)
    await queryRunner.query(
      `ALTER TABLE "functionalities" ALTER COLUMN "responsible_user_id" SET NOT NULL;`,
    );

    // Add FK if missing
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_functionalities_responsible_user' AND table_name = 'functionalities'
      ) THEN
        ALTER TABLE "functionalities"
        ADD CONSTRAINT "FK_functionalities_responsible_user"
        FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
      END IF;
    END $$;`);

    // Drop older composite unique with responsible_user_id if present
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'UQ_functionalities_tenant_name_responsible'
      ) THEN
        DROP INDEX "UQ_functionalities_tenant_name_responsible";
      END IF;
    END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort rollback: drop the new unique and FK, restore prior composite unique
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_functionalities_responsible_user' AND table_name = 'functionalities'
      ) THEN
        ALTER TABLE "functionalities" DROP CONSTRAINT "FK_functionalities_responsible_user";
      END IF;
    END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'UQ_functionalities_tenant_name'
      ) THEN
        DROP INDEX "UQ_functionalities_tenant_name";
      END IF;
    END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'UQ_functionalities_tenant_name_responsible'
      ) THEN
        CREATE UNIQUE INDEX "UQ_functionalities_tenant_name_responsible" ON "functionalities" (tenant_id, name, responsible_user_id);
      END IF;
    END $$;`);
  }
}
