import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import {
  CreateRefundDto,
  RetryRefundWithBuyerDetailsDto,
} from './dto/admin-refund.dto';
import { RefundStatus } from './entities/refund.entity';
import { RefundsService } from './refunds.service';

@ApiTags('refunds')
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List recent refunds for admin operations' })
  listRefunds(
    @Query('limit') limit?: string,
    @Query('status') status?: RefundStatus,
  ) {
    return this.refundsService.listAdminRefunds(
      Number.parseInt(limit ?? '50', 10),
      status,
    );
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Initiate a provider-aware refund for an order whose seller funds are still unreleased',
  })
  createRefund(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRefundDto,
  ) {
    return this.refundsService.createRefund(user.id, dto);
  }

  @Post('admin/:id/retry')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Retry a refund using provider-specific recovery logic and optional buyer bank details',
  })
  retryRefund(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RetryRefundWithBuyerDetailsDto,
  ) {
    return this.refundsService.retryRefundWithBuyerDetails(id, user.id, dto);
  }
}
