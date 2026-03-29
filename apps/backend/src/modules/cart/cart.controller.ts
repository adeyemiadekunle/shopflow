import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { CartService } from './cart.service';
import {
  AddCartItemDto,
  CheckoutCartSellerDto,
  UpdateCartItemDto,
} from './dto/cart.dto';

@ApiTags('cart')
@Controller('cart')
@Roles(UserRole.BUYER)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current buyer cart grouped by seller' })
  getCart(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add an item to the current buyer cart' })
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update quantity for one buyer cart line item' })
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove one line item from the buyer cart' })
  removeItem(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.cartService.removeItem(user.id, id);
  }

  @Delete('sellers/:sellerProfileId')
  @ApiOperation({
    summary: 'Clear all current buyer cart items for one seller group',
  })
  clearSellerGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sellerProfileId') sellerProfileId: string,
  ) {
    return this.cartService.clearSellerGroup(user.id, sellerProfileId);
  }

  @Post('sellers/:sellerProfileId/checkout')
  @ApiOperation({
    summary:
      'Create one seller-scoped order from the selected seller cart group and then clear those cart items',
  })
  checkoutSellerGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sellerProfileId') sellerProfileId: string,
    @Body() dto: CheckoutCartSellerDto,
  ) {
    return this.cartService.checkoutSellerGroup(user.id, sellerProfileId, dto);
  }
}
