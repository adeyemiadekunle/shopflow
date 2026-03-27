import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

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
