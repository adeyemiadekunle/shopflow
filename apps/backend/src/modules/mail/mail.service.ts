import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly from: string;
  private readonly frontendBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('mail.from') ?? 'no-reply@shopflow.local';
    this.frontendBaseUrl =
      this.config.get<string>('mail.frontendBaseUrl') ??
      'http://localhost:3001';

    const smtpHost = this.config.get<string>('mail.smtpHost');
    const smtpPort = this.config.get<number>('mail.smtpPort') ?? 587;
    const smtpUser = this.config.get<string>('mail.smtpUser');
    const smtpPass = this.config.get<string>('mail.smtpPass');
    const smtpSecure = this.config.get<boolean>('mail.smtpSecure') ?? false;

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.frontendBaseUrl}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const subject = 'Verify your Shopflow account';
    const text =
      `Verify your Shopflow account by clicking this link:\n\n${verifyUrl}\n\n` +
      'If you did not create this account, you can ignore this email.';

    await this.sendOrLog(email, subject, text);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendBaseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const subject = 'Reset your Shopflow password';
    const text =
      `Reset your Shopflow password by clicking this link:\n\n${resetUrl}\n\n` +
      'If you did not request a password reset, you can ignore this email.';

    await this.sendOrLog(email, subject, text);
  }

  async sendSellerOrderCreatedEmail(
    email: string,
    params: {
      orderReference: string;
      storeName: string;
      totalAmount: number;
      currency: string;
    },
  ): Promise<void> {
    const subject = `New order received: ${params.orderReference}`;
    const text =
      `A new order has been created for ${params.storeName}.\n\n` +
      `Order reference: ${params.orderReference}\n` +
      `Buyer payable total: ${params.currency} ${params.totalAmount.toFixed(2)}\n\n` +
      'Open your seller dashboard to review the order and send a delivery quote.';

    await this.sendOrLog(email, subject, text);
  }

  async sendSellerQuoteReminderEmail(
    email: string,
    params: {
      orderReference: string;
      storeName: string;
    },
  ): Promise<void> {
    const subject = `Reminder: send delivery quote for ${params.orderReference}`;
    const text =
      `Order ${params.orderReference} for ${params.storeName} is still awaiting a delivery quote.\n\n` +
      'Open your seller dashboard to send the quote before the order expires automatically.';

    await this.sendOrLog(email, subject, text);
  }

  async sendBuyerDeliveryQuoteEmail(
    email: string,
    params: {
      orderReference: string;
      feeAmount: number;
      totalAmount: number;
      currency: string;
    },
  ): Promise<void> {
    const subject = `Delivery quote ready for ${params.orderReference}`;
    const text =
      `A delivery quote is now available for your order ${params.orderReference}.\n\n` +
      `Delivery fee: ${params.currency} ${params.feeAmount.toFixed(2)}\n` +
      `Updated buyer total: ${params.currency} ${params.totalAmount.toFixed(2)}\n\n` +
      'Open your buyer dashboard to accept or decline the quote.';

    await this.sendOrLog(email, subject, text);
  }

  async sendBuyerQuoteResponseReminderEmail(
    email: string,
    params: {
      orderReference: string;
      totalAmount: number;
      currency: string;
    },
  ): Promise<void> {
    const subject = `Reminder: respond to quote for ${params.orderReference}`;
    const text =
      `Your order ${params.orderReference} is still waiting for your delivery quote response.\n\n` +
      `Current buyer total: ${params.currency} ${params.totalAmount.toFixed(2)}\n\n` +
      'Please accept or decline the quote before the order expires automatically.';

    await this.sendOrLog(email, subject, text);
  }

  async sendSellerQuoteResponseEmail(
    email: string,
    params: {
      orderReference: string;
      accepted: boolean;
    },
  ): Promise<void> {
    const subject = `Buyer ${params.accepted ? 'accepted' : 'declined'} quote for ${params.orderReference}`;
    const text =
      `The buyer has ${params.accepted ? 'accepted' : 'declined'} the delivery quote for order ${params.orderReference}.\n\n` +
      (params.accepted
        ? 'You can now continue preparing the order for payment confirmation and fulfilment.'
        : 'You can review the order and decide whether to follow up with the buyer.');

    await this.sendOrLog(email, subject, text);
  }

  private async sendOrLog(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured. Email to ${to} was logged instead of sent.\nSubject: ${subject}\n${text}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      text,
    });
  }
}
