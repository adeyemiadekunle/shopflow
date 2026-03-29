import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBuyerAddressesAndBillingAddress20260331050000
  implements MigrationInterface
{
  name = 'AddBuyerAddressesAndBillingAddress20260331050000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "billing_address" jsonb`,
    );
    await queryRunner.query(
      `CREATE TABLE "buyer_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyer_id" uuid NOT NULL, "label" character varying(120) NOT NULL, "address_line_1" character varying(200) NOT NULL, "address_line_2" character varying(200), "state" character varying(120) NOT NULL, "lga" character varying(120) NOT NULL, "postcode" character varying(20), "country" character varying(2) NOT NULL, "recipient_name" character varying(200), "recipient_phone" character varying(20), "use_for_delivery" boolean NOT NULL DEFAULT true, "use_for_billing" boolean NOT NULL DEFAULT false, "is_default_delivery" boolean NOT NULL DEFAULT false, "is_default_billing" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_buyer_addresses_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_buyer_addresses_buyer_id" ON "buyer_addresses" ("buyer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_buyer_addresses_defaults" ON "buyer_addresses" ("buyer_id", "is_default_delivery", "is_default_billing") `,
    );
    await queryRunner.query(
      `ALTER TABLE "buyer_addresses" ADD CONSTRAINT "FK_buyer_addresses_buyer_id" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "buyer_addresses" DROP CONSTRAINT "FK_buyer_addresses_buyer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_buyer_addresses_defaults"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_buyer_addresses_buyer_id"`,
    );
    await queryRunner.query(`DROP TABLE "buyer_addresses"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "billing_address"`);
  }
}
