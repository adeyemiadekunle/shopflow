import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendSellerKycAndBankAccountFields20260329000000 implements MigrationInterface {
  name = 'ExtendSellerKycAndBankAccountFields20260329000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seller_kycs" RENAME COLUMN "address" TO "address_line_1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_kycs" ADD "address_line_2" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_kycs" ADD "postcode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_kycs" ADD "country" character varying(2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ALTER COLUMN "bank_code" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ALTER COLUMN "bank_code" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "seller_kycs" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "seller_kycs" DROP COLUMN "postcode"`);
    await queryRunner.query(
      `ALTER TABLE "seller_kycs" DROP COLUMN "address_line_2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_kycs" RENAME COLUMN "address_line_1" TO "address"`,
    );
  }
}
