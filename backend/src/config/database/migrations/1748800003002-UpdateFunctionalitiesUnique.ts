import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFunctionalitiesUnique1748800003002 implements MigrationInterface {
  name = 'UpdateFunctionalitiesUnique1748800003002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop previous unique index on (tenant_id, name) if it exists
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_functionalities_tenant_name'
      ) THEN
        DROP INDEX "IDX_functionalities_tenant_name";
      END IF;
    END $$;`);

    // Create new unique index on (tenant_id, name, responsible_user_id) if not exists
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'UQ_functionalities_tenant_name_responsible'
      ) THEN
        CREATE UNIQUE INDEX "UQ_functionalities_tenant_name_responsible" ON "functionalities" (tenant_id, name, responsible_user_id);
      END IF;
    END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate old unique index and drop the new one (best-effort)
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'UQ_functionalities_tenant_name_responsible'
      ) THEN
        DROP INDEX "UQ_functionalities_tenant_name_responsible";
      END IF;
    END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_functionalities_tenant_name'
      ) THEN
        CREATE UNIQUE INDEX "IDX_functionalities_tenant_name" ON "functionalities" (tenant_id, name);
      END IF;
    END $$;`);
  }
}
