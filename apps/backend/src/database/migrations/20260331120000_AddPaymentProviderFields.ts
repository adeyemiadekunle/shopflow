import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentProviderFields20260331120000
  implements MigrationInterface
{
  name = 'AddPaymentProviderFields20260331120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."payment_provider_enum" AS ENUM('paystack', 'monnify')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_intents" ADD "provider" "public"."payment_provider_enum" NOT NULL DEFAULT 'paystack'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_intents" ADD "provider_payment_reference" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD "provider" "public"."payment_provider_enum" NOT NULL DEFAULT 'paystack'`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD "provider_refund_reference" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD "provider_refund_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD "provider" "public"."payment_provider_enum" NOT NULL DEFAULT 'paystack'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD "provider_transfer_reference" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD "provider_transfer_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD "provider_batch_reference" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD "provider_recipient_reference" character varying`,
    );
    await queryRunner.query(
      `UPDATE "refunds" SET "provider_refund_id" = "paystack_refund_id" WHERE "paystack_refund_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "payouts" SET "provider_transfer_reference" = "paystack_transfer_code", "provider_transfer_id" = "paystack_transfer_id", "provider_recipient_reference" = "paystack_recipient_code"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP COLUMN "provider_recipient_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP COLUMN "provider_batch_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP COLUMN "provider_transfer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP COLUMN "provider_transfer_reference"`,
    );
    await queryRunner.query(`ALTER TABLE "payouts" DROP COLUMN "provider"`);
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP COLUMN "provider_refund_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP COLUMN "provider_refund_reference"`,
    );
    await queryRunner.query(`ALTER TABLE "refunds" DROP COLUMN "provider"`);
    await queryRunner.query(
      `ALTER TABLE "payment_intents" DROP COLUMN "provider_payment_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_intents" DROP COLUMN "provider"`,
    );
    await queryRunner.query(`DROP TYPE "public"."payment_provider_enum"`);
  }
}
