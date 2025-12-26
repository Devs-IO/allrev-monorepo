import { MigrationInterface, QueryRunner } from 'typeorm';

export class FkRestricts1700000008000 implements MigrationInterface {
  name = 'FkRestricts1700000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change FKs to RESTRICT for orders -> items and items -> responsibilities where applicable
    await queryRunner.query(`
      DO $$
      BEGIN
        -- order_items -> orders
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_items_order'
        ) THEN
          ALTER TABLE order_items DROP CONSTRAINT FK_order_items_order;
          ALTER TABLE order_items ADD CONSTRAINT FK_order_items_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
        END IF;

        -- order_item_responsibilities -> order_items
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_item_responsibilities_item'
        ) THEN
          ALTER TABLE order_item_responsibilities DROP CONSTRAINT FK_order_item_responsibilities_item;
          ALTER TABLE order_item_responsibilities ADD CONSTRAINT FK_order_item_responsibilities_item FOREIGN KEY(order_item_id) REFERENCES order_items(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
        END IF;

        -- order_installments -> orders
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_installments_order'
        ) THEN
          ALTER TABLE order_installments DROP CONSTRAINT FK_order_installments_order;
          ALTER TABLE order_installments ADD CONSTRAINT FK_order_installments_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_items_order'
        ) THEN
          ALTER TABLE order_items DROP CONSTRAINT FK_order_items_order;
          ALTER TABLE order_items ADD CONSTRAINT FK_order_items_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_item_responsibilities_item'
        ) THEN
          ALTER TABLE order_item_responsibilities DROP CONSTRAINT FK_order_item_responsibilities_item;
          ALTER TABLE order_item_responsibilities ADD CONSTRAINT FK_order_item_responsibilities_item FOREIGN KEY(order_item_id) REFERENCES order_items(id) ON DELETE CASCADE;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_order_installments_order'
        ) THEN
          ALTER TABLE order_installments DROP CONSTRAINT FK_order_installments_order;
          ALTER TABLE order_installments ADD CONSTRAINT FK_order_installments_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);
  }
}
