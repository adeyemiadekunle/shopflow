import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Hi, is this item still available?' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
