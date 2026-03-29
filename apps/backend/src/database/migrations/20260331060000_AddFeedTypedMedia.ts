import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeedTypedMedia20260331060000 implements MigrationInterface {
  name = 'AddFeedTypedMedia20260331060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feed_posts" ADD "media" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feed_posts" DROP COLUMN "media"`);
  }
}
