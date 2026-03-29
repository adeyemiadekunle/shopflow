import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateBuyerAddressDto,
  ResolveSavedAddressDto,
  SetDefaultAddressDto,
  UpdateBuyerAddressDto,
} from './dto/address.dto';
import { BuyerAddress } from './entities/buyer-address.entity';

type OrderAddressSnapshot = {
  addressLine1: string;
  addressLine2?: string;
  state: string;
  lga: string;
  postcode?: string;
  country: string;
  recipientName?: string;
  recipientPhone?: string;
};

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(BuyerAddress)
    private readonly addressRepo: Repository<BuyerAddress>,
  ) {}

  private normalizeFlags(params: {
    useForDelivery?: boolean;
    useForBilling?: boolean;
  }) {
    const useForDelivery = params.useForDelivery ?? true;
    const useForBilling = params.useForBilling ?? false;

    if (!useForDelivery && !useForBilling) {
      throw new BadRequestException(
        'An address must be usable for delivery, billing, or both',
      );
    }

    return { useForDelivery, useForBilling };
  }

  private toOrderSnapshot(address: BuyerAddress): OrderAddressSnapshot {
    return {
      addressLine1: address.addressLine1,
      ...(address.addressLine2 ? { addressLine2: address.addressLine2 } : {}),
      state: address.state,
      lga: address.lga,
      ...(address.postcode ? { postcode: address.postcode } : {}),
      country: address.country,
      ...(address.recipientName
        ? { recipientName: address.recipientName }
        : {}),
      ...(address.recipientPhone
        ? { recipientPhone: address.recipientPhone }
        : {}),
    };
  }

  private async getOwnedAddressOrThrow(
    buyerId: string,
    addressId: string,
  ): Promise<BuyerAddress> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, buyerId },
    });

    if (!address) {
      throw new NotFoundException(`Address ${addressId} not found`);
    }

    return address;
  }

  private async clearDefaultFlags(params: {
    buyerId: string;
    delivery?: boolean;
    billing?: boolean;
    excludeId?: string;
  }): Promise<void> {
    if (!params.delivery && !params.billing) {
      return;
    }

    const addresses = await this.addressRepo.find({
      where: { buyerId: params.buyerId },
    });

    for (const address of addresses) {
      if (params.excludeId && address.id === params.excludeId) {
        continue;
      }

      const nextDelivery = params.delivery ? false : address.isDefaultDelivery;
      const nextBilling = params.billing ? false : address.isDefaultBilling;

      if (
        nextDelivery !== address.isDefaultDelivery ||
        nextBilling !== address.isDefaultBilling
      ) {
        await this.addressRepo.save({
          ...address,
          isDefaultDelivery: nextDelivery,
          isDefaultBilling: nextBilling,
        });
      }
    }
  }

  async listForBuyer(buyerId: string): Promise<BuyerAddress[]> {
    return this.addressRepo.find({
      where: { buyerId },
      order: {
        isDefaultDelivery: 'DESC',
        isDefaultBilling: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async getDefaultsForBuyer(buyerId: string) {
    const addresses = await this.listForBuyer(buyerId);

    return {
      delivery:
        addresses.find((address) => address.isDefaultDelivery) ?? null,
      billing: addresses.find((address) => address.isDefaultBilling) ?? null,
    };
  }

  async createForBuyer(
    buyerId: string,
    dto: CreateBuyerAddressDto,
  ): Promise<BuyerAddress> {
    const flags = this.normalizeFlags(dto);

    if (dto.isDefaultDelivery) {
      if (!flags.useForDelivery) {
        throw new BadRequestException(
          'Default delivery addresses must be enabled for delivery use',
        );
      }
      await this.clearDefaultFlags({ buyerId, delivery: true });
    }

    if (dto.isDefaultBilling) {
      if (!flags.useForBilling) {
        throw new BadRequestException(
          'Default billing addresses must be enabled for billing use',
        );
      }
      await this.clearDefaultFlags({ buyerId, billing: true });
    }

    return this.addressRepo.save(
      this.addressRepo.create({
        buyerId,
        label: dto.label.trim(),
        addressLine1: dto.addressLine1.trim(),
        addressLine2: dto.addressLine2?.trim(),
        state: dto.state.trim(),
        lga: dto.lga.trim(),
        postcode: dto.postcode?.trim(),
        country: dto.country.trim().toUpperCase(),
        recipientName: dto.recipientName?.trim(),
        recipientPhone: dto.recipientPhone?.trim(),
        useForDelivery: flags.useForDelivery,
        useForBilling: flags.useForBilling,
        isDefaultDelivery: dto.isDefaultDelivery ?? false,
        isDefaultBilling: dto.isDefaultBilling ?? false,
      }),
    );
  }

  async updateForBuyer(
    buyerId: string,
    addressId: string,
    dto: UpdateBuyerAddressDto,
  ): Promise<BuyerAddress> {
    const address = await this.getOwnedAddressOrThrow(buyerId, addressId);
    const flags = this.normalizeFlags({
      useForDelivery: dto.useForDelivery ?? address.useForDelivery,
      useForBilling: dto.useForBilling ?? address.useForBilling,
    });

    const nextIsDefaultDelivery =
      dto.isDefaultDelivery ?? address.isDefaultDelivery;
    const nextIsDefaultBilling =
      dto.isDefaultBilling ?? address.isDefaultBilling;

    if (nextIsDefaultDelivery && !flags.useForDelivery) {
      throw new BadRequestException(
        'Default delivery addresses must be enabled for delivery use',
      );
    }

    if (nextIsDefaultBilling && !flags.useForBilling) {
      throw new BadRequestException(
        'Default billing addresses must be enabled for billing use',
      );
    }

    if (nextIsDefaultDelivery) {
      await this.clearDefaultFlags({
        buyerId,
        delivery: true,
        excludeId: address.id,
      });
    }

    if (nextIsDefaultBilling) {
      await this.clearDefaultFlags({
        buyerId,
        billing: true,
        excludeId: address.id,
      });
    }

    return this.addressRepo.save({
      ...address,
      ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
      ...(dto.addressLine1 !== undefined
        ? { addressLine1: dto.addressLine1.trim() }
        : {}),
      ...(dto.addressLine2 !== undefined
        ? { addressLine2: dto.addressLine2?.trim() }
        : {}),
      ...(dto.state !== undefined ? { state: dto.state.trim() } : {}),
      ...(dto.lga !== undefined ? { lga: dto.lga.trim() } : {}),
      ...(dto.postcode !== undefined ? { postcode: dto.postcode?.trim() } : {}),
      ...(dto.country !== undefined
        ? { country: dto.country.trim().toUpperCase() }
        : {}),
      ...(dto.recipientName !== undefined
        ? { recipientName: dto.recipientName?.trim() }
        : {}),
      ...(dto.recipientPhone !== undefined
        ? { recipientPhone: dto.recipientPhone?.trim() }
        : {}),
      useForDelivery: flags.useForDelivery,
      useForBilling: flags.useForBilling,
      isDefaultDelivery: nextIsDefaultDelivery,
      isDefaultBilling: nextIsDefaultBilling,
    });
  }

  async deleteForBuyer(buyerId: string, addressId: string): Promise<void> {
    const address = await this.getOwnedAddressOrThrow(buyerId, addressId);
    await this.addressRepo.delete(address.id);
  }

  async setDefaultsForBuyer(
    buyerId: string,
    addressId: string,
    dto: SetDefaultAddressDto,
  ): Promise<BuyerAddress> {
    const address = await this.getOwnedAddressOrThrow(buyerId, addressId);

    if (!dto.delivery && !dto.billing) {
      throw new BadRequestException(
        'At least one of delivery or billing must be true',
      );
    }

    if (dto.delivery && !address.useForDelivery) {
      throw new BadRequestException(
        'This address is not enabled for delivery use',
      );
    }

    if (dto.billing && !address.useForBilling) {
      throw new BadRequestException(
        'This address is not enabled for billing use',
      );
    }

    await this.clearDefaultFlags({
      buyerId,
      delivery: dto.delivery,
      billing: dto.billing,
      excludeId: address.id,
    });

    return this.addressRepo.save({
      ...address,
      isDefaultDelivery: dto.delivery ? true : address.isDefaultDelivery,
      isDefaultBilling: dto.billing ? true : address.isDefaultBilling,
    });
  }

  async resolveAddressesForCheckout(
    buyerId: string,
    params: ResolveSavedAddressDto,
  ): Promise<{
    deliveryAddress?: OrderAddressSnapshot;
    billingAddress?: OrderAddressSnapshot;
  }> {
    let deliveryAddress: OrderAddressSnapshot | undefined;
    let billingAddress: OrderAddressSnapshot | undefined;

    if (params.deliveryAddressId) {
      const address = await this.getOwnedAddressOrThrow(
        buyerId,
        params.deliveryAddressId,
      );
      if (!address.useForDelivery) {
        throw new BadRequestException(
          'Selected delivery address is not enabled for delivery use',
        );
      }
      deliveryAddress = this.toOrderSnapshot(address);
    }

    if (params.useDeliveryAddressForBilling ?? true) {
      billingAddress = deliveryAddress;
    } else if (params.billingAddressId) {
      const address = await this.getOwnedAddressOrThrow(
        buyerId,
        params.billingAddressId,
      );
      if (!address.useForBilling) {
        throw new BadRequestException(
          'Selected billing address is not enabled for billing use',
        );
      }
      billingAddress = this.toOrderSnapshot(address);
    }

    return {
      deliveryAddress,
      billingAddress,
    };
  }
}
