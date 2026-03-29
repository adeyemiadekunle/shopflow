import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { MediaAssetDto, UploadMediaType } from '../../media/dto/media.dto';

export class CreateFeedPostMediaDto extends MediaAssetDto {
  @ApiPropertyOptional({ enum: UploadMediaType, default: UploadMediaType.IMAGE })
  @IsEnum(UploadMediaType)
  declare type: UploadMediaType;
}

export class CreateFeedPostDto {
  @ApiProperty({ example: 'Just dropped new ankara prints! 🔥' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ example: ['https://cdn.rands.ng/feed/img1.webp'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional({ type: [CreateFeedPostMediaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFeedPostMediaDto)
  media?: CreateFeedPostMediaDto[];

  @ApiPropertyOptional({ description: 'Tag a product from your catalog' })
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Love this! How much is it?' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
