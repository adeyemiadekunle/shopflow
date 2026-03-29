import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AddressesService } from './addresses.service';
import { BuyerAddress } from './entities/buyer-address.entity';

describe('AddressesService', () => {
  let service: AddressesService;

  const mockAddressRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
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

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAddressRepo.find.mockResolvedValue([]);
    mockAddressRepo.findOne.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        {
          provide: getRepositoryToken(BuyerAddress),
          useValue: mockAddressRepo,
        },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  it('createForBuyer() should create an address that can be used for both delivery and billing', async () => {
    const address = await service.createForBuyer('buyer-1', {
      label: 'Home',
      addressLine1: '12 Allen Avenue',
      state: 'Lagos',
      lga: 'Ikeja',
      country: 'NG',
      useForDelivery: true,
      useForBilling: true,
      isDefaultDelivery: true,
      isDefaultBilling: true,
    });

    expect(mockAddressRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerId: 'buyer-1',
        useForDelivery: true,
        useForBilling: true,
      }),
    );
    expect(address.label).toBe('Home');
  });

  it('createForBuyer() should reject addresses disabled for both delivery and billing', async () => {
    await expect(
      service.createForBuyer('buyer-1', {
        label: 'Bad',
        addressLine1: '12 Allen Avenue',
        state: 'Lagos',
        lga: 'Ikeja',
        country: 'NG',
        useForDelivery: false,
        useForBilling: false,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('resolveAddressesForCheckout() should use delivery address for billing when requested', async () => {
    mockAddressRepo.findOne.mockResolvedValue({
      id: 'addr-1',
      buyerId: 'buyer-1',
      label: 'Home',
      addressLine1: '12 Allen Avenue',
      state: 'Lagos',
      lga: 'Ikeja',
      country: 'NG',
      recipientName: 'Ade Buyer',
      recipientPhone: '08030000000',
      useForDelivery: true,
      useForBilling: true,
      isDefaultDelivery: true,
      isDefaultBilling: true,
    });

    const result = await service.resolveAddressesForCheckout('buyer-1', {
      deliveryAddressId: 'addr-1',
      useDeliveryAddressForBilling: true,
    });

    expect(result.deliveryAddress).toEqual(
      expect.objectContaining({
        addressLine1: '12 Allen Avenue',
        recipientName: 'Ade Buyer',
      }),
    );
    expect(result.billingAddress).toEqual(result.deliveryAddress);
  });

  it('resolveAddressesForCheckout() should reject missing saved addresses', async () => {
    mockAddressRepo.findOne.mockResolvedValue(null);

    await expect(
      service.resolveAddressesForCheckout('buyer-1', {
        deliveryAddressId: 'missing-address',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
