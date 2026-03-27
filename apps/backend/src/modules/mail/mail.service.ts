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
    this.from = this.config.get<string>('mail.from') ?? 'no-reply@rands.local';
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
    const subject = 'Verify your Rands account';
    const text =
      `Verify your Rands account by clicking this link:\n\n${verifyUrl}\n\n` +
      'If you did not create this account, you can ignore this email.';

    await this.sendOrLog(email, subject, text);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendBaseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const subject = 'Reset your Rands password';
    const text =
      `Reset your Rands password by clicking this link:\n\n${resetUrl}\n\n` +
      'If you did not request a password reset, you can ignore this email.';

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
