import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpsertBankAccountDto {
  @ApiProperty({ required: false, description: 'Optional for now' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bankCode?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  bankName!: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @Matches(/^\d+$/, { message: 'accountNumber must contain digits only.' })
  accountNumber!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(300)
  accountName!: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
