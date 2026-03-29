import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsUrl, Length } from 'class-validator';

export class InitializeSubscriptionCheckoutDto {
  @ApiProperty({
    required: false,
    description: 'Optional callback URL for Paystack redirect after checkout',
  })
  @IsOptional()
  @IsUrl({
    require_tld: false,
  })
  callbackUrl?: string;

  @ApiProperty({
    required: false,
    description:
      'Optional idempotency key to safely retry subscription checkout initialization',
  })
  @IsOptional()
  @IsString()
  @Length(8, 200)
  idempotencyKey?: string;
}

export class VerifySubscriptionPaymentDto {
  @ApiProperty({
    description: 'Paystack transaction reference returned from checkout init',
  })
  @IsString()
  @Length(5, 100)
  reference!: string;
}

export class ChangeSellerTierDto {
  @ApiProperty({
    description: 'Target subscription tier ID',
  })
  @IsUUID()
  tierId!: string;
}
