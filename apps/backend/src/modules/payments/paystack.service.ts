import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackPlanResponse {
  id: number;
  plan_code: string;
  name: string;
  amount: number;
  interval: string;
  currency: string;
}

export interface PaystackVerifyResponse {
  status: string; // 'success' | 'failed' | 'abandoned'
  reference: string;
  amount: number; // in kobo
  currency: string;
  paid_at: string;
  channel: string;
  metadata: Record<string, unknown>;
  customer?: {
    customer_code?: string;
    email?: string;
  };
  plan?: {
    plan_code?: string;
    name?: string;
  };
  subscription?: {
    subscription_code?: string;
    email_token?: string;
    next_payment_date?: string;
  };
  authorization: {
    authorization_code: string;
    card_type: string;
    last4: string;
    bank: string;
  };
}

export interface PaystackResolveAccountResponse {
  account_number: string;
  account_name: string;
  bank_id?: number;
}

@Injectable()
export class PaystackService {
  private readonly http: AxiosInstance;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(PaystackService.name);

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('paystack.secretKey') ?? '';
    this.webhookSecret =
      this.config.get<string>('paystack.webhookSecret') ?? '';

    this.http = axios.create({
      baseURL:
        this.config.get<string>('paystack.baseUrl') ??
        'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async initializeTransaction(params: {
    email: string;
    amountKobo: number;
    currency: string;
    reference: string;
    callbackUrl?: string;
    channels?: string[];
    orderId?: string;
    buyerId?: string;
    sellerProfileId?: string;
    planCode?: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaystackInitResponse> {
    const { data } = await this.http.post('/transaction/initialize', {
      email: params.email,
      amount: params.amountKobo,
      currency: params.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: params.channels,
      plan: params.planCode,
      metadata: {
        ...(params.orderId ? { order_id: params.orderId } : {}),
        ...(params.buyerId ? { buyer_id: params.buyerId } : {}),
        ...(params.sellerProfileId
          ? { seller_profile_id: params.sellerProfileId }
          : {}),
        ...params.metadata,
      },
    });
    return data.data as PaystackInitResponse;
  }

  async createPlan(params: {
    name: string;
    amountKobo: number;
    interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually';
    currency: string;
    description?: string;
  }): Promise<PaystackPlanResponse> {
    const { data } = await this.http.post('/plan', {
      name: params.name,
      amount: params.amountKobo,
      interval: params.interval,
      currency: params.currency,
      description: params.description,
    });
    return data.data as PaystackPlanResponse;
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const { data } = await this.http.get(`/transaction/verify/${reference}`);
    return data.data as PaystackVerifyResponse;
  }

  async resolveAccountNumber(params: {
    accountNumber: string;
    bankCode: string;
  }): Promise<PaystackResolveAccountResponse> {
    const { data } = await this.http.get('/bank/resolve', {
      params: {
        account_number: params.accountNumber,
        bank_code: params.bankCode,
      },
    });
    return data.data as PaystackResolveAccountResponse;
  }

  async refund(transactionId: string, amountKobo?: number): Promise<unknown> {
    const { data } = await this.http.post('/refund', {
      transaction: transactionId,
      ...(amountKobo !== undefined && { amount: amountKobo }),
    });
    return data.data;
  }

  async disableSubscription(params: {
    code: string;
    token: string;
  }): Promise<unknown> {
    const { data } = await this.http.post('/subscription/disable', {
      code: params.code,
      token: params.token,
    });
    return data.data;
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    const isValid = hash === signature;
    if (!isValid) {
      this.logger.warn('Invalid Paystack webhook signature received');
    }
    return isValid;
  }
}
