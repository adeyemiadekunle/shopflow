import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { CreateAdminDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  private async hashValue(value: string): Promise<string> {
    return bcrypt.hash(value, 12);
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
    return jwt.sign({ sub: userId }, secret, { expiresIn } as jwt.SignOptions);
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

    return {
      message: 'Registration successful. Please verify your email.',
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

  async logout(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (user)
      await this.usersService.save({ ...user, refreshTokenHash: undefined });
  }
}
