import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSellerSubscriptions20260331110000
  implements MigrationInterface
{
  name = 'RemoveSellerSubscriptions20260331110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "seller_subscriptions" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "subscription_tiers" CASCADE`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."seller_subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."subscription_tiers_name_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_tiers_name_enum" AS ENUM('free', 'basic', 'pro', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_tiers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" "public"."subscription_tiers_name_enum" NOT NULL, "displayName" character varying(200) NOT NULL, "description" text, "monthly_price" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL, "features" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "paystack_plan_code" character varying(100), CONSTRAINT "UQ_f5bb908755354652f05d96a7f2f" UNIQUE ("name"), CONSTRAINT "PK_376aa3503bf3278d69af3d711b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_tiers_paystack_plan_code" ON "subscription_tiers" ("paystack_plan_code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seller_subscriptions_status_enum" AS ENUM('pending', 'active', 'expired', 'cancelled', 'trial')`,
    );
    await queryRunner.query(
      `CREATE TABLE "seller_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_profile_id" uuid NOT NULL, "tier_id" uuid NOT NULL, "status" "public"."seller_subscriptions_status_enum" NOT NULL DEFAULT 'trial', "starts_at" TIMESTAMP NOT NULL, "ends_at" TIMESTAMP, "paystack_subscription_code" character varying, "last_billed_at" TIMESTAMP, "billed_amount_ngn" numeric(10,2), "cancelled_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "paystack_plan_code" character varying(100), "paystack_customer_code" character varying(100), "paystack_email_token" character varying(100), "checkout_reference" character varying(100), "checkout_authorization_url" character varying, "idempotency_key" character varying(200), "latest_charge_reference" character varying(100), "last_invoice_code" character varying(100), CONSTRAINT "PK_c993bcf8d50b0082d90a55407e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_subscriptions_checkout_reference" ON "seller_subscriptions" ("checkout_reference") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_seller_subscriptions_paystack_subscription_code" ON "seller_subscriptions" ("paystack_subscription_code") `,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "FK_88a7214754ff4ff60ba7994f396" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "FK_5f45869c226ed8cd295d952605d" FOREIGN KEY ("tier_id") REFERENCES "subscription_tiers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
