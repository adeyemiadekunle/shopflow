import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class DeliveryAddressDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  addressLine1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  state!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  lga!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postcode?: string;

  @ApiProperty({ example: 'NG' })
  @IsString()
  @Matches(/^[A-Z]{2}$/u, {
    message: 'country must be a 2-letter uppercase code.',
  })
  country!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  recipientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  recipientPhone?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional({ type: DeliveryAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deliveryAddressId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  billingAddressId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  useDeliveryAddressForBilling?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerNote?: string;
}

export class SendDeliveryQuoteDto {
  @ApiProperty({ example: 2500 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  feeAmount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerNote?: string;
}

export class RespondToQuoteDto {
  @ApiProperty({ description: 'true to accept the quote, false to decline it' })
  @Type(() => Boolean)
  @IsBoolean()
  accept!: boolean;
}

export class UpdateOrderProgressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class OpenDisputeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  reason!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}

export enum ResolveDisputeOutcome {
  BUYER = 'buyer',
  SELLER = 'seller',
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ResolveDisputeOutcome })
  @IsEnum(ResolveDisputeOutcome)
  outcome!: ResolveDisputeOutcome;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNotes?: string;
}
