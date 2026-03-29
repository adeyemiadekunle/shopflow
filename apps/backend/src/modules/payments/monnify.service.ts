import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface MonnifyInitializeTransactionResponse {
  checkoutUrl: string;
  transactionReference: string;
  paymentReference: string;
}

export interface MonnifyTransactionStatusResponse {
  transactionReference: string;
  paymentReference: string;
  paymentStatus: string;
  amountPaid?: string;
  totalPayable?: string;
  currencyCode?: string;
  paidOn?: string;
  paymentMethod?: string;
  transactionDescription?: string;
  metaData?: Record<string, unknown>;
}

export interface MonnifySingleTransferResponse {
  amount: number;
  reference: string;
  status: string;
  transactionReference?: string;
  destinationAccountName?: string;
  destinationBankName?: string;
  destinationAccountNumber?: string;
  destinationBankCode?: string;
  totalFee?: number;
}

export interface MonnifyBulkTransferItem {
  amount: number;
  reference: string;
  narration: string;
  destinationBankCode: string;
  destinationAccountNumber: string;
  currency: string;
}

export interface MonnifyBulkTransferResponse {
  batchReference: string;
  totalAmount?: number;
  totalFee?: number;
  batchStatus?: string;
  message?: string;
}

export interface MonnifyRefundResponse {
  refundReference: string;
  transactionReference: string;
  refundReason: string;
  customerNote?: string;
  refundAmount: number;
  refundType?: string;
  refundStatus: string;
  refundStrategy?: string;
  comment?: string;
  completedOn?: string;
  createdOn?: string;
}

type MonnifyWrappedResponse<T> = {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: T;
};

@Injectable()
export class MonnifyService {
  private readonly logger = new Logger(MonnifyService.name);
  private readonly http: AxiosInstance;
  private accessToken?: string;
  private accessTokenExpiresAt?: number;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL:
        this.config.get<string>('monnify.baseUrl') ?? 'https://api.monnify.com',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private getBasicAuthToken(): string {
    const apiKey = this.config.get<string>('monnify.apiKey') ?? '';
    const secretKey = this.config.get<string>('monnify.secretKey') ?? '';
    return Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (
      this.accessToken &&
      this.accessTokenExpiresAt &&
      this.accessTokenExpiresAt > now + 60_000
    ) {
      return this.accessToken;
    }

    const { data } = await this.http.post<
      MonnifyWrappedResponse<{ accessToken: string; expiresIn: number }>
    >(
      '/api/v1/auth/login',
      {},
      {
        headers: {
          Authorization: `Basic ${this.getBasicAuthToken()}`,
        },
      },
    );

    this.accessToken = data.responseBody.accessToken;
    this.accessTokenExpiresAt = now + data.responseBody.expiresIn * 1000;

    return this.accessToken;
  }

  private async authorizedPost<T>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const { data } = await this.http.post<MonnifyWrappedResponse<T>>(path, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!data.requestSuccessful) {
      this.logger.warn(`Monnify request failed for ${path}: ${data.responseMessage}`);
    }

    return data.responseBody;
  }

  private async authorizedGet<T>(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const { data } = await this.http.get<MonnifyWrappedResponse<T>>(path, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });

    if (!data.requestSuccessful) {
      this.logger.warn(`Monnify request failed for ${path}: ${data.responseMessage}`);
    }

    return data.responseBody;
  }

  async initializeTransaction(params: {
    amount: number;
    currencyCode: string;
    paymentReference: string;
    customerName: string;
    customerEmail: string;
    paymentDescription: string;
    redirectUrl?: string;
    paymentMethods?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<MonnifyInitializeTransactionResponse> {
    const contractCode = this.config.get<string>('monnify.contractCode') ?? '';

    return this.authorizedPost(
      '/api/v1/merchant/transactions/init-transaction',
      {
        amount: params.amount,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        paymentReference: params.paymentReference,
        paymentDescription: params.paymentDescription,
        currencyCode: params.currencyCode,
        contractCode,
        redirectUrl: params.redirectUrl,
        paymentMethods: params.paymentMethods,
        metaData: params.metadata,
      },
    );
  }

  async getTransactionStatus(params: {
    transactionReference?: string;
    paymentReference?: string;
  }): Promise<MonnifyTransactionStatusResponse> {
    return this.authorizedGet('/api/v2/merchant/transactions/query', {
      ...(params.transactionReference
        ? { transactionReference: params.transactionReference }
        : {}),
      ...(params.paymentReference
        ? { paymentReference: params.paymentReference }
        : {}),
    });
  }

  async initiateSingleTransfer(params: {
    amount: number;
    reference: string;
    narration: string;
    destinationBankCode: string;
    destinationAccountNumber: string;
    currency: string;
    async?: boolean;
  }): Promise<MonnifySingleTransferResponse> {
    const sourceAccountNumber =
      this.config.get<string>('monnify.walletAccountNumber') ?? '';

    return this.authorizedPost('/api/v2/disbursements/single', {
      amount: params.amount,
      reference: params.reference,
      narration: params.narration,
      destinationBankCode: params.destinationBankCode,
      destinationAccountNumber: params.destinationAccountNumber,
      currency: params.currency,
      sourceAccountNumber,
      ...(params.async !== undefined ? { async: params.async } : {}),
    });
  }

  async initiateBulkTransfer(params: {
    title: string;
    batchReference: string;
    narration: string;
    onValidationFailure?: 'BREAK' | 'CONTINUE';
    notificationInterval?: number;
    transactionList: MonnifyBulkTransferItem[];
  }): Promise<MonnifyBulkTransferResponse> {
    const sourceAccountNumber =
      this.config.get<string>('monnify.walletAccountNumber') ?? '';

    return this.authorizedPost('/api/v2/disbursements/batch', {
      title: params.title,
      batchReference: params.batchReference,
      narration: params.narration,
      sourceAccountNumber,
      onValidationFailure: params.onValidationFailure ?? 'CONTINUE',
      ...(params.notificationInterval !== undefined
        ? { notificationInterval: params.notificationInterval }
        : {}),
      transactionList: params.transactionList.map((transaction) => ({
        amount: transaction.amount,
        reference: transaction.reference,
        narration: transaction.narration,
        destinationBankCode: transaction.destinationBankCode,
        destinationAccountNumber: transaction.destinationAccountNumber,
        currency: transaction.currency,
      })),
    });
  }

  async createRefund(params: {
    transactionReference: string;
    refundAmount: number;
    refundReference: string;
    refundReason: string;
    customerNote: string;
    destinationAccountNumber?: string;
    destinationAccountBankCode?: string;
  }): Promise<MonnifyRefundResponse> {
    return this.authorizedPost('/api/v1/refunds/initiate-refund', {
      transactionReference: params.transactionReference,
      refundAmount: params.refundAmount,
      refundReference: params.refundReference,
      refundReason: params.refundReason,
      customerNote: params.customerNote,
      ...(params.destinationAccountNumber
        ? { destinationAccountNumber: params.destinationAccountNumber }
        : {}),
      ...(params.destinationAccountBankCode
        ? {
            destinationAccountBankCode: params.destinationAccountBankCode,
          }
        : {}),
    });
  }

  async getRefundStatus(refundReference: string): Promise<MonnifyRefundResponse> {
    return this.authorizedGet(`/api/v1/refunds/${refundReference}`);
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secretKey = this.config.get<string>('monnify.secretKey') ?? '';
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');
    const normalizedSignature = signature?.trim().toLowerCase();
    const isValid = hash === normalizedSignature;

    if (!isValid) {
      this.logger.warn('Invalid Monnify webhook signature received');
    }

    return isValid;
  }
}
