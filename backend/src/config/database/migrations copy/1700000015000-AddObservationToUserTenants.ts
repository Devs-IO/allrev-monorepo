import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddObservationToUserTenants1700000015000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('user_tenants');

    if (tableExists) {
      const hasObservation = await queryRunner.hasColumn('user_tenants', 'observation');
      if (!hasObservation) {
        await queryRunner.addColumn(
          'user_tenants',
          new TableColumn({
            name: 'observation',
            type: 'text',
            isNullable: true,
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('user_tenants');

    if (tableExists) {
      await queryRunner.dropColumn('user_tenants', 'observation');
    }
  }
}
