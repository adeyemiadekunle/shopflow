import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerProfile } from './entities/seller-profile.entity';
import { SellerKyc } from './entities/seller-kyc.entity';
import { BankAccount } from './entities/bank-account.entity';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';
import { PaymentsModule } from '../payments/payments.module';
import { Order } from '../orders/entities/order.entity';
import { Payout } from '../payouts/entities/payout.entity';
import { Refund } from '../refunds/entities/refund.entity';
import { LedgerAccount } from '../ledger/entities/ledger-account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SellerProfile,
      SellerKyc,
      BankAccount,
      Order,
      Payout,
      Refund,
      LedgerAccount,
    ]),
    forwardRef(() => PaymentsModule),
  ],
  providers: [SellersService],
  controllers: [SellersController],
  exports: [SellersService],
})
export class SellersModule {}
