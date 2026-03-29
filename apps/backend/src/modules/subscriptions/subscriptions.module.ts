import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import { SellerSubscription } from './entities/seller-subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { PaymentsModule } from '../payments/payments.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionTier, SellerSubscription]),
    PlatformConfigModule,
    LedgerModule,
    UsersModule,
    forwardRef(() => PaymentsModule),
  ],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
