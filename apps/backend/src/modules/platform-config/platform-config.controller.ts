import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlatformConfigService } from './platform-config.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

export class SetConfigDto {
  @ApiProperty({
    example: 'GHS',
    description: 'Config value (always stored as string)',
  })
  @IsString()
  value!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Expose this key to the public API',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

@ApiTags('platform-config')
@Controller('platform-config')
export class PlatformConfigController {
  constructor(private readonly service: PlatformConfigService) {}

  /** Public — returns only keys marked isPublic: true (currency, country, etc.) */
  @Get('public')
  @Public()
  @ApiOperation({
    summary: 'Get public platform config (currency, country, platform name)',
    description:
      'Returns market identity (currency, country, name) from env config and public business-rule values from the database. Safe to call from the frontend.',
  })
  getPublic() {
    return this.service.findPublicConfigs();
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all platform config entries (admin only)' })
  getAll() {
    return this.service.findAll();
  }

  @Put(':key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Set or update a business-rule config value (admin only)',
    description:
      'Creates the key if it does not exist, otherwise updates it. ' +
      'Use the PlatformConfigKey constants as keys. ' +
      'Note: market-identity values (currency, country_code, market_name, platform_name) ' +
      'are env vars set at deploy time — they cannot be changed here.',
  })
  set(@Param('key') key: string, @Body() dto: SetConfigDto) {
    return this.service.set(
      key,
      dto.value,
      dto.description,
      dto.isPublic ?? false,
    );
  }

  @Delete(':key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a platform config entry (admin only)' })
  del(@Param('key') key: string) {
    return this.service.delete(key);
  }
}
