import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MediaService } from '../media/media.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { SellersService } from '../sellers/sellers.service';
import { CatalogService } from './catalog.service';
import { Category } from './entities/category.entity';
import { ProductMedia } from './entities/product-media.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Product, ProductStatus } from './entities/product.entity';

describe('CatalogService', () => {
  let service: CatalogService;

  const mockProductRepo = {
    findAndCount: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
    save: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockCategoryRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockVariantRepo = {
    delete: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
  };

  const mockMediaRepo = {
    delete: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
  };

  const mockSellersService = {
    assertCanManageProducts: jest.fn(),
    getByUserIdOrThrow: jest.fn(),
  };

  const mockMediaService = {
    isAllowedPublicUrl: jest.fn().mockReturnValue(true),
  };

  const mockPlatformConfigService = {
    getBoolean: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepo,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepo,
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: mockVariantRepo,
        },
        {
          provide: getRepositoryToken(ProductMedia),
          useValue: mockMediaRepo,
        },
        {
          provide: SellersService,
          useValue: mockSellersService,
        },
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
        { provide: PlatformConfigService, useValue: mockPlatformConfigService },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  it('createProductForSeller() should reject sellers who are not ready to create products', async () => {
    mockSellersService.assertCanManageProducts.mockRejectedValue(
      new ForbiddenException(
        'Complete seller onboarding before managing products',
      ),
    );

    await expect(
      service.createProductForSeller('user-1', {
        title: 'Premium Ankara Gown',
        basePrice: 15000,
        currency: 'NGN',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('createProductForSeller() should create a product with derived effective price', async () => {
    mockSellersService.assertCanManageProducts.mockResolvedValue({
      id: 'seller-1',
    });
    mockProductRepo.create.mockImplementation(
      (value: Record<string, unknown>) => value,
    );
    mockVariantRepo.create.mockImplementation(
      (value: Record<string, unknown>) => value,
    );
    mockMediaRepo.create.mockImplementation(
      (value: Record<string, unknown>) => value,
    );
    mockProductRepo.save.mockImplementation(
      (value: Record<string, unknown>) => value,
    );

    const result = await service.createProductForSeller('user-1', {
      title: 'Premium Ankara Gown',
      basePrice: 15000,
      currency: 'NGN',
      hasDiscount: true,
      discountValue: 10,
      discountType: 'percentage' as const,
      variants: [
        {
          name: 'Large',
          stockQuantity: 10,
        },
      ],
      media: [
        {
<<<<<<< HEAD
          url: 'https://cdn.rands.ng/products/ankara-1.webp',
=======
          url: 'https://cdn.shopflow.ng/products/ankara-1.webp',
>>>>>>> 2ed2340 (feat: expand shopflow platform and frontend)
          isPrimary: true,
        },
      ],
    });

    expect(result.sellerProfileId).toBe('seller-1');
    expect(result.effectivePrice).toBe(13500);
    expect(result.status).toBe(ProductStatus.DRAFT);
  });

  it('updateProductForSeller() should reject edits to another seller product', async () => {
    mockProductRepo.findOne.mockResolvedValue({
      id: 'product-1',
      sellerProfileId: 'seller-2',
    });
    mockSellersService.getByUserIdOrThrow.mockResolvedValue({
      id: 'seller-1',
    });
    mockSellersService.assertCanManageProducts.mockResolvedValue({
      id: 'seller-1',
    });

    await expect(
      service.updateProductForSeller('user-1', 'product-1', {
        title: 'Updated Product',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deleteProductForSeller() should soft delete owned products', async () => {
    mockProductRepo.findOne.mockResolvedValue({
      id: 'product-1',
      sellerProfileId: 'seller-1',
    });
    mockSellersService.getByUserIdOrThrow.mockResolvedValue({
      id: 'seller-1',
    });
    mockSellersService.assertCanManageProducts.mockResolvedValue({
      id: 'seller-1',
    });

    await service.deleteProductForSeller('user-1', 'product-1');

    expect(mockProductRepo.softDelete).toHaveBeenCalledWith('product-1');
  });

  it('findById() should only return active products to the public', async () => {
    mockProductRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('product-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('createProductForSeller() should normalize product media to a single primary image', async () => {
    mockSellersService.assertCanManageProducts.mockResolvedValue({
      id: 'seller-1',
    });
    mockProductRepo.create.mockImplementation(
      (value: Record<string, unknown>) => value,
    );
    mockMediaRepo.create.mockImplementation(
      (value: Record<string, unknown>) => value,
    );
    mockProductRepo.save.mockImplementation(
      (value: Record<string, unknown>) => value,
    );

    const result = await service.createProductForSeller('user-1', {
      title: 'Premium Ankara Gown',
      basePrice: 15000,
      currency: 'NGN',
      media: [
        {
          type: 'image',
<<<<<<< HEAD
          url: 'https://cdn.rands.ng/products/ankara-1.webp',
=======
          url: 'https://cdn.shopflow.ng/products/ankara-1.webp',
>>>>>>> 2ed2340 (feat: expand shopflow platform and frontend)
          isPrimary: false,
        },
        {
          type: 'image',
<<<<<<< HEAD
          url: 'https://cdn.rands.ng/products/ankara-2.webp',
=======
          url: 'https://cdn.shopflow.ng/products/ankara-2.webp',
>>>>>>> 2ed2340 (feat: expand shopflow platform and frontend)
          isPrimary: true,
        },
      ],
    });

    expect(result.media).toEqual([
      expect.objectContaining({
<<<<<<< HEAD
        url: 'https://cdn.rands.ng/products/ankara-1.webp',
=======
        url: 'https://cdn.shopflow.ng/products/ankara-1.webp',
>>>>>>> 2ed2340 (feat: expand shopflow platform and frontend)
        displayOrder: 0,
        isPrimary: false,
      }),
      expect.objectContaining({
<<<<<<< HEAD
        url: 'https://cdn.rands.ng/products/ankara-2.webp',
=======
        url: 'https://cdn.shopflow.ng/products/ankara-2.webp',
>>>>>>> 2ed2340 (feat: expand shopflow platform and frontend)
        displayOrder: 1,
        isPrimary: true,
      }),
    ]);
  });

  it('createProductForSeller() should reject video media without a thumbnail', async () => {
    mockSellersService.assertCanManageProducts.mockResolvedValue({
      id: 'seller-1',
    });

    await expect(
      service.createProductForSeller('user-1', {
        title: 'Premium Ankara Gown',
        basePrice: 15000,
        currency: 'NGN',
        media: [
          {
            type: 'video',
<<<<<<< HEAD
            url: 'https://cdn.rands.ng/products/ankara-clip.mp4',
=======
            url: 'https://cdn.shopflow.ng/products/ankara-clip.mp4',
>>>>>>> 2ed2340 (feat: expand shopflow platform and frontend)
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
