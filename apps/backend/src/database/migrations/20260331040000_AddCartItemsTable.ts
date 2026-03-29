import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCartItemsTable20260331040000 implements MigrationInterface {
  name = 'AddCartItemsTable20260331040000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cart_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyer_id" uuid NOT NULL, "seller_profile_id" uuid NOT NULL, "product_id" uuid NOT NULL, "variant_id" uuid, "quantity" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cart_items_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_items_buyer_id" ON "cart_items" ("buyer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_items_buyer_seller" ON "cart_items" ("buyer_id", "seller_profile_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_items_product_variant" ON "cart_items" ("product_id", "variant_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_buyer_id" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_seller_profile_id" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_variant_id" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_variant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_seller_profile_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_buyer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cart_items_product_variant"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cart_items_buyer_seller"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_cart_items_buyer_id"`);
    await queryRunner.query(`DROP TABLE "cart_items"`);
  }
}
