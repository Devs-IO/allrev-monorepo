import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTimestampsToUserTenants1748800005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('user_tenants');

    if (tableExists) {
      // Add created_at column
      const hasCreatedAt = await queryRunner.hasColumn('user_tenants', 'created_at');
      if (!hasCreatedAt) {
        await queryRunner.addColumn(
          'user_tenants',
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          }),
        );
      }

      // Add updated_at column
      const hasUpdatedAt = await queryRunner.hasColumn('user_tenants', 'updated_at');
      if (!hasUpdatedAt) {
        await queryRunner.addColumn(
          'user_tenants',
          new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          }),
        );
      }

      // Add deleted_at column
      const hasDeletedAt = await queryRunner.hasColumn('user_tenants', 'deleted_at');
      if (!hasDeletedAt) {
        await queryRunner.addColumn(
          'user_tenants',
          new TableColumn({
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('user_tenants');

    if (tableExists) {
      // Drop columns in reverse order
      await queryRunner.dropColumn('user_tenants', 'deleted_at');
      await queryRunner.dropColumn('user_tenants', 'updated_at');
      await queryRunner.dropColumn('user_tenants', 'created_at');
    }
  }
}
