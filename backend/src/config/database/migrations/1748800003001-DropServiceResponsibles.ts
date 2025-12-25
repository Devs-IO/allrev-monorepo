import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropServiceResponsibles1748800003001 implements MigrationInterface {
  name = 'DropServiceResponsibles1748800003001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "service_responsibles"');
  }

  public async down(): Promise<void> {
    // no-op
  }
}
