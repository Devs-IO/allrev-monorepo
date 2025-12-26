import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceResponsibles1700000006000 implements MigrationInterface {
  name = 'AddServiceResponsibles1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_responsibles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "functionality_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_sr_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sr_functionality" FOREIGN KEY ("functionality_id") REFERENCES "functionalities"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sr_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_service_responsibles_tenant_func_user" UNIQUE ("tenant_id", "functionality_id", "user_id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "service_responsibles"');
  }
}
