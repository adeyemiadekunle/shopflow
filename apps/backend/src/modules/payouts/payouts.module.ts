import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerModule } from '../ledger/ledger.module';
import { PaymentsModule } from '../payments/payments.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';
import { BankAccount } from '../sellers/entities/bank-account.entity';
import { SellerProfile } from '../sellers/entities/seller-profile.entity';
import { Payout } from './entities/payout.entity';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payout, SellerProfile, BankAccount]),
    LedgerModule,
    PlatformConfigModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
