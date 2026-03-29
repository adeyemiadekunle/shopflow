import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { UpsertSellerKycDto } from './dto/upsert-seller-kyc.dto';
import { UpsertBankAccountDto } from './dto/upsert-bank-account.dto';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get('me')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Get the current seller profile' })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.sellersService.getByUserIdOrThrow(user.id);
  }

  @Patch('me')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Update the current seller storefront profile' })
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSellerProfileDto,
  ) {
    return this.sellersService.updateOwnProfile(user.id, dto);
  }

  @Get('me/onboarding-status')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary:
      'Get seller onboarding status and whether product creation is allowed',
  })
  getMyOnboardingStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.sellersService.getOnboardingStatus(user.id);
  }

  @Get('me/analytics')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Get seller analytics summary for dashboard use' })
  getMyAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.sellersService.getAnalytics(user.id);
  }

  @Patch('me/kyc')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Create or update seller KYC and business details' })
  upsertKyc(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertSellerKycDto,
  ) {
    return this.sellersService.upsertKyc(user.id, dto);
  }

  @Patch('me/bank-account')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary:
      'Create or update the primary payout account and verify it with Paystack when possible',
  })
  upsertPrimaryBankAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertBankAccountDto,
  ) {
    return this.sellersService.upsertPrimaryBankAccount(user.id, dto);
  }

  @Get(':slug/storefront')
  @ApiOperation({ summary: 'Get seller storefront by slug' })
  getStorefront(@Param('slug') slug: string) {
    return this.sellersService.findBySlug(slug);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a seller (admin only)' })
  approve(@Param('id') id: string) {
    return this.sellersService.approve(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a seller (admin only)' })
  reject(@Param('id') id: string) {
    return this.sellersService.reject(id);
  }
}
