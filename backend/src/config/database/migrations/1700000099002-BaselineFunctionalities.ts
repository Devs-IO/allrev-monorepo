import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineFunctionalities1700000099002 implements MigrationInterface {
  name = 'BaselineFunctionalities1700000099002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create functionality_status enum
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'functionality_status') THEN
          CREATE TYPE functionality_status AS ENUM ('ACTIVE', 'INACTIVE');
        END IF;
      END $$;
    `);

    // Create functionalities table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS functionalities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        minimum_price DECIMAL(10, 2),
        default_assistant_price DECIMAL(10, 2),
        default_assistant_id UUID,
        status functionality_status NOT NULL DEFAULT 'ACTIVE',
        responsible_user_id UUID,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        deleted_at TIMESTAMP,
        CONSTRAINT FK_functionalities_tenant 
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT FK_functionalities_default_assistant 
          FOREIGN KEY (default_assistant_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT FK_functionalities_responsible_user 
          FOREIGN KEY (responsible_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create unique index on tenant_id, name, and responsible_user_id
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_functionalities_tenant_name_responsible 
      ON functionalities(tenant_id, name, responsible_user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS UQ_functionalities_tenant_name_responsible`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS functionalities`);

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS functionality_status`);
  }
}
