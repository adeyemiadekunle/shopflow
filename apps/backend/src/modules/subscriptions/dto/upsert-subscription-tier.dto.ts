import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionTierName } from '../enums/subscription.enum';
import type { TierFeatures } from '../types/tier-features.interface';

/** Full create/replace DTO for a subscription tier — admin only */
export class UpsertSubscriptionTierDto {
  @ApiProperty({
    enum: SubscriptionTierName,
    description: 'Unique tier identifier',
  })
  @IsEnum(SubscriptionTierName)
  name!: SubscriptionTierName;

  @ApiProperty({ example: 'Basic', description: 'Human-readable tier label' })
  @IsString()
  displayName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 5000,
    description: 'Monthly price — set to 0 for free tier',
  })
  @IsNumber()
  @Min(0)
  monthlyPrice!: number;

  @ApiProperty({
    example: 'NGN',
    description: 'ISO 4217 currency code (e.g. NGN, USD). Controlled by admin.',
  })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ description: 'Feature flags and limits for this tier' })
  @IsObject()
  features!: TierFeatures;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ default: 0, description: 'Display ordering (ascending)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

/** Partial update DTO */
export class UpdateSubscriptionTierDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @ApiProperty({ required: false, example: 'NGN' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  features?: Partial<TierFeatures>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
