import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLegalNatureAndPaymentFields1700000013000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('clients');

    if (tableExists) {
      // Add columns to clients table
      await queryRunner.addColumn(
        'clients',
        new TableColumn({
          name: 'legal_nature',
          type: 'enum',
          enum: ['PERSON_PHYSICAL', 'PERSON_LEGAL'],
          isNullable: true,
        }),
      );

      await queryRunner.addColumn(
        'clients',
        new TableColumn({
          name: 'cpf',
          type: 'varchar',
          length: '11',
          isNullable: true,
        }),
      );

      await queryRunner.addColumn(
        'clients',
        new TableColumn({
          name: 'cnpj',
          type: 'varchar',
          length: '14',
          isNullable: true,
        }),
      );
    }

    // Add columns to orders table
    const ordersTableExists = await queryRunner.hasTable('orders');
    if (ordersTableExists) {
      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'observation',
          type: 'text',
          isNullable: true,
        }),
      );

      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'note',
          type: 'text',
          isNullable: true,
        }),
      );

      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'has_invoice',
          type: 'boolean',
          default: false,
        }),
      );
    }

    // Add columns to order_installments table
    const installmentsTableExists = await queryRunner.hasTable('order_installments');
    if (installmentsTableExists) {
      await queryRunner.addColumn(
        'order_installments',
        new TableColumn({
          name: 'payment_method',
          type: 'enum',
          enum: ['BOLETO', 'CREDIT_CARD', 'PIX', 'OTHER'],
          isNullable: true,
        }),
      );

      await queryRunner.addColumn(
        'order_installments',
        new TableColumn({
          name: 'payment_method_description',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('clients');

    if (tableExists) {
      await queryRunner.dropColumn('clients', 'legal_nature');
      await queryRunner.dropColumn('clients', 'cpf');
      await queryRunner.dropColumn('clients', 'cnpj');
    }

    const ordersTableExists = await queryRunner.hasTable('orders');
    if (ordersTableExists) {
      await queryRunner.dropColumn('orders', 'observation');
      await queryRunner.dropColumn('orders', 'note');
      await queryRunner.dropColumn('orders', 'has_invoice');
    }

    const installmentsTableExists = await queryRunner.hasTable('order_installments');
    if (installmentsTableExists) {
      await queryRunner.dropColumn('order_installments', 'payment_method');
      await queryRunner.dropColumn('order_installments', 'payment_method_description');
    }
  }
}
