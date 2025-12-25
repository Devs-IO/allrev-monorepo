import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsActiveToUserTenants1751300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_tenants',
      new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: true,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_tenants', 'is_active');
  }
}
