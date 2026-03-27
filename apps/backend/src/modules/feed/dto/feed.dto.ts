import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

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
