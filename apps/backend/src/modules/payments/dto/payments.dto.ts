import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

const PAYSTACK_CHANNELS = [
  'card',
  'bank',
  'apple_pay',
  'ussd',
  'qr',
  'mobile_money',
  'bank_transfer',
  'eft',
  'payattitude',
] as const;

export type PaystackCheckoutChannel = (typeof PAYSTACK_CHANNELS)[number];

export class InitializeCheckoutDto {
  @ApiPropertyOptional({
    type: [String],
    description:
      'Optional Paystack checkout channels to expose for this transaction.',
    example: ['card', 'bank_transfer'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(PAYSTACK_CHANNELS, { each: true })
  channels?: PaystackCheckoutChannel[];

  @ApiPropertyOptional({
    description:
      'Optional idempotency key from the client to safely retry checkout initialization.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description:
      'Optional callback URL to override the Paystack dashboard callback for this transaction.',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  callbackUrl?: string;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  reference!: string;
}
