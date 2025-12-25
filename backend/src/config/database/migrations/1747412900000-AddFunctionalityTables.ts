import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFunctionalityTables1747412900000 implements MigrationInterface {
  name = 'AddFunctionalityTables1747412900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for functionality status
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."functionalities_status_enum" AS ENUM('ACTIVE', 'INACTIVE');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    );

    // Create enum for functionality client payment status
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."functionalities_clients_status_enum" AS ENUM('PENDING', 'PAID', 'OVERDUE');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    );

    // Create functionalities table
    await queryRunner.query(
      `CREATE TABLE "functionalities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "minimum_price" numeric(10,2) NOT NULL, "default_assistant_price" numeric(10,2), "status" "public"."functionalities_status_enum" NOT NULL DEFAULT 'ACTIVE', "responsible_user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b4e7dc4e3d4c2a1c4c7f42b5d24" PRIMARY KEY ("id"))`,
    );

    // Create unique index on tenant_id and name for functionalities
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_functionalities_tenant_name" ON "functionalities" ("tenant_id", "name")`,
    );

    // Create functionalities_users table
    await queryRunner.query(
      `CREATE TABLE "functionalities_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "functionality_id" uuid NOT NULL, "user_id" uuid NOT NULL, "assistant_deadline" date NOT NULL, "amount" numeric(10,2) NOT NULL, "paid_at" date, "is_delivered" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_functionalities_users_id" PRIMARY KEY ("id"))`,
    );

    // Create functionalities_clients table
    await queryRunner.query(
      `CREATE TABLE "functionalities_clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "functionality_id" uuid NOT NULL, "client_id" uuid NOT NULL, "client_deadline" date NOT NULL, "total_price" numeric(10,2) NOT NULL, "payment_method" character varying(50) NOT NULL, "status" "public"."functionalities_clients_status_enum" NOT NULL DEFAULT 'PENDING', "paid_at" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_functionalities_clients_id" PRIMARY KEY ("id"))`,
    );

    // Add foreign key constraints for functionalities table
    await queryRunner.query(
      `ALTER TABLE "functionalities" ADD CONSTRAINT "FK_functionalities_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Add foreign key constraints for functionalities_users table
    await queryRunner.query(
      `ALTER TABLE "functionalities_users" ADD CONSTRAINT "FK_functionalities_users_functionality" FOREIGN KEY ("functionality_id") REFERENCES "functionalities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "functionalities_users" ADD CONSTRAINT "FK_functionalities_users_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Add foreign key constraints for functionalities_clients table
    await queryRunner.query(
      `ALTER TABLE "functionalities_clients" ADD CONSTRAINT "FK_functionalities_clients_functionality" FOREIGN KEY ("functionality_id") REFERENCES "functionalities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "functionalities_clients" ADD CONSTRAINT "FK_functionalities_clients_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints for functionalities_clients
    await queryRunner.query(
      `ALTER TABLE "functionalities_clients" DROP CONSTRAINT "FK_functionalities_clients_client"`,
    );
    await queryRunner.query(
      `ALTER TABLE "functionalities_clients" DROP CONSTRAINT "FK_functionalities_clients_functionality"`,
    );

    // Drop foreign key constraints for functionalities_users
    await queryRunner.query(
      `ALTER TABLE "functionalities_users" DROP CONSTRAINT "FK_functionalities_users_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "functionalities_users" DROP CONSTRAINT "FK_functionalities_users_functionality"`,
    );

    // Drop foreign key constraints for functionalities
    await queryRunner.query(
      `ALTER TABLE "functionalities" DROP CONSTRAINT "FK_functionalities_tenant"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "functionalities_clients"`);
    await queryRunner.query(`DROP TABLE "functionalities_users"`);
    await queryRunner.query(`DROP INDEX "IDX_functionalities_tenant_name"`);
    await queryRunner.query(`DROP TABLE "functionalities"`);

    // Drop enums (guarded to avoid errors if already dropped or replaced by later migrations)
    await queryRunner.query(
      `DO $$ BEGIN
         DROP TYPE IF EXISTS "public"."functionalities_clients_status_enum";
       EXCEPTION WHEN undefined_object THEN NULL; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         DROP TYPE IF EXISTS "public"."functionalities_status_enum";
       EXCEPTION WHEN undefined_object THEN NULL; END $$;`,
    );
  }
}
