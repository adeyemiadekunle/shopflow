import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayoutsTable20260331020000 implements MigrationInterface {
  name = 'AddPayoutsTable20260331020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."payouts_status_enum" AS ENUM('requested', 'approved', 'processing', 'succeeded', 'failed', 'reversed', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_profile_id" uuid NOT NULL, "bank_account_id" uuid NOT NULL, "reference" character varying(100) NOT NULL, "amount" numeric(12,2) NOT NULL, "currency" character varying(3) NOT NULL, "status" "public"."payouts_status_enum" NOT NULL DEFAULT 'requested', "reason" text, "requested_by_id" character varying NOT NULL, "approved_by_id" character varying, "approved_at" TIMESTAMP, "processed_at" TIMESTAMP, "failed_at" TIMESTAMP, "reversed_at" TIMESTAMP, "paystack_transfer_code" character varying, "paystack_transfer_id" character varying, "paystack_recipient_code" character varying, "raw_transfer_payload" jsonb, "failure_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_payouts_reference" UNIQUE ("reference"), CONSTRAINT "PK_payouts_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payouts_status_created_at" ON "payouts" ("status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payouts_seller_profile_id" ON "payouts" ("seller_profile_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD CONSTRAINT "FK_payouts_seller_profile_id" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD CONSTRAINT "FK_payouts_bank_account_id" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP CONSTRAINT "FK_payouts_bank_account_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP CONSTRAINT "FK_payouts_seller_profile_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payouts_seller_profile_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payouts_status_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "payouts"`);
    await queryRunner.query(`DROP TYPE "public"."payouts_status_enum"`);
  }
}
