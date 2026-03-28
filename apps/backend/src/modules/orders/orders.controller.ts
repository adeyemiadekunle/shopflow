import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/enums/user-role.enum';
import {
  CreateOrderDto,
  RespondToQuoteDto,
  SendDeliveryQuoteDto,
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

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID if the current user has access' })
  getOrder(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findForUser(id, user);
  }
}
