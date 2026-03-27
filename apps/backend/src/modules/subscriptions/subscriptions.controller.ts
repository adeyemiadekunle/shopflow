import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import {
  UpdateSubscriptionTierDto,
  UpsertSubscriptionTierDto,
} from './dto/upsert-subscription-tier.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ─── Public ───────────────────────────────────────────────────────────────

  @Get('tiers')
  @Public()
  @ApiOperation({
    summary: 'List active subscription tiers',
    description:
      'Public — used for the pricing page. Only active tiers are returned.',
  })
  getTiers() {
    return this.subscriptionsService.findAllTiers();
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get('admin/tiers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all tiers including inactive (admin only)' })
  getAllTiersAdmin() {
    return this.subscriptionsService.findAllTiersAdmin();
  }

  @Put('admin/tiers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create or replace a subscription tier (admin only)',
    description:
      'All tier values (price, currency, feature flags, limits) are set here by admin. ' +
      'If a tier with the same name exists it is fully replaced.',
  })
  upsertTier(@Body() dto: UpsertSubscriptionTierDto) {
    return this.subscriptionsService.upsertTier(dto);
  }

  @Patch('admin/tiers/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Partially update a tier (admin only)',
    description:
      'Update any subset of tier properties: price, currency, feature flags, active status, sort order.',
  })
  updateTier(@Param('id') id: string, @Body() dto: UpdateSubscriptionTierDto) {
    return this.subscriptionsService.updateTier(id, dto);
  }

  @Post('admin/tiers/seed')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Seed default tier data (admin only)',
    description:
      'Creates the four default tiers (Free, Basic, Pro, Enterprise) as bootstrap defaults. ' +
      'No-op if tiers already exist. All values can be updated via PATCH /admin/tiers/:id afterwards.',
  })
  seedTiers() {
    return this.subscriptionsService.seedDefaultTiers();
  }
}
