import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Public } from '../../common/decorators/public.decorator';

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
  @ApiOperation({ summary: 'Get product by ID' })
  getProduct(@Param('id') id: string) {
    return this.catalogService.findById(id);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List categories' })
  getCategories() {
    return this.catalogService.findCategories();
  }
}
