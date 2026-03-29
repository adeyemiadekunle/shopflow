import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  CreateMediaUploadDto,
  MediaUsage,
  UploadMediaType,
} from './dto/media.dto';

const IMAGE_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const VIDEO_CONTENT_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

@Injectable()
export class MediaService {
  private readonly s3: S3Client;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      region: this.config.get<string>('media.awsRegion'),
      credentials:
        this.config.get<string>('media.accessKeyId') &&
        this.config.get<string>('media.secretAccessKey')
          ? {
              accessKeyId: this.config.get<string>('media.accessKeyId') ?? '',
              secretAccessKey:
                this.config.get<string>('media.secretAccessKey') ?? '',
            }
          : undefined,
    });
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-');
  }

  private assertSellerContext(user: AuthenticatedUser): void {
    if (user.role !== 'seller' || !user.sellerProfileId) {
      throw new ForbiddenException(
        'Only sellers with an active seller profile can upload catalog or feed media',
      );
    }
  }

  private validateContentType(mediaType: UploadMediaType, contentType: string) {
    const normalized = contentType.trim().toLowerCase();
    const allowVideo =
      this.config.get<boolean>('media.allowVideoUploads') ?? true;

    if (mediaType === UploadMediaType.IMAGE) {
      if (!IMAGE_CONTENT_TYPES.has(normalized)) {
        throw new BadRequestException(
          `Unsupported image content type: ${contentType}`,
        );
      }
      return normalized;
    }

    if (!allowVideo) {
      throw new BadRequestException('Video uploads are currently disabled');
    }

    if (!VIDEO_CONTENT_TYPES.has(normalized)) {
      throw new BadRequestException(
        `Unsupported video content type: ${contentType}`,
      );
    }

    return normalized;
  }

  private buildObjectKey(
    sellerProfileId: string,
    dto: CreateMediaUploadDto,
  ): string {
    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const usagePrefix =
      dto.usage === MediaUsage.CATALOG_PRODUCT ? 'catalog' : 'feed';
    const sanitizedName = this.sanitizeFileName(dto.fileName);
    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    return [
      usagePrefix,
      sellerProfileId,
      year,
      month,
      day,
      `${uniquePrefix}-${sanitizedName}`,
    ].join('/');
  }

  async createUploadUrl(
    user: AuthenticatedUser,
    dto: CreateMediaUploadDto,
  ) {
    this.assertSellerContext(user);

    const bucket = this.config.get<string>('media.bucket');
    const cloudfrontBaseUrl = this.config.get<string>('media.cloudfrontBaseUrl');
    const expiresInSeconds =
      this.config.get<number>('media.presignExpiresInSeconds') ?? 900;

    if (!bucket || !cloudfrontBaseUrl) {
      throw new BadRequestException(
        'Media storage is not configured yet. Set the S3 bucket and CloudFront base URL first.',
      );
    }

    const contentType = this.validateContentType(dto.mediaType, dto.contentType);
    const objectKey = this.buildObjectKey(user.sellerProfileId!, dto);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      bucket,
      objectKey,
      uploadUrl,
      publicUrl: `${cloudfrontBaseUrl.replace(/\/$/, '')}/${objectKey}`,
      headers: {
        'Content-Type': contentType,
      },
      expiresInSeconds,
      mediaType: dto.mediaType,
      usage: dto.usage,
    };
  }

  isAllowedPublicUrl(url: string): boolean {
    const cloudfrontBaseUrl = this.config.get<string>('media.cloudfrontBaseUrl');
    if (!cloudfrontBaseUrl) {
      return true;
    }

    return url.startsWith(cloudfrontBaseUrl.replace(/\/$/, ''));
  }
}
