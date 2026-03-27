import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum';

/** Roles that can self-register. Admin accounts are created separately by existing admins. */
const SELF_REGISTERABLE_ROLES = [UserRole.BUYER, UserRole.SELLER] as const;

export class RegisterDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  /**
   * Role for registration. Defaults to BUYER.
   * Only BUYER and SELLER are allowed for self-registration.
   * ADMIN accounts are created by existing admins via POST /auth/admin.
   */
  @ApiProperty({
    enum: SELF_REGISTERABLE_ROLES,
    default: UserRole.BUYER,
    required: false,
    description: 'buyer (default) or seller',
  })
  @IsOptional()
  @IsEnum(SELF_REGISTERABLE_ROLES)
  role?: (typeof SELF_REGISTERABLE_ROLES)[number];
}

export class LoginDto {
  @ApiProperty({ example: 'seller@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;

  /**
   * Optional role hint — used only for validation that the user logging in
   * is actually of the expected role (e.g., seller portal can reject BUYER tokens).
   */
  @ApiProperty({
    enum: UserRole,
    required: false,
    description: 'Optional role assertion for portal-specific logins',
  })
  @IsOptional()
  @IsEnum(UserRole)
  expectedRole?: UserRole;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  token!: string;
}

export class ResendVerificationEmailDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email!: string;
}

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}

/** Admin-only DTO to create an admin account */
export class CreateAdminDto {
  @ApiProperty({ example: 'admin@rands.ng' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(12)
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;
}
