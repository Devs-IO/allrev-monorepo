import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAdminUser1700000099004 implements MigrationInterface {
  name = 'SeedAdminUser1700000099004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenantId = '88576f42-0fd1-4bf5-adee-a94f4a43fdc9';

    // Insert tenant if not exists
    await queryRunner.query(
      `
      INSERT INTO tenants (
        id,
        code,
        company_name,
        phone,
        address,
        payment_status,
        payment_method,
        payment_frequency,
        payment_due_date,
        is_active,
        logo,
        created_at,
        updated_at
      ) VALUES (
        $1::uuid,
        'ALL-7687',
        'AllRev',
        '31994298913',
        'Lavras',
        'paid'::tenant_payment_status,
        'pix'::tenant_payment_method,
        'annual'::tenant_payment_frequency,
        '2099-01-01 00:00:00.000',
        true,
        NULL,
        now(),
        now()
      )
      ON CONFLICT (id) DO NOTHING
    `,
      [tenantId],
    );

    // Insert admin user if not exists
    await queryRunner.query(
      `
      INSERT INTO users (
        id,
        name,
        email,
        phone,
        address,
        password,
        is_active,
        refresh_token,
        photo,
        created_at,
        updated_at
      ) VALUES (
        $1::uuid,
        'AllRev',
        'allrev@gmail.com',
        '31994298913',
        'Lavras-MG',
        '$2b$10$bBQOu/17KyOTJx7q0NWJd.4RWI3yUOfDvfuBGUlOwbFHw5pZDeXWq',
        true,
        '$2b$10$gTHH0Tr7Ce6/dzK1wWEcHekQQCVK8z5Sqm/fdJTA/8tNj4q65aLgC',
        '',
        now(),
        now()
      )
      ON CONFLICT (email) DO NOTHING
    `,
      ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    );

    // Create relationship between user and tenant
    await queryRunner.query(
      `
      INSERT INTO user_tenants (
        "userId",
        "tenantId",
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
        $1::uuid,
        'admin'::user_role_enum,
        true,
        now(),
        now()
      )
      ON CONFLICT ("userId", "tenantId") DO NOTHING
    `,
      [tenantId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete user_tenant relationship
    await queryRunner.query(`
      DELETE FROM user_tenants 
      WHERE "userId" = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
    `);

    // Delete admin user
    await queryRunner.query(`
      DELETE FROM users 
      WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
    `);

    // Delete tenant
    await queryRunner.query(`
      DELETE FROM tenants 
      WHERE id = '88576f42-0fd1-4bf5-adee-a94f4a43fdc9'::uuid
    `);
  }
}
