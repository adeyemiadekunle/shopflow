import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateMediaUploadDto } from './dto/media.dto';
import { MediaService } from './media.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary:
      'Create a presigned S3 upload URL for seller catalog or feed media and return the public CloudFront URL',
  })
  createUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMediaUploadDto,
  ) {
    return this.mediaService.createUploadUrl(user, dto);
  }
}
