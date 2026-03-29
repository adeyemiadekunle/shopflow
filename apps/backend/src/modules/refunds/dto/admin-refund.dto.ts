import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRefundDto {
  @ApiProperty()
  @IsUUID()
  orderId!: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNote?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  destinationAccountNumber?: string;

  @ApiPropertyOptional({ example: '050' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  destinationBankCode?: string;
}

export class RetryRefundWithBuyerDetailsDto {
  @ApiProperty({ example: '9' })
  @IsString()
  @MaxLength(50)
  bankId!: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @MaxLength(20)
  accountNumber!: string;

  @ApiProperty({ example: 'NGN' })
  @IsString()
  @Matches(/^[A-Z]{3}$/u, {
    message: 'currency must be a 3-letter uppercase code.',
  })
  currency!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  accountName?: string;
}
