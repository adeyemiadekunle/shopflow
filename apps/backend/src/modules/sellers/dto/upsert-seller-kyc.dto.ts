import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpsertSellerKycDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({ required: false, description: 'Optional for now' })
  @IsOptional()
  @IsString()
  rcNumber?: string;

  @ApiProperty({ required: false, description: 'Optional for now' })
  @IsOptional()
  @IsString()
  bvn?: string;

  @ApiProperty({ required: false, description: 'NIN will be enforced later' })
  @IsOptional()
  @IsString()
  nin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  idDocumentUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lga?: string;

  @ApiProperty({ required: false, description: 'Optional for now' })
  @IsOptional()
  @IsString()
  postcode?: string;

  @ApiProperty({
    required: false,
    description: 'Two-letter ISO country code',
    example: 'NG',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}
