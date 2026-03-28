import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentReconciliationTables20260330000000
  implements MigrationInterface
{
  name = 'AddPaymentReconciliationTables20260330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."payment_reconciliation_runs_trigger_enum" AS ENUM('scheduled', 'manual')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_reconciliation_runs_status_enum" AS ENUM('started', 'completed', 'completed_with_issues', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_reconciliation_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "trigger" "public"."payment_reconciliation_runs_trigger_enum" NOT NULL, "status" "public"."payment_reconciliation_runs_status_enum" NOT NULL DEFAULT 'started', "started_at" TIMESTAMP NOT NULL, "completed_at" TIMESTAMP, "scanned_count" integer NOT NULL DEFAULT '0', "verified_count" integer NOT NULL DEFAULT '0', "repaired_count" integer NOT NULL DEFAULT '0', "issue_count" integer NOT NULL DEFAULT '0', "initiated_by_user_id" character varying, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_payment_reconciliation_runs_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_reconciliation_issues_type_enum" AS ENUM('stale_processing_intent', 'succeeded_order_not_paid', 'failed_order_marked_paid', 'payment_intent_order_missing', 'verify_attempt_failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_reconciliation_issues_severity_enum" AS ENUM('warning', 'error')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_reconciliation_issues_status_enum" AS ENUM('open', 'resolved')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_reconciliation_issues" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "run_id" uuid NOT NULL, "payment_intent_id" uuid, "order_id" uuid, "paystack_reference" character varying(100), "type" "public"."payment_reconciliation_issues_type_enum" NOT NULL, "severity" "public"."payment_reconciliation_issues_severity_enum" NOT NULL, "status" "public"."payment_reconciliation_issues_status_enum" NOT NULL DEFAULT 'open', "description" text NOT NULL, "details" jsonb, "resolved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_payment_reconciliation_issues_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_reconciliation_runs_created_at" ON "payment_reconciliation_runs" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_reconciliation_issues_created_at" ON "payment_reconciliation_issues" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_reconciliation_issues_lookup" ON "payment_reconciliation_issues" ("type", "status", "payment_intent_id", "order_id", "paystack_reference") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_reconciliation_issues" ADD CONSTRAINT "FK_payment_reconciliation_issues_run_id" FOREIGN KEY ("run_id") REFERENCES "payment_reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_reconciliation_issues" ADD CONSTRAINT "FK_payment_reconciliation_issues_payment_intent_id" FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_reconciliation_issues" ADD CONSTRAINT "FK_payment_reconciliation_issues_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_reconciliation_issues" DROP CONSTRAINT "FK_payment_reconciliation_issues_order_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_reconciliation_issues" DROP CONSTRAINT "FK_payment_reconciliation_issues_payment_intent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_reconciliation_issues" DROP CONSTRAINT "FK_payment_reconciliation_issues_run_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payment_reconciliation_issues_lookup"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payment_reconciliation_issues_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payment_reconciliation_runs_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "payment_reconciliation_issues"`);
    await queryRunner.query(
      `DROP TYPE "public"."payment_reconciliation_issues_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payment_reconciliation_issues_severity_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payment_reconciliation_issues_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "payment_reconciliation_runs"`);
    await queryRunner.query(
      `DROP TYPE "public"."payment_reconciliation_runs_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payment_reconciliation_runs_trigger_enum"`,
    );
  }
}
