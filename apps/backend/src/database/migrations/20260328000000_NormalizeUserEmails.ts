import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeUserEmails20260328000000 implements MigrationInterface {
  name = 'NormalizeUserEmails20260328000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "email" = LOWER(TRIM("email")) WHERE "email" <> LOWER(TRIM("email"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be3"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email_unique_lower" ON "users" (LOWER("email"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_users_email_unique_lower"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`,
    );
  }
}
