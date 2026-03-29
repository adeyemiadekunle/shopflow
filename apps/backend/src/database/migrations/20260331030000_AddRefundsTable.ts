import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefundsTable20260331030000 implements MigrationInterface {
  name = 'AddRefundsTable20260331030000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" RENAME TO "orders_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('draft', 'awaiting_delivery_quote', 'quote_sent', 'quote_accepted', 'quote_declined', 'payment_pending', 'paid', 'seller_preparing', 'shipped', 'delivered_pending_confirmation', 'completed', 'dispute_open', 'refund_pending', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum" USING "status"::text::"public"."orders_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'draft'`,
    );
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum_old"`);

    await queryRunner.query(
      `CREATE TYPE "public"."refunds_status_enum" AS ENUM('pending', 'processing', 'needs_attention', 'processed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "refunds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "payment_intent_id" uuid NOT NULL, "transaction_reference" character varying(100) NOT NULL, "paystack_refund_id" character varying, "amount" numeric(12,2) NOT NULL, "currency" character varying(3) NOT NULL, "status" "public"."refunds_status_enum" NOT NULL DEFAULT 'pending', "reason" text, "customer_note" text, "merchant_note" text, "initiated_by_id" character varying NOT NULL, "customer_bank_id" character varying, "customer_account_number" character varying, "customer_account_currency" character varying(3), "customer_account_name" character varying, "processed_at" TIMESTAMP, "failed_at" TIMESTAMP, "raw_payload" jsonb, "failure_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_refunds_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refunds_status_created_at" ON "refunds" ("status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refunds_order_id" ON "refunds" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refunds_payment_intent_id" ON "refunds" ("payment_intent_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_refunds_paystack_refund_id_unique" ON "refunds" ("paystack_refund_id") WHERE "paystack_refund_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_refunds_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_refunds_payment_intent_id" FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_refunds_payment_intent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_refunds_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refunds_paystack_refund_id_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refunds_payment_intent_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_refunds_order_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refunds_status_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "refunds"`);
    await queryRunner.query(`DROP TYPE "public"."refunds_status_enum"`);

    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" RENAME TO "orders_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('draft', 'awaiting_delivery_quote', 'quote_sent', 'quote_accepted', 'quote_declined', 'payment_pending', 'paid', 'seller_preparing', 'shipped', 'delivered_pending_confirmation', 'completed', 'dispute_open', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum" USING (CASE WHEN "status"::text = 'refund_pending' THEN 'refunded' ELSE "status"::text END)::"public"."orders_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'draft'`,
    );
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum_old"`);
  }
}
