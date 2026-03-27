import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20260326000000 implements MigrationInterface {
  name = 'InitialSchema20260326000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."seller_profiles_status_enum" AS ENUM('pending', 'approved', 'rejected', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "seller_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "store_name" character varying(200) NOT NULL, "store_slug" character varying(200) NOT NULL, "bio" text, "logo_url" character varying, "banner_url" character varying, "support_email" character varying, "support_phone" character varying, "status" "public"."seller_profiles_status_enum" NOT NULL DEFAULT 'pending', "kyc_verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f28d3e5e6b0436306e642c01e1b" UNIQUE ("store_slug"), CONSTRAINT "REL_9b0517c80ecf6aadcb9e105c94" UNIQUE ("user_id"), CONSTRAINT "PK_13845670b88adfde01026410969" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('buyer', 'seller', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(320) NOT NULL, "password_hash" character varying NOT NULL, "first_name" character varying(100), "last_name" character varying(100), "phone_number" character varying(20), "role" "public"."users_role_enum" NOT NULL DEFAULT 'buyer', "is_email_verified" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "refresh_token_hash" character varying, "email_verification_token_hash" character varying, "email_verification_token_expires_at" TIMESTAMP, "email_verified_at" TIMESTAMP, "password_reset_token_hash" character varying, "password_reset_token_expires_at" TIMESTAMP, "password_changed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2" UNIQUE ("phone_number"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_tiers_name_enum" AS ENUM('free', 'basic', 'pro', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_tiers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" "public"."subscription_tiers_name_enum" NOT NULL, "displayName" character varying(200) NOT NULL, "description" text, "monthly_price" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL, "features" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f5bb908755354652f05d96a7f2f" UNIQUE ("name"), CONSTRAINT "PK_376aa3503bf3278d69af3d711b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seller_subscriptions_status_enum" AS ENUM('active', 'expired', 'cancelled', 'trial')`,
    );
    await queryRunner.query(
      `CREATE TABLE "seller_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_profile_id" uuid NOT NULL, "tier_id" uuid NOT NULL, "status" "public"."seller_subscriptions_status_enum" NOT NULL DEFAULT 'trial', "starts_at" TIMESTAMP NOT NULL, "ends_at" TIMESTAMP, "paystack_subscription_code" character varying, "last_billed_at" TIMESTAMP, "billed_amount_ngn" numeric(10,2), "cancelled_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c993bcf8d50b0082d90a55407e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "seller_kycs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_profile_id" uuid NOT NULL, "business_name" character varying, "business_type" character varying, "rc_number" character varying, "bvn" character varying, "nin" character varying, "id_document_url" character varying, "address" character varying, "state" character varying, "lga" character varying, "verified_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_8a8bc77f77b90b9d0ea5d5df51" UNIQUE ("seller_profile_id"), CONSTRAINT "PK_56f6791818fa487a20dc60cf640" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bank_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_profile_id" uuid NOT NULL, "bank_code" character varying(10) NOT NULL, "bank_name" character varying(200) NOT NULL, "account_number" character varying(20) NOT NULL, "account_name" character varying(300) NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, "paystack_recipient_code" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c872de764f2038224a013ff25ed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "platform_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying(200) NOT NULL, "value" text NOT NULL, "description" text, "is_public" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ac7f50117691457f252914ca156" UNIQUE ("key"), CONSTRAINT "PK_8f9dc7b98d9e8fcb5eeb292bb95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "webhook_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_type" character varying(100) NOT NULL, "paystack_event_id" character varying, "reference" character varying, "raw_payload" jsonb NOT NULL, "processed" boolean NOT NULL DEFAULT false, "processed_at" TIMESTAMP, "error" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4cba37e6a0acb5e1fc49c34ebfd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(200) NOT NULL, "slug" character varying(200) NOT NULL, "description" text, "parent_id" uuid, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "name" character varying(200) NOT NULL, "sku" character varying(100), "price_override" numeric(12,2), "stock_quantity" integer NOT NULL DEFAULT '0', "attributes" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."product_media_type_enum" AS ENUM('image', 'video')`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "type" "public"."product_media_type_enum" NOT NULL DEFAULT 'image', "url" character varying NOT NULL, "cdn_key" character varying, "display_order" integer NOT NULL DEFAULT '0', "is_primary" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_09d4639de8082a32aa27f3ac9a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_discount_type_enum" AS ENUM('percentage', 'fixed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('draft', 'active', 'archived', 'moderation_hold')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_profile_id" uuid NOT NULL, "category_id" uuid, "title" character varying(300) NOT NULL, "description" text, "base_price" numeric(12,2) NOT NULL, "currency" character varying(3) NOT NULL, "has_discount" boolean NOT NULL DEFAULT false, "discount_type" "public"."products_discount_type_enum", "discount_value" numeric(10,2), "discount_starts_at" TIMESTAMP, "discount_ends_at" TIMESTAMP, "effective_price" numeric(12,2), "weight_grams" integer, "handling_days" integer NOT NULL DEFAULT '1', "tags" text, "status" "public"."products_status_enum" NOT NULL DEFAULT 'draft', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "variant_id" uuid, "product_snapshot" jsonb NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unit_price" numeric(12,2) NOT NULL, "line_total" numeric(12,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."delivery_quotes_status_enum" AS ENUM('pending', 'sent', 'accepted', 'declined')`,
    );
    await queryRunner.query(
      `CREATE TABLE "delivery_quotes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "fee_amount" numeric(12,2) NOT NULL, "seller_note" text, "status" "public"."delivery_quotes_status_enum" NOT NULL DEFAULT 'pending', "responded_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5ed5a14a2537ce2a05a284dc816" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fulfilment_events_type_enum" AS ENUM('order_created', 'quote_sent', 'quote_accepted', 'quote_declined', 'payment_received', 'preparing', 'shipped', 'delivered', 'buyer_confirmed', 'dispute_opened', 'dispute_resolved', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fulfilment_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "type" "public"."fulfilment_events_type_enum" NOT NULL, "actor_id" character varying, "notes" text, "evidence_url" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f2b94fd1ffe24e98e1fad770920" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('draft', 'awaiting_delivery_quote', 'quote_sent', 'quote_accepted', 'quote_declined', 'payment_pending', 'paid', 'seller_preparing', 'shipped', 'delivered_pending_confirmation', 'completed', 'dispute_open', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_reference" character varying(30) NOT NULL, "buyer_id" uuid NOT NULL, "seller_profile_id" uuid NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'draft', "items_total" numeric(12,2) NOT NULL DEFAULT '0', "delivery_fee" numeric(12,2) NOT NULL DEFAULT '0', "platform_fee" numeric(12,2) NOT NULL DEFAULT '0', "total_amount" numeric(12,2) NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL, "delivery_address" jsonb, "buyer_note" text, "paid_at" TIMESTAMP, "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_163a3c044a17987219c85b16fb9" UNIQUE ("order_reference"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_intents_status_enum" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_intents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "buyer_id" uuid NOT NULL, "paystack_reference" character varying(100) NOT NULL, "idempotency_key" character varying(200) NOT NULL, "amount_kobo" bigint NOT NULL, "currency" character varying(3) NOT NULL, "status" "public"."payment_intents_status_enum" NOT NULL DEFAULT 'pending', "authorization_url" character varying, "raw_verify_payload" jsonb, "verified_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b5174877b73fc623c68976f175e" UNIQUE ("paystack_reference"), CONSTRAINT "UQ_7716d4bbdda4edfb0c48811920f" UNIQUE ("idempotency_key"), CONSTRAINT "PK_cc99975b98c8001a336976fd018" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dispute_cases_status_enum" AS ENUM('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "dispute_cases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "raised_by_id" uuid NOT NULL, "reason" text NOT NULL, "evidence_urls" text, "status" "public"."dispute_cases_status_enum" NOT NULL DEFAULT 'open', "resolution_notes" text, "resolved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_09d44c2c7230ad1315c8be5a5d1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_accounts_type_enum" AS ENUM('platform_cash_clearing', 'seller_pending', 'seller_available', 'platform_revenue', 'payment_fee_reserve', 'refund_reserve', 'payout_payable')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ledger_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."ledger_accounts_type_enum" NOT NULL, "owner_id" character varying, "currency" character varying(3) NOT NULL, "balance" numeric(14,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_62b34396dda564757cf123fff0e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_entries_eventtype_enum" AS ENUM('payment_collected', 'payment_verified', 'fee_accrued', 'seller_pending_allocated', 'delivery_confirmed', 'hold_released', 'refund_initiated', 'refund_completed', 'payout_requested', 'payout_approved', 'payout_sent', 'payout_reversed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ledger_entries_account_type_enum" AS ENUM('platform_cash_clearing', 'seller_pending', 'seller_available', 'platform_revenue', 'payment_fee_reserve', 'refund_reserve', 'payout_payable')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ledger_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "account_id" uuid NOT NULL, "eventType" "public"."ledger_entries_eventtype_enum" NOT NULL, "account_type" "public"."ledger_entries_account_type_enum" NOT NULL, "amount" numeric(14,2) NOT NULL, "currency" character varying(3) NOT NULL, "order_id" character varying, "payment_id" character varying, "payout_id" character varying, "actor_id" character varying, "policy_version" character varying, "reference" character varying, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6efcb84411d3f08b08450ae75d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."feed_posts_status_enum" AS ENUM('published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "feed_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_profile_id" uuid NOT NULL, "content" text NOT NULL, "media_urls" text array NOT NULL DEFAULT '{}', "product_id" character varying, "status" "public"."feed_posts_status_enum" NOT NULL DEFAULT 'published', "like_count" integer NOT NULL DEFAULT '0', "comment_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_91d985d29dfb9db30f565391830" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "feed_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3a183f99524b2d2131c72252190" UNIQUE ("post_id", "user_id"), CONSTRAINT "PK_cc8da4d504330fc9a28b227976c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "feed_follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "follower_id" uuid NOT NULL, "seller_profile_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4323e63c9f6eb414f7673cbf741" UNIQUE ("follower_id", "seller_profile_id"), CONSTRAINT "PK_719718c13f6a07d65d29ec1fb3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "feed_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "user_id" uuid NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bf5d40b434d0ad53853845284c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyer_id" uuid NOT NULL, "seller_profile_id" uuid NOT NULL, "last_message_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1c8d0f3e41c2ac894a335322a78" UNIQUE ("buyer_id", "seller_profile_id"), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chat_messages_sender_role_enum" AS ENUM('buyer', 'seller')`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "sender_role" "public"."chat_messages_sender_role_enum" NOT NULL, "content" text NOT NULL, "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" ADD CONSTRAINT "FK_9b0517c80ecf6aadcb9e105c94f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "FK_88a7214754ff4ff60ba7994f396" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "FK_5f45869c226ed8cd295d952605d" FOREIGN KEY ("tier_id") REFERENCES "subscription_tiers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_kycs" ADD CONSTRAINT "FK_8a8bc77f77b90b9d0ea5d5df51e" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_c42c70b68833d30d60f8a373077" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" ADD CONSTRAINT "FK_e6bb4a69096db4f6a1f5bada151" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_e67b3553eafd73398d8dcb7d2f4" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_db2d0ea722e16e0fe8ab3bce111" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_quotes" ADD CONSTRAINT "FK_78756beefd3c2e75606f750d895" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fulfilment_events" ADD CONSTRAINT "FK_b1116a9bd411ced9c391cf6bcec" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_5e90e93d0e036c3fadbaefa4d0a" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_5f04d6755be82b8cd6b42ee28e4" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_intents" ADD CONSTRAINT "FK_72d238e0c1a0a0d9972998f9d5d" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_intents" ADD CONSTRAINT "FK_c54ab1a25c73eb7f960b42b2719" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_cases" ADD CONSTRAINT "FK_d9295bc48ddd5a4a18361337d7e" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_cases" ADD CONSTRAINT "FK_86e6e6eb594803024b0b6aa1c55" FOREIGN KEY ("raised_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_e4440167e470be69f9622c1ceab" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_posts" ADD CONSTRAINT "FK_51b4f84ace0308536b2e33610df" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_likes" ADD CONSTRAINT "FK_35fb4d1d38a8ea9bea4eac80e84" FOREIGN KEY ("post_id") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_likes" ADD CONSTRAINT "FK_641857fd1b2550b4f848c76069b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_follows" ADD CONSTRAINT "FK_6d832e9965fa9c00d398b34f851" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_follows" ADD CONSTRAINT "FK_0152a333fdc7467f36277abec71" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_comments" ADD CONSTRAINT "FK_3d9e4632182633c029343ac8229" FOREIGN KEY ("post_id") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_comments" ADD CONSTRAINT "FK_4b189a043b35397dc04273e8d21" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_4aaec38ea4546a391d0b31efd0a" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_52a473edf08dbbc335e991d46e6" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_3d623662d4ee1219b23cf61e649" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_9e5fc47ecb06d4d7b84633b1718" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_9e5fc47ecb06d4d7b84633b1718"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_3d623662d4ee1219b23cf61e649"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_52a473edf08dbbc335e991d46e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_4aaec38ea4546a391d0b31efd0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_comments" DROP CONSTRAINT "FK_4b189a043b35397dc04273e8d21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_comments" DROP CONSTRAINT "FK_3d9e4632182633c029343ac8229"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_follows" DROP CONSTRAINT "FK_0152a333fdc7467f36277abec71"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_follows" DROP CONSTRAINT "FK_6d832e9965fa9c00d398b34f851"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_likes" DROP CONSTRAINT "FK_641857fd1b2550b4f848c76069b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_likes" DROP CONSTRAINT "FK_35fb4d1d38a8ea9bea4eac80e84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_posts" DROP CONSTRAINT "FK_51b4f84ace0308536b2e33610df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_e4440167e470be69f9622c1ceab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_cases" DROP CONSTRAINT "FK_86e6e6eb594803024b0b6aa1c55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_cases" DROP CONSTRAINT "FK_d9295bc48ddd5a4a18361337d7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_intents" DROP CONSTRAINT "FK_c54ab1a25c73eb7f960b42b2719"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_intents" DROP CONSTRAINT "FK_72d238e0c1a0a0d9972998f9d5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_5f04d6755be82b8cd6b42ee28e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_5e90e93d0e036c3fadbaefa4d0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fulfilment_events" DROP CONSTRAINT "FK_b1116a9bd411ced9c391cf6bcec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_quotes" DROP CONSTRAINT "FK_78756beefd3c2e75606f750d895"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_db2d0ea722e16e0fe8ab3bce111"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_e67b3553eafd73398d8dcb7d2f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_media" DROP CONSTRAINT "FK_e6bb4a69096db4f6a1f5bada151"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_6343513e20e2deab45edfce1316"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_c42c70b68833d30d60f8a373077"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_kycs" DROP CONSTRAINT "FK_8a8bc77f77b90b9d0ea5d5df51e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" DROP CONSTRAINT "FK_5f45869c226ed8cd295d952605d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_subscriptions" DROP CONSTRAINT "FK_88a7214754ff4ff60ba7994f396"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_profiles" DROP CONSTRAINT "FK_9b0517c80ecf6aadcb9e105c94f"`,
    );
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(
      `DROP TYPE "public"."chat_messages_sender_role_enum"`,
    );
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TABLE "feed_comments"`);
    await queryRunner.query(`DROP TABLE "feed_follows"`);
    await queryRunner.query(`DROP TABLE "feed_likes"`);
    await queryRunner.query(`DROP TABLE "feed_posts"`);
    await queryRunner.query(`DROP TYPE "public"."feed_posts_status_enum"`);
    await queryRunner.query(`DROP TABLE "ledger_entries"`);
    await queryRunner.query(
      `DROP TYPE "public"."ledger_entries_account_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ledger_entries_eventtype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "ledger_accounts"`);
    await queryRunner.query(`DROP TYPE "public"."ledger_accounts_type_enum"`);
    await queryRunner.query(`DROP TABLE "dispute_cases"`);
    await queryRunner.query(`DROP TYPE "public"."dispute_cases_status_enum"`);
    await queryRunner.query(`DROP TABLE "payment_intents"`);
    await queryRunner.query(`DROP TYPE "public"."payment_intents_status_enum"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "fulfilment_events"`);
    await queryRunner.query(`DROP TYPE "public"."fulfilment_events_type_enum"`);
    await queryRunner.query(`DROP TABLE "delivery_quotes"`);
    await queryRunner.query(`DROP TYPE "public"."delivery_quotes_status_enum"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."products_discount_type_enum"`);
    await queryRunner.query(`DROP TABLE "product_media"`);
    await queryRunner.query(`DROP TYPE "public"."product_media_type_enum"`);
    await queryRunner.query(`DROP TABLE "product_variants"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "webhook_events"`);
    await queryRunner.query(`DROP TABLE "platform_configs"`);
    await queryRunner.query(`DROP TABLE "bank_accounts"`);
    await queryRunner.query(`DROP TABLE "seller_kycs"`);
    await queryRunner.query(`DROP TABLE "seller_subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."seller_subscriptions_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "subscription_tiers"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscription_tiers_name_enum"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "seller_profiles"`);
    await queryRunner.query(`DROP TYPE "public"."seller_profiles_status_enum"`);
  }
}
