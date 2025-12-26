import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordToClients1700000011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adiciona a coluna password
    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        length: '255',
        isNullable: true, // Começa null para não quebrar legados
      }),
    );

    // Adiciona a coluna last_login para auditoria (opcional mas recomendado)
    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'last_login',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('clients', 'last_login');
    await queryRunner.dropColumn('clients', 'password');
  }
}
