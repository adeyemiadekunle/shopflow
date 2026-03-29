import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum MediaUsage {
  CATALOG_PRODUCT = 'catalog_product',
  FEED_POST = 'feed_post',
}

export enum UploadMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export class CreateMediaUploadDto {
  @ApiProperty({ enum: MediaUsage })
  @IsEnum(MediaUsage)
  usage!: MediaUsage;

  @ApiProperty({ enum: UploadMediaType, default: UploadMediaType.IMAGE })
  @IsEnum(UploadMediaType)
  mediaType!: UploadMediaType;

  @ApiProperty({ example: 'ankara-lookbook-1.webp' })
  @IsString()
  @MaxLength(200)
  fileName!: string;

  @ApiProperty({ example: 'image/webp' })
  @IsString()
  @MaxLength(120)
  contentType!: string;

  @ApiPropertyOptional({ description: 'Optional product context for product media uploads' })
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class MediaAssetDto {
  @ApiProperty({ enum: UploadMediaType, default: UploadMediaType.IMAGE })
  @IsEnum(UploadMediaType)
  type!: UploadMediaType;

  @ApiProperty()
  @IsString()
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cdnKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50_000_000)
  sizeBytes?: number;
}
