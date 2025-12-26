import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTenants1700000003500 implements MigrationInterface {
  name = 'CreateUserTenants1700000003500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('user_tenants');
    if (exists) return;

    await queryRunner.query(`
      CREATE TABLE "user_tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,

        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP NULL,

        "observation" text NULL,

        CONSTRAINT "PK_user_tenants_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_tenants_user_tenant" UNIQUE ("user_id", "tenant_id"),
        CONSTRAINT "FK_user_tenants_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_tenants_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_user_tenants_user_id" ON "user_tenants" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_tenants_tenant_id" ON "user_tenants" ("tenant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('user_tenants');
    if (!exists) return;

    await queryRunner.query(`DROP TABLE "user_tenants"`);
  }
}
