import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { MailService } from '../mail/mail.service';

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
    create: jest.fn((value) => value),
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('refresh() should rotate tokens for a valid refresh token', async () => {
    const refreshToken = jwt.sign(
      { sub: mockUser.id },
      mockConfigService.get('jwt.refreshSecret'),
      {
        expiresIn: '7d',
      },
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    mockUsersService.findByIdWithTokenHash.mockResolvedValue({
      ...mockUser,
      refreshTokenHash,
    });
    mockUsersService.save.mockResolvedValue(undefined);

    const result = await service.refresh({ refreshToken });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(result.role).toBe(UserRole.BUYER);
    expect(mockUsersService.findByIdWithTokenHash).toHaveBeenCalledWith(
      mockUser.id,
    );
  });

  it('refresh() should throw UnauthorizedException for an invalid JWT', async () => {
    await expect(
      service.refresh({ refreshToken: 'not-a-valid-jwt' }),
    ).rejects.toThrow(UnauthorizedException);
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
