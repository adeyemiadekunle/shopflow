import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateSellerProfileDto {
  @ApiProperty({ required: false, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  storeName?: string;

  @ApiProperty({
    required: false,
    description:
      'Public storefront slug. Lowercase letters, numbers, and hyphens only.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'storeSlug can only contain lowercase letters, numbers, and hyphens.',
  })
  storeSlug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  supportPhone?: string;
}
