import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformConfig } from './entities/platform-config.entity';
import { PlatformConfigService } from './platform-config.service';
import { PlatformConfigController } from './platform-config.controller';
import { User } from '../users/entities/user.entity';
import { SellerProfile } from '../sellers/entities/seller-profile.entity';
import { Order } from '../orders/entities/order.entity';
import { Payout } from '../payouts/entities/payout.entity';
import { Refund } from '../refunds/entities/refund.entity';
import { LedgerAccount } from '../ledger/entities/ledger-account.entity';
import { PaymentIntent } from '../payments/entities/payment-intent.entity';
import { PaymentReconciliationIssue } from '../payments/entities/payment-reconciliation-issue.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformConfig,
      User,
      SellerProfile,
      Order,
      Payout,
      Refund,
      LedgerAccount,
      PaymentIntent,
      PaymentReconciliationIssue,
    ]),
  ],
  providers: [PlatformConfigService],
  controllers: [PlatformConfigController],
  exports: [PlatformConfigService],
})
export class PlatformConfigModule {}
