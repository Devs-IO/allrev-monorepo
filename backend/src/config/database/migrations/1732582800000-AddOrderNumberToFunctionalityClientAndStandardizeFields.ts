import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderNumberToFunctionalityClientAndStandardizeFields1732582800000
  implements MigrationInterface
{
  name = 'AddOrderNumberToFunctionalityClientAndStandardizeFields1732582800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add order_number column to functionalities_clients
    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      ADD COLUMN "order_number" VARCHAR(50)
    `);

    // Add order_description column to functionalities_clients
    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      ADD COLUMN "order_description" VARCHAR(1000)
    `);

    // Add order_number column to functionalities_users
    await queryRunner.query(`
      ALTER TABLE "functionalities_users"
      ADD COLUMN "order_number" VARCHAR(50)
    `);

    // Add functionality_client_id for easier joins
    await queryRunner.query(`
      ALTER TABLE "functionalities_users"
      ADD COLUMN "functionality_client_id" UUID
    `);

    // Add description columns to all entities
    await queryRunner.query(`
      ALTER TABLE "clients"
      ADD COLUMN "description" VARCHAR(500)
    `);

    await queryRunner.query(`
      ALTER TABLE "clients"
      ADD COLUMN "institution" VARCHAR(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      ADD COLUMN "description" VARCHAR(500)
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_users"
      ADD COLUMN "description" VARCHAR(500)
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "description" VARCHAR(500)
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "description" VARCHAR(500)
    `);

    // Add is_active columns where missing
    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      ADD COLUMN "is_active" BOOLEAN DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_users"
      ADD COLUMN "is_active" BOOLEAN DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities"
      ADD COLUMN "is_active" BOOLEAN DEFAULT true
    `);

    // Add deleted_at columns for soft delete
    await queryRunner.query(`
      ALTER TABLE "clients"
      ADD COLUMN "deleted_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      ADD COLUMN "deleted_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_users"
      ADD COLUMN "deleted_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities"
      ADD COLUMN "deleted_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "deleted_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "deleted_at" TIMESTAMP
    `);

    // Fix column naming to snake_case
    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      RENAME COLUMN "totalPrice" TO "total_price"
    `);

    // Add table comments
    await queryRunner.query(`
      COMMENT ON TABLE "clients" IS 'Stores clients and their metadata'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "functionalities_clients" IS 'Stores service orders and client-functionality relationships'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "functionalities_users" IS 'Stores user assignments to functionalities and their payment details'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "functionalities" IS 'Stores available functionalities/services offered by tenants'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "users" IS 'Stores system users and their roles within tenants'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "tenants" IS 'Stores tenant organizations and their subscription details'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove table comments
    await queryRunner.query(`
      COMMENT ON TABLE "tenants" IS NULL
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "users" IS NULL
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "functionalities" IS NULL
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "functionalities_users" IS NULL
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "functionalities_clients" IS NULL
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "clients" IS NULL
    `);

    // Remove explicit tenant_id columns
    await queryRunner.query(`
      ALTER TABLE "clients"
      DROP COLUMN "tenant_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "tenant_id"
    `);

    // Revert column naming
    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      RENAME COLUMN "total_price" TO "totalPrice"
    `);

    // Remove deleted_at columns
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN "deleted_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "deleted_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities"
      DROP COLUMN "deleted_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_users"
      DROP COLUMN "deleted_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      DROP COLUMN "deleted_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "clients"
      DROP COLUMN "deleted_at"
    `);

    // Remove is_active columns
    await queryRunner.query(`
      ALTER TABLE "functionalities"
      DROP COLUMN "is_active"
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_users"
      DROP COLUMN "is_active"
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      DROP COLUMN "is_active"
    `);

    // Remove description columns
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN "description"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "description"
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_users"
      DROP COLUMN "description"
    `);

    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      DROP COLUMN "description"
    `);

    await queryRunner.query(`
      ALTER TABLE "clients"
      DROP COLUMN "institution"
    `);

    await queryRunner.query(`
      ALTER TABLE "clients"
      DROP COLUMN "description"
    `);

    // Remove order_number column
    await queryRunner.query(`
      ALTER TABLE "functionalities_users"
      DROP COLUMN "functionality_client_id"
    `);

    // Remove order_number column
    await queryRunner.query(`
      ALTER TABLE "functionalities_users"
      DROP COLUMN "order_number"
    `);

    // Remove order_number column
    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      DROP COLUMN "order_description"
    `);

    // Remove order_number column
    await queryRunner.query(`
      ALTER TABLE "functionalities_clients"
      DROP COLUMN "order_number"
    `);
  }
}
