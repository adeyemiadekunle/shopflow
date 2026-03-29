import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { MailService } from '../mail/mail.service';
import { SellersService } from '../sellers/sellers.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-1',
    email: 'buyer@example.com',
    role: UserRole.BUYER,
    isActive: true,
    isEmailVerified: true,
    refreshTokenHash: '',
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByEmailWithTokenHash: jest.fn(),
    findByEmailWithSecurityFields: jest.fn(),
    findByIdWithTokenHash: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Record<string, unknown>) => ({
      id: 'user-1',
      ...value,
    })),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'jwt.accessSecret': 'test_access_secret_32_characters',
        'jwt.refreshSecret': 'test_refresh_secret_32_characters',
        'jwt.accessExpiresIn': '15m',
        'jwt.refreshExpiresIn': '7d',
      };
      return values[key];
    }),
  };

  const mockMailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  const mockSellersService = {
    createForUser: jest.fn(),
  };

  const mockSubscriptionsService = {
    startFreeTrial: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
        { provide: SellersService, useValue: mockSellersService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('refreshTokens() should rotate tokens for a valid refresh token', async () => {
    const refreshToken = 'valid-refresh-token';
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    mockUsersService.findByIdWithTokenHash.mockResolvedValue({
      ...mockUser,
      refreshTokenHash,
    });
    mockUsersService.save.mockResolvedValue(undefined);

    const result = await service.refreshTokens(mockUser.id, refreshToken);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(result.role).toBe(UserRole.BUYER);
    expect(mockUsersService.findByIdWithTokenHash).toHaveBeenCalledWith(
      mockUser.id,
    );
  });

  it('refreshTokens() should reject a refresh token that does not match the stored hash', async () => {
    const refreshTokenHash = await bcrypt.hash('different-refresh-token', 12);

    mockUsersService.findByIdWithTokenHash.mockResolvedValue({
      ...mockUser,
      refreshTokenHash,
    });

    await expect(
      service.refreshTokens(mockUser.id, 'not-a-valid-jwt'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('login() should reject non-admin users with unverified email', async () => {
    const password = 'SecurePass123!';
    const passwordHash = await bcrypt.hash(password, 12);

    mockUsersService.findByEmailWithTokenHash.mockResolvedValue({
      ...mockUser,
      isEmailVerified: false,
      passwordHash,
    });

    await expect(
      service.login({ email: mockUser.email, password }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('register() should reject duplicate emails case-insensitively', async () => {
    mockUsersService.findByEmail.mockResolvedValue(mockUser);

    await expect(
      service.register({
        email: 'Buyer@Example.com',
        password: 'SecurePass123!',
        role: UserRole.BUYER,
      }),
    ).rejects.toThrow(ConflictException);

    expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
      'buyer@example.com',
    );
  });

  it('register() should create a seller profile for seller signups', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockUsersService.save.mockResolvedValue(undefined);
    mockSellersService.createForUser.mockResolvedValue({
      id: 'seller-profile-1',
    });

    const result = await service.register({
      email: 'seller@example.com',
      password: 'SecurePass123!',
      firstName: 'Tola',
      lastName: 'Stores',
      role: UserRole.SELLER,
    });

    expect(result.role).toBe(UserRole.SELLER);
    expect(mockSellersService.createForUser).toHaveBeenCalledWith({
      userId: expect.any(String),
      email: 'seller@example.com',
      storeName: 'Tola Stores',
    });
    expect(mockSubscriptionsService.startFreeTrial).toHaveBeenCalledWith(
      'seller-profile-1',
    );
  });

  it('register() should honor an explicit seller store name', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockUsersService.save.mockResolvedValue(undefined);
    mockSellersService.createForUser.mockResolvedValue({
      id: 'seller-profile-1',
    });

    await service.register({
      email: 'seller@example.com',
      password: 'SecurePass123!',
      role: UserRole.SELLER,
      storeName: '  Tola Fashion House  ',
    });

    expect(mockSellersService.createForUser).toHaveBeenCalledWith({
      userId: expect.any(String),
      email: 'seller@example.com',
      storeName: 'Tola Fashion House',
    });
  });

  it('login() should normalize the email before lookup', async () => {
    const password = 'SecurePass123!';
    const passwordHash = await bcrypt.hash(password, 12);

    mockUsersService.findByEmailWithTokenHash.mockResolvedValue({
      ...mockUser,
      passwordHash,
    });
    mockUsersService.save.mockResolvedValue(undefined);

    await service.login({
      email: 'Buyer@Example.com',
      password,
    });

    expect(mockUsersService.findByEmailWithTokenHash).toHaveBeenCalledWith(
      'buyer@example.com',
    );
  });

  it('verifyEmail() should verify a valid token and clear verification fields', async () => {
    const token = 'verification-token';
    const tokenHash = await bcrypt.hash(token, 12);

    mockUsersService.findByEmailWithSecurityFields.mockResolvedValue({
      ...mockUser,
      isEmailVerified: false,
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    mockUsersService.save.mockResolvedValue(undefined);

    const result = await service.verifyEmail({
      email: mockUser.email,
      token,
    });

    expect(result.message).toBe('Email verified successfully.');
    expect(mockUsersService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser.id,
        isEmailVerified: true,
      }),
    );
  });

  it('requestPasswordReset() should return a generic message and send email for known users', async () => {
    mockUsersService.findByEmail.mockResolvedValue(mockUser);
    mockUsersService.save.mockResolvedValue(undefined);

    const result = await service.requestPasswordReset({
      email: mockUser.email,
    });

    expect(result.message).toContain('password reset email has been sent');
    expect(mockUsersService.save).toHaveBeenCalled();
    expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('resetPassword() should update password and clear reset token state', async () => {
    const token = 'reset-token';
    const tokenHash = await bcrypt.hash(token, 12);

    mockUsersService.findByEmailWithSecurityFields.mockResolvedValue({
      ...mockUser,
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    mockUsersService.save.mockResolvedValue(undefined);

    const result = await service.resetPassword({
      email: mockUser.email,
      token,
      password: 'NewSecurePass123!',
    });

    expect(result.message).toBe('Password reset successful.');
    expect(mockUsersService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser.id,
        refreshTokenHash: undefined,
        passwordResetTokenHash: undefined,
      }),
    );
  });
});
