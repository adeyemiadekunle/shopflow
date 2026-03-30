import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product, ProductStatus } from '../catalog/entities/product.entity';
import { MediaService } from '../media/media.service';
import { UploadMediaType } from '../media/dto/media.dto';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { CreateCommentDto } from './dto/feed.dto';
import { FeedComment } from './entities/feed-comment.entity';
import { FeedFollow } from './entities/feed-follow.entity';
import { FeedLike } from './entities/feed-like.entity';
import { FeedPost } from './entities/feed-post.entity';
import { FeedPostStatus } from './enums/feed-post-status.enum';
import { FeedService } from './feed.service';

describe('FeedService', () => {
  let service: FeedService;

  const mockPostRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
    increment: jest.fn(),
    decrement: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockLikeRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
    remove: jest.fn(),
  };

  const mockCommentRepo = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockFollowRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
    delete: jest.fn(),
  };

  const mockProductRepo = {
    findOne: jest.fn(),
  };

  const mockMediaService = {
    isAllowedPublicUrl: jest.fn().mockReturnValue(true),
  };

  const mockPlatformConfigService = {
    getBoolean: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: getRepositoryToken(FeedPost), useValue: mockPostRepo },
        { provide: getRepositoryToken(FeedLike), useValue: mockLikeRepo },
        {
          provide: getRepositoryToken(FeedComment),
          useValue: mockCommentRepo,
        },
        { provide: getRepositoryToken(FeedFollow), useValue: mockFollowRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: MediaService, useValue: mockMediaService },
        {
          provide: PlatformConfigService,
          useValue: mockPlatformConfigService,
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  it('createPost() should reject tagged products outside the seller catalog', async () => {
    mockProductRepo.findOne.mockResolvedValue(null);

    await expect(
      service.createPost('seller-1', {
        content: 'New drop',
        productId: 'product-1',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('toggleLike() should reject archived posts', async () => {
    mockPostRepo.findOne.mockResolvedValue(null);

    await expect(service.toggleLike('post-1', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('addComment() should reject archived posts', async () => {
    mockPostRepo.findOne.mockResolvedValue(null);

    await expect(
      service.addComment('post-1', 'user-1', {
        content: 'Still available?',
      } satisfies CreateCommentDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('createPost() should allow tagging the seller own active product', async () => {
    mockProductRepo.findOne.mockResolvedValue({
      id: 'product-1',
      sellerProfileId: 'seller-1',
      status: ProductStatus.ACTIVE,
    });
    mockPostRepo.save.mockImplementation(
      async (value: Record<string, unknown>) => value,
    );

    const post = await service.createPost('seller-1', {
      content: 'New drop',
<<<<<<< HEAD
      media: [{ type: UploadMediaType.IMAGE, url: 'https://cdn.rands.test/a' }],
=======
      media: [{ type: UploadMediaType.IMAGE, url: 'https://cdn.shopflow.test/a' }],
>>>>>>> 2ed2340 (feat: expand shopflow platform and frontend)
      productId: 'product-1',
    });

    expect(post.productId).toBe('product-1');
  });

  it('createPost() should reject duplicate feed media URLs', async () => {
    await expect(
      service.createPost('seller-1', {
        content: 'New drop',
        media: [
          {
            type: UploadMediaType.IMAGE,
<<<<<<< HEAD
            url: 'https://cdn.rands.test/a',
          },
          {
            type: UploadMediaType.IMAGE,
            url: 'https://cdn.rands.test/a',
=======
            url: 'https://cdn.shopflow.test/a',
          },
          {
            type: UploadMediaType.IMAGE,
            url: 'https://cdn.shopflow.test/a',
>>>>>>> 2ed2340 (feat: expand shopflow platform and frontend)
          },
        ],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('createPost() should reject video media without a thumbnail', async () => {
    await expect(
      service.createPost('seller-1', {
        content: 'New drop',
        media: [
          {
            type: UploadMediaType.VIDEO,
<<<<<<< HEAD
            url: 'https://cdn.rands.test/video.mp4',
=======
            url: 'https://cdn.shopflow.test/video.mp4',
>>>>>>> 2ed2340 (feat: expand shopflow platform and frontend)
          },
        ],
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
