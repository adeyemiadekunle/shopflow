import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateProductDto, UpdateProductDto } from './dto/manage-product.dto';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  @Public()
  @ApiOperation({ summary: 'List active products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getProducts(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.catalogService.findProducts(page ?? 1, limit ?? 20);
  }

  @Get('products/:id')
  @Public()
  @ApiOperation({ summary: 'Get an active product by ID' })
  getProduct(@Param('id') id: string) {
    return this.catalogService.findById(id);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List categories' })
  getCategories() {
    return this.catalogService.findCategories();
  }

  @Get('me/products')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'List products belonging to the current seller' })
  getMyProducts(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.findOwnProducts(user.id);
  }

  @Post('products')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary:
      'Create a product for the current seller. Seller onboarding must be complete first.',
  })
  createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ) {
    return this.catalogService.createProductForSeller(user.id, dto);
  }

  @Patch('products/:id')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Update one of the current seller products' })
  updateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.updateProductForSeller(user.id, id, dto);
  }

  @Delete('products/:id')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Archive one of the current seller products' })
  deleteProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.catalogService.deleteProductForSeller(user.id, id);
  }
}
