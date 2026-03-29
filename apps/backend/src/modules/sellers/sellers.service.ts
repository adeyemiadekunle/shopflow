import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SellerProfile } from './entities/seller-profile.entity';
import { SellerStatus } from './enums/seller-status.enum';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { SellerKyc } from './entities/seller-kyc.entity';
import { BankAccount } from './entities/bank-account.entity';
import { UpsertSellerKycDto } from './dto/upsert-seller-kyc.dto';
import { UpsertBankAccountDto } from './dto/upsert-bank-account.dto';
import { PaystackService } from '../payments/paystack.service';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { Payout, PayoutStatus } from '../payouts/entities/payout.entity';
import { Refund, RefundStatus } from '../refunds/entities/refund.entity';
import { LedgerAccount } from '../ledger/entities/ledger-account.entity';
import { LedgerAccountType } from '../ledger/enums/ledger.enum';

type SellerAnalyticsTopProduct = {
  productId: string;
  title: string;
  quantitySold: number;
  revenue: number;
  orderCount: number;
};

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(SellerProfile)
    private readonly sellerRepo: Repository<SellerProfile>,
    @InjectRepository(SellerKyc)
    private readonly sellerKycRepo: Repository<SellerKyc>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepo: Repository<BankAccount>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Payout)
    private readonly payoutRepo: Repository<Payout>,
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    @InjectRepository(LedgerAccount)
    private readonly ledgerAccountRepo: Repository<LedgerAccount>,
    private readonly paystackService: PaystackService,
  ) {}

  private readonly sellerRevenueStatuses = new Set<OrderStatus>([
    OrderStatus.PAID,
    OrderStatus.SELLER_PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED_PENDING_CONFIRMATION,
    OrderStatus.COMPLETED,
    OrderStatus.DISPUTE_OPEN,
    OrderStatus.REFUND_PENDING,
    OrderStatus.REFUNDED,
  ]);

  private readonly sellerPaidStatuses = new Set<OrderStatus>([
    OrderStatus.PAID,
    OrderStatus.SELLER_PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED_PENDING_CONFIRMATION,
    OrderStatus.COMPLETED,
    OrderStatus.DISPUTE_OPEN,
    OrderStatus.REFUND_PENDING,
  ]);

  private sumDecimal(values: Array<number | string | null | undefined>): number {
    return values.reduce<number>(
      (total, value) => total + Number(value ?? 0),
      0,
    );
  }

  private buildTopProducts(orders: Order[]): SellerAnalyticsTopProduct[] {
    const byProduct = new Map<string, SellerAnalyticsTopProduct>();

    for (const order of orders) {
      if (!this.sellerRevenueStatuses.has(order.status)) {
        continue;
      }

      for (const item of order.items ?? []) {
        const snapshot = item.productSnapshot ?? {};
        const title =
          typeof snapshot['title'] === 'string'
            ? snapshot['title']
            : 'Product';
        const current = byProduct.get(item.productId) ?? {
          productId: item.productId,
          title,
          quantitySold: 0,
          revenue: 0,
          orderCount: 0,
        };

        current.quantitySold += Number(item.quantity ?? 0);
        current.revenue += Number(item.lineTotal ?? 0);
        current.orderCount += 1;

        byProduct.set(item.productId, current);
      }
    }

    return Array.from(byProduct.values())
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5);
  }

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

  async getAnalytics(userId: string) {
    const seller = await this.getByUserIdOrThrow(userId);

    const [orders, payouts, refunds, ledgerAccounts] = await Promise.all([
      this.orderRepo.find({
        where: { sellerProfileId: seller.id },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      }),
      this.payoutRepo.find({
        where: { sellerProfileId: seller.id },
        order: { createdAt: 'DESC' },
      }),
      this.refundRepo.find({
        relations: ['order'],
        order: { createdAt: 'DESC' },
      }),
      this.ledgerAccountRepo.find({
        where: {
          ownerId: seller.id,
          type: In([
            LedgerAccountType.SELLER_PENDING,
            LedgerAccountType.SELLER_AVAILABLE,
          ]),
        },
      }),
    ]);

    const sellerRefunds = refunds.filter(
      (refund) => refund.order?.sellerProfileId === seller.id,
    );
    const statusBreakdown = Object.values(OrderStatus).reduce(
      (accumulator, status) => {
        accumulator[status] = 0;
        return accumulator;
      },
      {} as Record<OrderStatus, number>,
    );

    for (const order of orders) {
      statusBreakdown[order.status] += 1;
    }

    const pendingAccount = ledgerAccounts.find(
      (account) => account.type === LedgerAccountType.SELLER_PENDING,
    );
    const availableAccount = ledgerAccounts.find(
      (account) => account.type === LedgerAccountType.SELLER_AVAILABLE,
    );
    const paidOrders = orders.filter((order) =>
      this.sellerPaidStatuses.has(order.status),
    );
    const grossSales = this.sumDecimal(
      orders
        .filter((order) => this.sellerRevenueStatuses.has(order.status))
        .map((order) => order.totalAmount),
    );
    const totalRefunds = this.sumDecimal(
      sellerRefunds
        .filter((refund) => refund.status === RefundStatus.PROCESSED)
        .map((refund) => refund.amount),
    );
    const totalPayouts = this.sumDecimal(
      payouts
        .filter((payout) => payout.status === PayoutStatus.SUCCEEDED)
        .map((payout) => payout.amount),
    );
    const recentOrders = orders.slice(0, 5).map((order) => ({
      id: order.id,
      orderReference: order.orderReference,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      deliveredAt: order.deliveredAt,
    }));
    const recentPayouts = payouts.slice(0, 5).map((payout) => ({
      id: payout.id,
      reference: payout.reference,
      status: payout.status,
      amount: Number(payout.amount),
      currency: payout.currency,
      createdAt: payout.createdAt,
      processedAt: payout.processedAt,
    }));
    const recentRefunds = sellerRefunds.slice(0, 5).map((refund) => ({
      id: refund.id,
      orderId: refund.orderId,
      status: refund.status,
      amount: Number(refund.amount),
      currency: refund.currency,
      createdAt: refund.createdAt,
      processedAt: refund.processedAt,
    }));

    return {
      sellerProfileId: seller.id,
      storeName: seller.storeName,
      storeSlug: seller.storeSlug,
      currency:
        orders[0]?.currency ??
        payouts[0]?.currency ??
        sellerRefunds[0]?.currency ??
        'NGN',
      overview: {
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        completedOrders: statusBreakdown[OrderStatus.COMPLETED],
        cancelledOrders: statusBreakdown[OrderStatus.CANCELLED],
        openDisputes: statusBreakdown[OrderStatus.DISPUTE_OPEN],
        refundedOrders: statusBreakdown[OrderStatus.REFUNDED],
        grossSales,
        totalRefunds,
        totalPayouts,
        pendingFunds: Number(pendingAccount?.balance ?? 0),
        availableFunds: Number(availableAccount?.balance ?? 0),
      },
      orderStatusBreakdown: statusBreakdown,
      topProducts: this.buildTopProducts(orders),
      recentOrders,
      recentPayouts,
      recentRefunds,
    };
  }

  async getByUserIdOrThrow(userId: string): Promise<SellerProfile> {
    const seller = await this.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }
    return seller;
  }

  async assertCanManageProducts(userId: string): Promise<SellerProfile> {
    const onboarding = await this.getOnboardingStatus(userId);
    const seller = onboarding.profile;

    if (seller.status === SellerStatus.SUSPENDED) {
      throw new ForbiddenException('Seller account is suspended');
    }

    if (seller.status === SellerStatus.REJECTED) {
      throw new ForbiddenException('Seller account is restricted');
    }

    if (!onboarding.canCreateProducts) {
      const missingFields = onboarding.missingRequirements.join(', ');
      throw new ForbiddenException(
        missingFields
          ? `Complete seller onboarding before managing products: ${missingFields}`
          : 'Complete seller onboarding before managing products',
      );
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
