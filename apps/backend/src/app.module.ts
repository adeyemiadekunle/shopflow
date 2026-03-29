import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import configuration from './config/configuration';

// Common
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// Modules
import { HealthModule } from './modules/health/health.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { PlatformConfigModule } from './modules/platform-config/platform-config.module';
import { FeedModule } from './modules/feed/feed.module';
import { ChatModule } from './modules/chat/chat.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { CartModule } from './modules/cart/cart.module';
import { MediaModule } from './modules/media/media.module';
import { MetricsController } from './modules/health/metrics.controller';

// Entities
import { User } from './modules/users/entities/user.entity';
import { SellerProfile } from './modules/sellers/entities/seller-profile.entity';
import { BuyerAddress } from './modules/addresses/entities/buyer-address.entity';
import { SellerKyc } from './modules/sellers/entities/seller-kyc.entity';
import { BankAccount } from './modules/sellers/entities/bank-account.entity';
import { Product } from './modules/catalog/entities/product.entity';
import { ProductVariant } from './modules/catalog/entities/product-variant.entity';
import { ProductMedia } from './modules/catalog/entities/product-media.entity';
import { Category } from './modules/catalog/entities/category.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { DeliveryQuote } from './modules/orders/entities/delivery-quote.entity';
import { FulfilmentEvent } from './modules/orders/entities/fulfilment-event.entity';
import { DisputeCase } from './modules/orders/entities/dispute-case.entity';
import { PaymentIntent } from './modules/payments/entities/payment-intent.entity';
import { PaymentReconciliationIssue } from './modules/payments/entities/payment-reconciliation-issue.entity';
import { PaymentReconciliationRun } from './modules/payments/entities/payment-reconciliation-run.entity';
import { WebhookEvent } from './modules/payments/entities/webhook-event.entity';
import { LedgerAccount } from './modules/ledger/entities/ledger-account.entity';
import { LedgerEntry } from './modules/ledger/entities/ledger-entry.entity';
import { PlatformConfig } from './modules/platform-config/entities/platform-config.entity';
import { FeedPost } from './modules/feed/entities/feed-post.entity';
import { FeedLike } from './modules/feed/entities/feed-like.entity';
import { FeedComment } from './modules/feed/entities/feed-comment.entity';
import { FeedFollow } from './modules/feed/entities/feed-follow.entity';
import { Conversation } from './modules/chat/entities/conversation.entity';
import { ChatMessage } from './modules/chat/entities/chat-message.entity';
import { Payout } from './modules/payouts/entities/payout.entity';
import { Refund } from './modules/refunds/entities/refund.entity';
import { CartItem } from './modules/cart/entities/cart-item.entity';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // ── Structured logging ───────────────────────────────────────────────────
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('app.env') === 'production' ? 'info' : 'debug',
          transport:
            config.get('app.env') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true },
                }
              : undefined,
          redact: ['req.headers.authorization'],
        },
      }),
    }),

    // ── Database ─────────────────────────────────────────────────────────────
    PrometheusModule.register({
      controller: MetricsController,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get<number>('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        synchronize: config.get<boolean>('database.synchronize') ?? false,
        logging: config.get<boolean>('database.logging') ?? false,
        entities: [
          User,
          BuyerAddress,
          SellerProfile,
          SellerKyc,
          BankAccount,
          Product,
          ProductVariant,
          ProductMedia,
          Category,
          Order,
          OrderItem,
          DeliveryQuote,
          FulfilmentEvent,
          DisputeCase,
          PaymentIntent,
          Refund,
          CartItem,
          PaymentReconciliationRun,
          PaymentReconciliationIssue,
          WebhookEvent,
          LedgerAccount,
          LedgerEntry,
          Payout,
          PlatformConfig,
          FeedPost,
          FeedLike,
          FeedComment,
          FeedFollow,
          Conversation,
          ChatMessage,
        ],
        migrations: ['dist/database/migrations/*.js'],
      }),
    }),

    // ── Rate limiting ─────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttl') ?? 60,
            limit: config.get<number>('throttle.limit') ?? 100,
          },
        ],
      }),
    }),

    // ── Feature modules ───────────────────────────────────────────────────────
    HealthModule,
    AddressesModule,
    AuthModule,
    UsersModule,
    SellersModule,
    CatalogModule,
    OrdersModule,
    PaymentsModule,
    LedgerModule,
    PlatformConfigModule,
    FeedModule,
    ChatModule,
    PayoutsModule,
    RefundsModule,
    CartModule,
    MediaModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
