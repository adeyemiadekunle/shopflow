import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/enums/user-role.enum';
import {
  CreateOrderDto,
  OpenDisputeDto,
  ResolveDisputeDto,
  RespondToQuoteDto,
  SendDeliveryQuoteDto,
  UpdateOrderProgressDto,
} from './dto/orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Create a new buyer order for a single seller' })
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get('my')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Get current user orders (buyer)' })
  getMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findByBuyer(user.id);
  }

  @Get('seller')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Get current seller orders' })
  getSellerOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findBySellerUser(user.id);
  }

  @Post(':id/quote')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Send a delivery quote for an order' })
  sendDeliveryQuote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendDeliveryQuoteDto,
  ) {
    return this.ordersService.sendDeliveryQuote(user.id, id, dto);
  }

  @Post(':id/quote-response')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Accept or decline the latest delivery quote' })
  respondToQuote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RespondToQuoteDto,
  ) {
    return this.ordersService.respondToQuote(user.id, id, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Cancel an order before payment is confirmed' })
  cancelOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.cancelByBuyer(user.id, id);
  }

  @Post(':id/prepare')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Mark a paid order as being prepared by the seller' })
  markPreparing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderProgressDto,
  ) {
    return this.ordersService.markPreparing(user.id, id, dto);
  }

  @Post(':id/ship')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Mark a prepared order as shipped' })
  markShipped(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderProgressDto,
  ) {
    return this.ordersService.markShipped(user.id, id, dto);
  }

  @Post(':id/deliver')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary:
      'Mark a shipped order as delivered and start the return-policy hold window',
  })
  markDelivered(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderProgressDto,
  ) {
    return this.ordersService.markDelivered(user.id, id, dto);
  }

  @Post(':id/confirm-delivery')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Confirm that a delivered order reached the buyer' })
  confirmDelivery(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderProgressDto,
  ) {
    return this.ordersService.confirmDelivery(user.id, id, dto);
  }

  @Post(':id/disputes')
  @Roles(UserRole.BUYER)
  @ApiOperation({
    summary: 'Open a delivery dispute before seller funds are released',
  })
  openDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: OpenDisputeDto,
  ) {
    return this.ordersService.openDispute(user.id, id, dto);
  }

  @Post('disputes/:disputeId/resolve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Resolve an order dispute in favour of the buyer or seller as an admin',
  })
  resolveDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('disputeId') disputeId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.ordersService.resolveDispute(disputeId, user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID if the current user has access' })
  getOrder(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findForUser(id, user);
  }
}
