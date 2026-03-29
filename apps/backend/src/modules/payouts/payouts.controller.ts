import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import {
  ApprovePayoutDto,
  CreatePayoutRequestDto,
  SendBulkPayoutsDto,
  SendPayoutDto,
} from './dto/admin-payout.dto';
import { PayoutStatus } from './entities/payout.entity';
import { PayoutsService } from './payouts.service';

@ApiTags('payouts')
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List recent payout records for the admin dashboard' })
  listAdminPayouts(
    @Query('limit') limit?: string,
    @Query('status') status?: PayoutStatus,
  ) {
    return this.payoutsService.listAdminPayouts(
      Number.parseInt(limit ?? '50', 10),
      status,
    );
  }

  @Get('admin/sellers/:sellerProfileId/summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get seller payout summary with balances, primary bank account, and recent payouts',
  })
  getSellerPayoutSummary(@Param('sellerProfileId') sellerProfileId: string) {
    return this.payoutsService.getSellerSummaryForAdmin(sellerProfileId);
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a payout request for a seller' })
  createPayoutRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePayoutRequestDto,
  ) {
    return this.payoutsService.createPayoutRequest(user.id, dto);
  }

  @Post('admin/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve a payout request and reserve seller available balance',
  })
  approvePayout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ApprovePayoutDto,
  ) {
    return this.payoutsService.approvePayout(id, user.id, dto);
  }

  @Post('admin/:id/send')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send an approved payout through the configured payout provider',
  })
  sendPayout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendPayoutDto,
  ) {
    return this.payoutsService.sendPayout(id, user.id, dto);
  }

  @Post('admin/send-bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send multiple approved payouts as a bulk payout batch through Monnify',
  })
  sendBulkPayouts(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendBulkPayoutsDto,
  ) {
    return this.payoutsService.sendBulkPayouts(user.id, dto);
  }
}
