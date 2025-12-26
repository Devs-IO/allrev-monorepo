import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultAssistantToFunctionalities1700000009000 implements MigrationInterface {
  name = 'AddDefaultAssistantToFunctionalities1700000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column default_assistant_id if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_name='functionalities' AND column_name='default_assistant_id'
        ) THEN
          ALTER TABLE "functionalities" ADD COLUMN "default_assistant_id" uuid NULL;
        END IF;
      END $$;
    `);

    // Add FK if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1
            FROM information_schema.table_constraints tc
            WHERE tc.constraint_name = 'FK_functionalities_default_assistant' AND tc.table_name = 'functionalities'
        ) THEN
          ALTER TABLE "functionalities"
          ADD CONSTRAINT "FK_functionalities_default_assistant"
          FOREIGN KEY ("default_assistant_id") REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1
            FROM information_schema.table_constraints tc
            WHERE tc.constraint_name = 'FK_functionalities_default_assistant' AND tc.table_name = 'functionalities'
        ) THEN
          ALTER TABLE "functionalities" DROP CONSTRAINT "FK_functionalities_default_assistant";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_name='functionalities' AND column_name='default_assistant_id'
        ) THEN
          ALTER TABLE "functionalities" DROP COLUMN "default_assistant_id";
        END IF;
      END $$;
    `);
  }
}
