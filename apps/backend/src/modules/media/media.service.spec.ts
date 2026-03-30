import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { MediaService } from './media.service';
import { CreateMediaUploadDto, MediaUsage, UploadMediaType } from './dto/media.dto';

describe('MediaService', () => {
  let service: MediaService;

  const configValues = new Map<string, unknown>([
    ['media.awsRegion', 'eu-west-2'],
    ['media.bucket', 'shopflow-media-bucket'],
    ['media.cloudfrontBaseUrl', 'https://cdn.shopflow.test'],
    ['media.presignExpiresInSeconds', 900],
    ['media.allowVideoUploads', true],
    ['media.accessKeyId', 'test-access-key-id'],
    ['media.secretAccessKey', 'test-secret-access-key'],
  ]);

  const mockPlatformConfigService = {
    getBoolean: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => configValues.get(key),
          },
        },
        { provide: PlatformConfigService, useValue: mockPlatformConfigService },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('should reject non-seller upload requests', async () => {
    await expect(
      service.createUploadUrl(
        {
          id: 'buyer-1',
          email: 'buyer@example.com',
          role: 'buyer',
          isEmailVerified: true,
          isActive: true,
        },
        {
          usage: MediaUsage.CATALOG_PRODUCT,
          mediaType: UploadMediaType.IMAGE,
          fileName: 'lookbook.webp',
          contentType: 'image/webp',
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject unsupported image content types', async () => {
    await expect(
      service.createUploadUrl(
        {
          id: 'seller-user-1',
          email: 'seller@example.com',
          role: 'seller',
          sellerProfileId: 'seller-1',
          isEmailVerified: true,
          isActive: true,
        },
        {
          usage: MediaUsage.CATALOG_PRODUCT,
          mediaType: UploadMediaType.IMAGE,
          fileName: 'lookbook.svg',
          contentType: 'image/svg+xml',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should accept cloudfront public URLs generated from presigned upload requests', async () => {
    const result = await service.createUploadUrl(
      {
        id: 'seller-user-1',
        email: 'seller@example.com',
        role: 'seller',
        sellerProfileId: 'seller-1',
        isEmailVerified: true,
        isActive: true,
      },
      {
        usage: MediaUsage.FEED_POST,
        mediaType: UploadMediaType.IMAGE,
        fileName: 'drop-1.webp',
        contentType: 'image/webp',
      } satisfies CreateMediaUploadDto,
    );

    expect(result.objectKey).toContain('feed/seller-1/');
    expect(result.publicUrl).toContain('https://cdn.shopflow.test/feed/seller-1/');
    expect(result.headers['Content-Type']).toBe('image/webp');
    expect(service.isAllowedPublicUrl(result.publicUrl)).toBe(true);
  });
});
