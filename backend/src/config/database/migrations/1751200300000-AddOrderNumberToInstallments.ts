import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderNumberToInstallments1751200300000 implements MigrationInterface {
  name = 'AddOrderNumberToInstallments1751200300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adiciona a coluna (nullable inicialmente para não quebrar dados existentes)
    await queryRunner.query(
      `ALTER TABLE "order_installments" ADD "order_number" character varying(50)`,
    );

    // 2. Cria um índice para busca rápida (Esse é o pulo do gato para performance)
    await queryRunner.query(
      `CREATE INDEX "IDX_order_installments_order_number" ON "order_installments" ("order_number")`,
    );

    // 3. (Opcional) Script para preencher os dados antigos baseados na tabela pai
    // Isso garante que a busca funcione para ordens antigas também.
    await queryRunner.query(`
            UPDATE "order_installments"
            SET "order_number" = "orders"."order_number"
            FROM "orders"
            WHERE "order_installments"."order_id" = "orders"."id"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_order_installments_order_number"`);
    await queryRunner.query(`ALTER TABLE "order_installments" DROP COLUMN "order_number"`);
  }
}
