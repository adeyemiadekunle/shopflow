import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductMediaMetadata20260331130000
  implements MigrationInterface
{
  name = 'AddProductMediaMetadata20260331130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_media" ADD "thumbnail_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" ADD "width" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" ADD "height" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" ADD "duration_seconds" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" ADD "size_bytes" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_media" DROP COLUMN "size_bytes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" DROP COLUMN "duration_seconds"`,
    );
    await queryRunner.query(`ALTER TABLE "product_media" DROP COLUMN "height"`);
    await queryRunner.query(`ALTER TABLE "product_media" DROP COLUMN "width"`);
    await queryRunner.query(
      `ALTER TABLE "product_media" DROP COLUMN "thumbnail_url"`,
    );
  }
}
