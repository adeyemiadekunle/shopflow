import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class BuyerAddressInputDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  label!: string;

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

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  useForDelivery?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  useForBilling?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefaultDelivery?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefaultBilling?: boolean;
}

export class CreateBuyerAddressDto extends BuyerAddressInputDto {}

export class UpdateBuyerAddressDto extends PartialType(BuyerAddressInputDto) {}

export class SetDefaultAddressDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  delivery?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  billing?: boolean;
}

export class ResolveSavedAddressDto {
  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsUUID()
  deliveryAddressId?: string;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsUUID()
  billingAddressId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  useDeliveryAddressForBilling?: boolean;
}
