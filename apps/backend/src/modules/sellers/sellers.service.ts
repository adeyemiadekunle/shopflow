import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerProfile } from './entities/seller-profile.entity';
import { SellerStatus } from './enums/seller-status.enum';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(SellerProfile)
    private readonly sellerRepo: Repository<SellerProfile>,
  ) {}

  findByUserId(userId: string): Promise<SellerProfile | null> {
    return this.sellerRepo.findOne({ where: { userId } });
  }

  findBySlug(slug: string): Promise<SellerProfile | null> {
    return this.sellerRepo.findOne({ where: { storeSlug: slug } });
  }

  async approve(id: string): Promise<SellerProfile> {
    const seller = await this.sellerRepo.findOneBy({ id });
    if (!seller) throw new NotFoundException('Seller not found');
    seller.status = SellerStatus.APPROVED;
    return this.sellerRepo.save(seller);
  }

  async reject(id: string): Promise<SellerProfile> {
    const seller = await this.sellerRepo.findOneBy({ id });
    if (!seller) throw new NotFoundException('Seller not found');
    seller.status = SellerStatus.REJECTED;
    return this.sellerRepo.save(seller);
  }

  save(seller: Partial<SellerProfile>): Promise<SellerProfile> {
    return this.sellerRepo.save(seller);
  }

  create(data: Partial<SellerProfile>): SellerProfile {
    return this.sellerRepo.create(data);
  }
}
