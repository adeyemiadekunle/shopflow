import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderSettlementHoldFields20260331010000
  implements MigrationInterface
{
  name = 'AddOrderSettlementHoldFields20260331010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."fulfilment_events_type_enum" RENAME TO "fulfilment_events_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fulfilment_events_type_enum" AS ENUM('order_created', 'quote_sent', 'quote_accepted', 'quote_declined', 'payment_received', 'preparing', 'shipped', 'delivered', 'buyer_confirmed', 'dispute_opened', 'dispute_resolved', 'funds_released', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "fulfilment_events" ALTER COLUMN "type" TYPE "public"."fulfilment_events_type_enum" USING "type"::text::"public"."fulfilment_events_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."fulfilment_events_type_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TABLE "orders" ADD "delivered_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "buyer_confirmed_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "funds_held_until" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "funds_released_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "funds_released_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "funds_held_until"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "buyer_confirmed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "delivered_at"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."fulfilment_events_type_enum" RENAME TO "fulfilment_events_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fulfilment_events_type_enum" AS ENUM('order_created', 'quote_sent', 'quote_accepted', 'quote_declined', 'payment_received', 'preparing', 'shipped', 'delivered', 'buyer_confirmed', 'dispute_opened', 'dispute_resolved', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "fulfilment_events" ALTER COLUMN "type" TYPE "public"."fulfilment_events_type_enum" USING (CASE WHEN "type"::text = 'funds_released' THEN 'delivered' ELSE "type"::text END)::"public"."fulfilment_events_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."fulfilment_events_type_enum_old"`,
    );
  }
}
