import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('orders')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get current user orders (buyer)' })
  getMyOrders(@CurrentUser() user: User) {
    return this.ordersService.findByBuyer(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  getOrder(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }
}
