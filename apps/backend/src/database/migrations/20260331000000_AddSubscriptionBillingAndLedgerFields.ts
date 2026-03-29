import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionBillingAndLedgerFields20260331000000
  implements MigrationInterface
{
  name = 'AddSubscriptionBillingAndLedgerFields20260331000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."seller_subscriptions_status_enum" RENAME TO "seller_subscriptions_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seller_subscriptions_status_enum" AS ENUM('pending', 'active', 'expired', 'cancelled', 'trial')`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ALTER COLUMN "status" TYPE "public"."seller_subscriptions_status_enum" USING "status"::text::"public"."seller_subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ALTER COLUMN "status" SET DEFAULT 'trial'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."seller_subscriptions_status_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."ledger_entries_eventtype_enum" RENAME TO "ledger_entries_eventtype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_entries_eventtype_enum" AS ENUM('payment_collected', 'payment_verified', 'fee_accrued', 'subscription_billed', 'seller_pending_allocated', 'delivery_confirmed', 'hold_released', 'refund_initiated', 'refund_completed', 'payout_requested', 'payout_approved', 'payout_sent', 'payout_reversed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ALTER COLUMN "eventType" TYPE "public"."ledger_entries_eventtype_enum" USING "eventType"::text::"public"."ledger_entries_eventtype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ledger_entries_eventtype_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TABLE "subscription_tiers" ADD "paystack_plan_code" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD "paystack_plan_code" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD "paystack_customer_code" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD "paystack_email_token" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD "checkout_reference" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD "checkout_authorization_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD "idempotency_key" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD "latest_charge_reference" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD "last_invoice_code" character varying(100)`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_tiers_paystack_plan_code" ON "subscription_tiers" ("paystack_plan_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_subscriptions_checkout_reference" ON "seller_subscriptions" ("checkout_reference") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_subscriptions_paystack_subscription_code" ON "seller_subscriptions" ("paystack_subscription_code") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_seller_subscriptions_paystack_subscription_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_seller_subscriptions_checkout_reference"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_tiers_paystack_plan_code"`,
    );

    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" DROP COLUMN "last_invoice_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" DROP COLUMN "latest_charge_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" DROP COLUMN "idempotency_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" DROP COLUMN "checkout_authorization_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" DROP COLUMN "checkout_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" DROP COLUMN "paystack_email_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" DROP COLUMN "paystack_customer_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" DROP COLUMN "paystack_plan_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_tiers" DROP COLUMN "paystack_plan_code"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."ledger_entries_eventtype_enum" RENAME TO "ledger_entries_eventtype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_entries_eventtype_enum" AS ENUM('payment_collected', 'payment_verified', 'fee_accrued', 'seller_pending_allocated', 'delivery_confirmed', 'hold_released', 'refund_initiated', 'refund_completed', 'payout_requested', 'payout_approved', 'payout_sent', 'payout_reversed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ALTER COLUMN "eventType" TYPE "public"."ledger_entries_eventtype_enum" USING "eventType"::text::"public"."ledger_entries_eventtype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ledger_entries_eventtype_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."seller_subscriptions_status_enum" RENAME TO "seller_subscriptions_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seller_subscriptions_status_enum" AS ENUM('active', 'expired', 'cancelled', 'trial')`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ALTER COLUMN "status" TYPE "public"."seller_subscriptions_status_enum" USING (CASE WHEN "status"::text = 'pending' THEN 'trial' ELSE "status"::text END)::"public"."seller_subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ALTER COLUMN "status" SET DEFAULT 'trial'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."seller_subscriptions_status_enum_old"`,
    );
  }
}
