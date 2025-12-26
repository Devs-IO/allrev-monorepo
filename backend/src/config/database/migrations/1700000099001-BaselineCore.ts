import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineCore1700000099001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===== EXTENSIONS =====
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ===== ENUMS =====
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_payment_frequency') THEN
          CREATE TYPE tenant_payment_frequency AS ENUM ('monthly', 'annual');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_payment_method') THEN
          CREATE TYPE tenant_payment_method AS ENUM ('credit_card', 'debit_card', 'bank_transfer', 'pix', 'boleto', 'cash', 'other');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_payment_status') THEN
          CREATE TYPE tenant_payment_status AS ENUM ('paid', 'unpaid', 'overdue', 'pending');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE user_role_enum AS ENUM ('admin', 'manager_reviewers', 'assistant_reviewers', 'clients', 'user', 'none');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_legal_nature') THEN
          CREATE TYPE client_legal_nature AS ENUM ('PERSON_PHYSICAL', 'PERSON_LEGAL');
        END IF;
      END $$;
    `);

    // ===== TABELA: tenants =====
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "code" varchar NOT NULL UNIQUE,
        "company_name" varchar NOT NULL,
        "address" varchar NOT NULL,
        "phone" varchar NOT NULL UNIQUE,
        "payment_status" tenant_payment_status NOT NULL DEFAULT 'unpaid',
        "payment_method" tenant_payment_method NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "payment_frequency" tenant_payment_frequency NOT NULL DEFAULT 'monthly',
        "payment_due_date" date NOT NULL,
        "logo" varchar NULL,
        "description" varchar(500) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      );
    `);

    // ===== TABELA: users =====
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "photo" varchar NULL,
        "name" varchar NOT NULL,
        "email" varchar NOT NULL UNIQUE,
        "phone" varchar NOT NULL UNIQUE,
        "address" varchar NOT NULL,
        "password" varchar NOT NULL,
        "must_change_password" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "refresh_token" varchar NULL,
        "description" varchar(500) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      );
    `);

    // ===== TABELA: user_tenants =====
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_tenants" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "userId" uuid NOT NULL,
        "tenantId" uuid NOT NULL,
        "role" user_role_enum NOT NULL,
        "observation" text NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "FK_user_tenants_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_tenants_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_user_tenants_user_tenant" UNIQUE ("userId", "tenantId")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_tenants_userId" ON "user_tenants"("userId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_tenants_tenantId" ON "user_tenants"("tenantId");
    `);

    // ===== TABELA: clients =====
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "tenant_id" uuid NOT NULL,
        "name" varchar(50) NOT NULL,
        "password" varchar NULL,
        "last_login" timestamptz NULL,
        "email" varchar NOT NULL,
        "course" varchar NULL,
        "university" varchar NULL,
        "institution" varchar NULL,
        "phone" varchar NULL,
        "observation" text NULL,
        "note" text NULL,
        "description" varchar(500) NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "legal_nature" client_legal_nature NULL,
        "cpf" varchar(11) NULL,
        "cnpj" varchar(14) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "FK_clients_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_clients_tenant_email" ON "clients"("tenant_id", "email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "clients" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_tenants" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants" CASCADE;`);

    await queryRunner.query(`DROP TYPE IF EXISTS client_legal_nature;`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS tenant_payment_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS tenant_payment_method;`);
    await queryRunner.query(`DROP TYPE IF EXISTS tenant_payment_frequency;`);
  }
}
