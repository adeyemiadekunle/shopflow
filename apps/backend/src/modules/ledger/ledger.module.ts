import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerAccount } from './entities/ledger-account.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { LedgerService } from './ledger.service';
import { PlatformConfigModule } from '../platform-config/platform-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LedgerAccount, LedgerEntry]),
    PlatformConfigModule,
  ],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
