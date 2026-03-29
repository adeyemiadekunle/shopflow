import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
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

export interface PaystackTransferRecipientResponse {
  recipient_code: string;
  type: string;
  name: string;
  details?: Record<string, unknown>;
}

export interface PaystackTransferResponse {
  id?: number;
  transfer_code?: string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  recipient?: {
    recipient_code?: string;
    type?: string;
    name?: string;
  };
}

export interface PaystackRefundResponse {
  id?: number;
  transaction?: number | Record<string, unknown>;
  amount: number;
  currency: string;
  status: string;
  customer_note?: string;
  merchant_note?: string;
  reason?: string;
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
    metadata?: Record<string, unknown>;
  }): Promise<PaystackInitResponse> {
    const { data } = await this.http.post('/transaction/initialize', {
      email: params.email,
      amount: params.amountKobo,
      currency: params.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: params.channels,
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

  async createRefund(params: {
    transaction: string;
    amountKobo?: number;
    currency?: string;
    customerNote?: string;
    merchantNote?: string;
  }): Promise<PaystackRefundResponse> {
    const { data } = await this.http.post('/refund', {
      transaction: params.transaction,
      ...(params.amountKobo !== undefined && { amount: params.amountKobo }),
      ...(params.currency !== undefined && { currency: params.currency }),
      ...(params.customerNote ? { customer_note: params.customerNote } : {}),
      ...(params.merchantNote ? { merchant_note: params.merchantNote } : {}),
    });
    return data.data as PaystackRefundResponse;
  }

  async retryRefundWithCustomerDetails(params: {
    refundId: number;
    currency: string;
    accountNumber: string;
    bankId: string;
  }): Promise<PaystackRefundResponse> {
    const { data } = await this.http.post(
      `/refund/retry_with_customer_details/${params.refundId}`,
      {
        refund_account_details: {
          currency: params.currency,
          account_number: params.accountNumber,
          bank_id: params.bankId,
        },
      },
    );
    return data.data as PaystackRefundResponse;
  }

  async createTransferRecipient(params: {
    name: string;
    accountNumber: string;
    bankCode: string;
    currency: string;
  }): Promise<PaystackTransferRecipientResponse> {
    const { data } = await this.http.post('/transferrecipient', {
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: params.currency,
    });
    return data.data as PaystackTransferRecipientResponse;
  }

  async initiateTransfer(params: {
    amountKobo: number;
    recipientCode: string;
    reference: string;
    reason?: string;
  }): Promise<PaystackTransferResponse> {
    const { data } = await this.http.post('/transfer', {
      source: 'balance',
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason,
    });
    return data.data as PaystackTransferResponse;
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
