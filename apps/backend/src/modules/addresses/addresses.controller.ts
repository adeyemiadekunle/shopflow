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
import {
  CreateBuyerAddressDto,
  SetDefaultAddressDto,
  UpdateBuyerAddressDto,
} from './dto/address.dto';
import { AddressesService } from './addresses.service';

@ApiTags('addresses')
@Controller('addresses')
@Roles(UserRole.BUYER)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'List the current buyer saved addresses' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.addressesService.listForBuyer(user.id);
  }

  @Get('defaults')
  @ApiOperation({ summary: 'Get the current buyer default delivery and billing addresses' })
  getDefaults(@CurrentUser() user: AuthenticatedUser) {
    return this.addressesService.getDefaultsForBuyer(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a buyer saved address for delivery, billing, or both' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBuyerAddressDto,
  ) {
    return this.addressesService.createForBuyer(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update one buyer saved address' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBuyerAddressDto,
  ) {
    return this.addressesService.updateForBuyer(user.id, id, dto);
  }

  @Post(':id/defaults')
  @ApiOperation({ summary: 'Mark one buyer address as default delivery and/or billing address' })
  setDefaults(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetDefaultAddressDto,
  ) {
    return this.addressesService.setDefaultsForBuyer(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one buyer saved address' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.addressesService.deleteForBuyer(user.id, id);
  }
}
