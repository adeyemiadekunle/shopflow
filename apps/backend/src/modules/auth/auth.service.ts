import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import {
  CreateAdminDto,
  LoginDto,
  RequestPasswordResetDto,
  ResendVerificationEmailDto,
  ResetPasswordDto,
  RegisterDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private async hashValue(value: string): Promise<string> {
    return bcrypt.hash(value, 12);
  }

  private generateOpaqueToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private createExpiry(minutes: number): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
    return expiresAt;
  }

  private async issueEmailVerificationToken(
    userId: string,
    email: string,
  ): Promise<void> {
    const token = this.generateOpaqueToken();
    const tokenHash = await this.hashValue(token);

    await this.usersService.save({
      id: userId,
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: this.createExpiry(60),
    });

    await this.mailService.sendVerificationEmail(email, token);
  }

  private async issuePasswordResetToken(
    userId: string,
    email: string,
  ): Promise<void> {
    const token = this.generateOpaqueToken();
    const tokenHash = await this.hashValue(token);

    await this.usersService.save({
      id: userId,
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: this.createExpiry(30),
    });

    await this.mailService.sendPasswordResetEmail(email, token);
  }

  private signAccessToken(userId: string, email: string, role: string): string {
    const secret = this.config.get<string>('jwt.accessSecret') ?? '';
    const expiresIn = this.config.get<string>('jwt.accessExpiresIn') ?? '15m';
    return jwt.sign({ sub: userId, email, role }, secret, {
      expiresIn,
    } as jwt.SignOptions);
  }

  private signRefreshToken(userId: string): string {
    const secret = this.config.get<string>('jwt.refreshSecret') ?? '';
    const expiresIn = this.config.get<string>('jwt.refreshExpiresIn') ?? '7d';
    return jwt.sign({ sub: userId, jti: crypto.randomUUID() }, secret, {
      expiresIn,
    } as jwt.SignOptions);
  }

  /** Self-registration for BUYER or SELLER accounts only */
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const role = dto.role ?? UserRole.BUYER;
    const passwordHash = await this.hashValue(dto.password);
    const user = this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role,
    });
    await this.usersService.save(user);

    try {
      await this.issueEmailVerificationToken(user.id, user.email);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${user.email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return {
      message:
        'Registration successful. Please verify your email before signing in.',
      role,
    };
  }

  /**
   * Admin-only: create a new admin account.
   * Called by an existing admin — route must be protected with @Roles(UserRole.ADMIN).
   */
  async createAdmin(dto: CreateAdminDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await this.hashValue(dto.password);
    const user = this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.ADMIN,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });
    await this.usersService.save(user);
    return { message: 'Admin account created.' };
  }

  /**
   * Unified login for all roles (buyer, seller, admin).
   * Optionally validates that the user matches the expected role
   * (useful for role-specific portals to reject wrong users).
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithTokenHash(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash ?? '',
    );
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new ForbiddenException('Account suspended');

    if (!user.isEmailVerified && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Email not verified. Please verify your email before signing in.',
      );
    }

    if (dto.expectedRole && user.role !== dto.expectedRole) {
      throw new ForbiddenException(
        `This account is not a ${dto.expectedRole} account. Please use the correct sign-in portal.`,
      );
    }

    const accessToken = this.signAccessToken(user.id, user.email, user.role);
    const refreshToken = this.signRefreshToken(user.id);
    const refreshTokenHash = await this.hashValue(refreshToken);
    await this.usersService.save({ ...user, refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      role: user.role,
      userId: user.id,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findByIdWithTokenHash(userId);
    if (!user?.refreshTokenHash) throw new ForbiddenException('Access denied');

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) throw new ForbiddenException('Invalid refresh token');

    const newAccessToken = this.signAccessToken(user.id, user.email, user.role);
    const newRefreshToken = this.signRefreshToken(user.id);
    const hash = await this.hashValue(newRefreshToken);
    await this.usersService.save({ ...user, refreshTokenHash: hash });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      role: user.role,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersService.findByEmailWithSecurityFields(
      dto.email,
    );
    if (!user) throw new NotFoundException('User not found');

    if (user.isEmailVerified) {
      return { message: 'Email is already verified.' };
    }

    if (
      !user.emailVerificationTokenHash ||
      !user.emailVerificationTokenExpiresAt ||
      user.emailVerificationTokenExpiresAt < new Date()
    ) {
      throw new UnauthorizedException(
        'Verification token is invalid or expired',
      );
    }

    const matches = await bcrypt.compare(
      dto.token,
      user.emailVerificationTokenHash,
    );
    if (!matches) {
      throw new UnauthorizedException(
        'Verification token is invalid or expired',
      );
    }

    await this.usersService.save({
      id: user.id,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: undefined,
      emailVerificationTokenExpiresAt: undefined,
    });

    return { message: 'Email verified successfully.' };
  }

  async resendVerificationEmail(dto: ResendVerificationEmailDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return {
        message:
          'If an account with that email exists, a verification email has been sent.',
      };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified.' };
    }

    await this.issueEmailVerificationToken(user.id, user.email);
    return { message: 'Verification email sent.' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (user) {
      await this.issuePasswordResetToken(user.id, user.email);
    }

    return {
      message:
        'If an account with that email exists, a password reset email has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmailWithSecurityFields(
      dto.email,
    );
    if (
      !user?.passwordResetTokenHash ||
      !user.passwordResetTokenExpiresAt ||
      user.passwordResetTokenExpiresAt < new Date()
    ) {
      throw new UnauthorizedException(
        'Password reset token is invalid or expired',
      );
    }

    const matches = await bcrypt.compare(
      dto.token,
      user.passwordResetTokenHash,
    );
    if (!matches) {
      throw new UnauthorizedException(
        'Password reset token is invalid or expired',
      );
    }

    const passwordHash = await this.hashValue(dto.password);
    await this.usersService.save({
      id: user.id,
      passwordHash,
      refreshTokenHash: undefined,
      passwordResetTokenHash: undefined,
      passwordResetTokenExpiresAt: undefined,
      passwordChangedAt: new Date(),
    });

    return { message: 'Password reset successful.' };
  }

  async logout(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (user)
      await this.usersService.save({ ...user, refreshTokenHash: undefined });
  }
}
