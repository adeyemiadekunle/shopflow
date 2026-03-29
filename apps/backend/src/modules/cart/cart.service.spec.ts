import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import {
  DiscountType,
  Product,
  ProductStatus,
} from '../catalog/entities/product.entity';
import { OrdersService } from '../orders/orders.service';
import { SellerProfile } from '../sellers/entities/seller-profile.entity';
import { CartService } from './cart.service';
import { CartItem } from './entities/cart-item.entity';

describe('CartService', () => {
  let service: CartService;

  const mockCartItemRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) =>
        Promise.resolve(value),
      ),
    create: jest
      .fn()
      .mockImplementation((value: Record<string, unknown>) => value),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockProductRepo = {
    findOne: jest.fn(),
  };

  const mockVariantRepo = {
    findOne: jest.fn(),
  };

  const mockSellerRepo = {
    findOneBy: jest.fn(),
  };

  const mockOrdersService = {
    createOrder: jest.fn(),
  };

  const activeProduct: Product = {
    id: 'product-1',
    sellerProfileId: 'seller-1',
    sellerProfile: {
      id: 'seller-1',
      storeName: 'Adeoja Store',
      storeSlug: 'adeoja-store',
      logoUrl: 'https://example.com/logo.png',
    } as SellerProfile,
    title: 'Adire Dress',
    description: 'Handmade dress',
    basePrice: 10000,
    effectivePrice: 8500,
    currency: 'NGN',
    hasDiscount: true,
    discountType: DiscountType.PERCENTAGE,
    discountValue: 15,
    discountStartsAt: new Date('2026-03-01T00:00:00.000Z'),
    discountEndsAt: new Date('2026-04-01T00:00:00.000Z'),
    weightGrams: undefined,
    handlingDays: 1,
    tags: ['adire'],
    status: ProductStatus.ACTIVE,
    media: [],
    variants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const variant: ProductVariant = {
    id: 'variant-1',
    productId: 'product-1',
    product: activeProduct,
    name: 'Blue / M',
    sku: 'AD-001',
    priceOverride: 9000,
    stockQuantity: 5,
    attributes: { color: 'Blue', size: 'M' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockProductRepo.findOne.mockResolvedValue(activeProduct);
    mockVariantRepo.findOne.mockResolvedValue(variant);
    mockSellerRepo.findOneBy.mockResolvedValue({
      id: 'seller-1',
      storeName: 'Adeoja Store',
      storeSlug: 'adeoja-store',
      logoUrl: 'https://example.com/logo.png',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(CartItem), useValue: mockCartItemRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: mockVariantRepo,
        },
        {
          provide: getRepositoryToken(SellerProfile),
          useValue: mockSellerRepo,
        },
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('addItem() should save a new cart line and return grouped cart data', async () => {
    mockCartItemRepo.findOne.mockResolvedValueOnce(null);
    mockCartItemRepo.find.mockResolvedValue([
      {
        id: 'cart-1',
        buyerId: 'buyer-1',
        sellerProfileId: 'seller-1',
        sellerProfile: activeProduct.sellerProfile,
        productId: 'product-1',
        product: activeProduct,
        variantId: 'variant-1',
        variant,
        quantity: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.addItem('buyer-1', {
      productId: 'product-1',
      variantId: 'variant-1',
      quantity: 3,
    });

    expect(mockCartItemRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerId: 'buyer-1',
        sellerProfileId: 'seller-1',
        quantity: 3,
      }),
    );
    expect(result.sellerGroupCount).toBe(1);
    expect(result.sellerGroups[0].canCheckout).toBe(true);
  });

  it('updateItem() should reject quantity above variant stock', async () => {
    mockCartItemRepo.findOne.mockResolvedValue({
      id: 'cart-1',
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
      sellerProfile: activeProduct.sellerProfile,
      productId: 'product-1',
      product: activeProduct,
      variantId: 'variant-1',
      variant,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.updateItem('buyer-1', 'cart-1', { quantity: 10 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('getCart() should group buyer items by seller', async () => {
    mockCartItemRepo.find.mockResolvedValue([
      {
        id: 'cart-1',
        buyerId: 'buyer-1',
        sellerProfileId: 'seller-1',
        sellerProfile: activeProduct.sellerProfile,
        productId: 'product-1',
        product: activeProduct,
        variantId: 'variant-1',
        variant,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cart-2',
        buyerId: 'buyer-1',
        sellerProfileId: 'seller-1',
        sellerProfile: activeProduct.sellerProfile,
        productId: 'product-1',
        product: activeProduct,
        variantId: null,
        variant: null,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.getCart('buyer-1');

    expect(result.sellerGroupCount).toBe(1);
    expect(result.totalItemCount).toBe(3);
    expect(result.sellerGroups[0].items).toHaveLength(2);
  });

  it('checkoutSellerGroup() should create one seller-scoped order and clear that group', async () => {
    mockCartItemRepo.find.mockResolvedValueOnce([
      {
        id: 'cart-1',
        buyerId: 'buyer-1',
        sellerProfileId: 'seller-1',
        sellerProfile: activeProduct.sellerProfile,
        productId: 'product-1',
        product: activeProduct,
        variantId: 'variant-1',
        variant,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockOrdersService.createOrder.mockResolvedValue({
      id: 'order-1',
      sellerProfileId: 'seller-1',
    });

    const result = await service.checkoutSellerGroup('buyer-1', 'seller-1', {
      buyerNote: 'Please package carefully',
    });

    expect(mockOrdersService.createOrder).toHaveBeenCalledWith(
      'buyer-1',
      expect.objectContaining({
        items: [
          {
            productId: 'product-1',
            variantId: 'variant-1',
            quantity: 2,
          },
        ],
      }),
    );
    expect(mockCartItemRepo.delete).toHaveBeenCalledWith({
      buyerId: 'buyer-1',
      sellerProfileId: 'seller-1',
    });
    expect(result.clearedItemCount).toBe(1);
  });

  it('checkoutSellerGroup() should reject mixed-seller corruption in a seller group', async () => {
    mockCartItemRepo.find.mockResolvedValueOnce([
      {
        id: 'cart-1',
        buyerId: 'buyer-1',
        sellerProfileId: 'seller-1',
        sellerProfile: activeProduct.sellerProfile,
        productId: 'product-1',
        product: {
          ...activeProduct,
          sellerProfileId: 'seller-2',
        },
        variantId: 'variant-1',
        variant,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await expect(
      service.checkoutSellerGroup('buyer-1', 'seller-1', {}),
    ).rejects.toThrow(ForbiddenException);
  });

  it('clearSellerGroup() should reject an unknown seller group id', async () => {
    mockSellerRepo.findOneBy.mockResolvedValueOnce(null);

    await expect(
      service.clearSellerGroup('buyer-1', 'missing-seller'),
    ).rejects.toThrow(NotFoundException);
  });
});
