import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformConfig } from './entities/platform-config.entity';
import { PlatformConfigService } from './platform-config.service';
import { PlatformConfigController } from './platform-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformConfig])],
  providers: [PlatformConfigService],
  controllers: [PlatformConfigController],
  exports: [PlatformConfigService],
})
export class PlatformConfigModule {}
