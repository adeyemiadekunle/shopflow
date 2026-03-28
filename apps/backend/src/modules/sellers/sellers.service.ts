import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerProfile } from './entities/seller-profile.entity';
import { SellerStatus } from './enums/seller-status.enum';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { SellerKyc } from './entities/seller-kyc.entity';
import { BankAccount } from './entities/bank-account.entity';
import { UpsertSellerKycDto } from './dto/upsert-seller-kyc.dto';
import { UpsertBankAccountDto } from './dto/upsert-bank-account.dto';
import { PaystackService } from '../payments/paystack.service';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(SellerProfile)
    private readonly sellerRepo: Repository<SellerProfile>,
    @InjectRepository(SellerKyc)
    private readonly sellerKycRepo: Repository<SellerKyc>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepo: Repository<BankAccount>,
    private readonly paystackService: PaystackService,
  ) {}

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  private async generateUniqueStoreSlug(base: string): Promise<string> {
    const normalizedBase = this.slugify(base) || 'seller-store';
    let slug = normalizedBase;
    let attempt = 1;

    while (await this.findBySlug(slug)) {
      slug = `${normalizedBase}-${attempt}`;
      attempt += 1;
    }

    return slug;
  }

  async createForUser(params: {
    userId: string;
    email: string;
    storeName: string;
  }): Promise<SellerProfile> {
    const existing = await this.findByUserId(params.userId);
    if (existing) {
      return existing;
    }

    const storeSlug = await this.generateUniqueStoreSlug(params.storeName);

    return this.sellerRepo.save(
      this.sellerRepo.create({
        userId: params.userId,
        storeName: params.storeName,
        storeSlug,
        supportEmail: params.email,
        status: SellerStatus.PENDING,
      }),
    );
  }

  private normalizeDisplayValue(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeAccountName(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private async getKycBySellerProfileId(
    sellerProfileId: string,
  ): Promise<SellerKyc | null> {
    return this.sellerKycRepo.findOne({ where: { sellerProfileId } });
  }

  private async getPrimaryBankAccount(
    sellerProfileId: string,
  ): Promise<BankAccount | null> {
    return this.bankAccountRepo.findOne({
      where: { sellerProfileId, isPrimary: true },
      order: { updatedAt: 'DESC' },
    });
  }

  private getMissingOnboardingRequirements(params: {
    seller: SellerProfile;
    kyc: SellerKyc | null;
    bankAccount: BankAccount | null;
  }): string[] {
    const { seller, kyc, bankAccount } = params;
    const missing: string[] = [];

    if (!seller.supportPhone?.trim()) missing.push('supportPhone');
    if (!kyc?.businessName?.trim()) missing.push('businessName');
    if (!kyc?.addressLine1?.trim()) missing.push('addressLine1');
    if (!kyc?.state?.trim()) missing.push('state');
    if (!kyc?.lga?.trim()) missing.push('lga');
    if (!kyc?.country?.trim()) missing.push('country');
    if (!bankAccount?.accountName?.trim()) missing.push('accountName');
    if (!bankAccount?.accountNumber?.trim()) missing.push('accountNumber');
    if (!bankAccount?.bankCode?.trim()) missing.push('bankCode');
    if (!bankAccount?.isVerified) missing.push('verifiedBankAccount');

    return missing;
  }

  private async refreshVerificationStatus(
    seller: SellerProfile,
  ): Promise<SellerProfile> {
    const kyc = await this.getKycBySellerProfileId(seller.id);
    const bankAccount = await this.getPrimaryBankAccount(seller.id);
    const missingRequirements = this.getMissingOnboardingRequirements({
      seller,
      kyc,
      bankAccount,
    });

    const shouldBeVerified = missingRequirements.length === 0;
    const nextStatus =
      shouldBeVerified && seller.status === SellerStatus.PENDING
        ? SellerStatus.APPROVED
        : seller.status;

    return this.sellerRepo.save({
      ...seller,
      kycVerified: shouldBeVerified,
      status: nextStatus,
    });
  }

  async getOnboardingStatus(userId: string) {
    const seller = await this.getByUserIdOrThrow(userId);
    const kyc = await this.getKycBySellerProfileId(seller.id);
    const bankAccount = await this.getPrimaryBankAccount(seller.id);
    const missingRequirements = this.getMissingOnboardingRequirements({
      seller,
      kyc,
      bankAccount,
    });

    return {
      sellerProfileId: seller.id,
      status: seller.status,
      emailVerified: true,
      kycVerified: seller.kycVerified,
      canCreateProducts: seller.kycVerified,
      missingRequirements,
      verification: {
        bankAccountVerified: bankAccount?.isVerified ?? false,
        resolvedAccountName: bankAccount?.resolvedAccountName,
        verifiedAt: bankAccount?.verifiedAt,
      },
      profile: seller,
      kyc,
      bankAccount,
    };
  }

  async getByUserIdOrThrow(userId: string): Promise<SellerProfile> {
    const seller = await this.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }
    return seller;
  }

  async updateOwnProfile(
    userId: string,
    dto: UpdateSellerProfileDto,
  ): Promise<SellerProfile> {
    const seller = await this.getByUserIdOrThrow(userId);

    let nextStoreSlug = seller.storeSlug;
    if (dto.storeSlug && dto.storeSlug !== seller.storeSlug) {
      const existingBySlug = await this.findBySlug(dto.storeSlug);
      if (existingBySlug && existingBySlug.id !== seller.id) {
        throw new ConflictException('Store slug is already in use');
      }
      nextStoreSlug = dto.storeSlug;
    }

    const updatedSeller = await this.sellerRepo.save({
      ...seller,
      storeName: dto.storeName?.trim() ?? seller.storeName,
      storeSlug: nextStoreSlug,
      bio: dto.bio ?? seller.bio,
      logoUrl: dto.logoUrl ?? seller.logoUrl,
      bannerUrl: dto.bannerUrl ?? seller.bannerUrl,
      supportEmail:
        dto.supportEmail?.trim().toLowerCase() ?? seller.supportEmail,
      supportPhone: dto.supportPhone?.trim() ?? seller.supportPhone,
    });

    return this.refreshVerificationStatus(updatedSeller);
  }

  async upsertKyc(userId: string, dto: UpsertSellerKycDto): Promise<SellerKyc> {
    const seller = await this.getByUserIdOrThrow(userId);
    const existing = await this.getKycBySellerProfileId(seller.id);

    const saved = await this.sellerKycRepo.save({
      ...(existing ?? { sellerProfileId: seller.id }),
      businessName: this.normalizeDisplayValue(dto.businessName),
      businessType: this.normalizeDisplayValue(dto.businessType),
      rcNumber: this.normalizeDisplayValue(dto.rcNumber),
      bvn: this.normalizeDisplayValue(dto.bvn),
      nin: this.normalizeDisplayValue(dto.nin),
      idDocumentUrl: this.normalizeDisplayValue(dto.idDocumentUrl),
      addressLine1: this.normalizeDisplayValue(dto.addressLine1),
      addressLine2: this.normalizeDisplayValue(dto.addressLine2),
      state: this.normalizeDisplayValue(dto.state),
      lga: this.normalizeDisplayValue(dto.lga),
      postcode: this.normalizeDisplayValue(dto.postcode),
      country: this.normalizeDisplayValue(dto.country)?.toUpperCase(),
    });

    await this.refreshVerificationStatus(seller);
    return saved;
  }

  async upsertPrimaryBankAccount(
    userId: string,
    dto: UpsertBankAccountDto,
  ): Promise<BankAccount> {
    const seller = await this.getByUserIdOrThrow(userId);
    const existingPrimary = await this.getPrimaryBankAccount(seller.id);

    let isVerified = false;
    let resolvedAccountName: string | undefined;
    let verifiedAt: Date | undefined;

    const normalizedBankCode = this.normalizeDisplayValue(dto.bankCode);
    const normalizedAccountNumber = dto.accountNumber.trim();
    const normalizedAccountName = dto.accountName.trim();

    if (normalizedBankCode) {
      const resolved = await this.paystackService.resolveAccountNumber({
        accountNumber: normalizedAccountNumber,
        bankCode: normalizedBankCode,
      });

      resolvedAccountName = resolved.account_name;
      isVerified =
        this.normalizeAccountName(resolved.account_name) ===
        this.normalizeAccountName(normalizedAccountName);
      verifiedAt = isVerified ? new Date() : undefined;
    }

    const saved = await this.bankAccountRepo.save({
      ...(existingPrimary ?? { sellerProfileId: seller.id }),
      sellerProfileId: seller.id,
      bankCode: normalizedBankCode,
      bankName: dto.bankName.trim(),
      accountNumber: normalizedAccountNumber,
      accountName: normalizedAccountName,
      isPrimary: dto.isPrimary ?? true,
      isVerified,
      resolvedAccountName,
      verifiedAt,
    });

    await this.refreshVerificationStatus(seller);
    return saved;
  }

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
