import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AUTH_THROTTLES } from './auth.constants';
import {
  CreateAdminDto,
  LoginDto,
  RequestPasswordResetDto,
  ResendVerificationEmailDto,
  ResetPasswordDto,
  RegisterDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { RefreshTokenUser } from './strategies/jwt-refresh.strategy';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Self-registration for buyers and sellers.
   * Pass role: "seller" in the body to register as a seller.
   */
  @Post('register')
  @Public()
  @Throttle({ default: AUTH_THROTTLES.register })
  @ApiOperation({ summary: 'Register a buyer or seller account' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Unified login for all roles (buyer, seller, admin).
   * Optionally pass expectedRole to enforce portal-level role checking.
   */
  @Post('login')
  @Public()
  @Throttle({ default: AUTH_THROTTLES.login })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login — works for buyer, seller, and admin',
    description:
      'Pass `expectedRole` to enforce that only the expected role can log into a specific portal (e.g. seller dashboard).',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  @Post('refresh')
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: AUTH_THROTTLES.refresh })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh access + refresh tokens',
    description:
      'Send the refresh token in the Authorization Bearer header. Request body `refreshToken` is also accepted for backward compatibility.',
  })
  refresh(@CurrentUser() user: RefreshTokenUser) {
    return this.authService.refreshTokens(user.userId, user.refreshToken);
  }

  @Post('verify-email')
  @Public()
  @Throttle({ default: AUTH_THROTTLES.verifyEmail })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email using a one-time token' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('verify-email/resend')
  @Public()
  @Throttle({ default: AUTH_THROTTLES.resendVerificationEmail })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  resendVerificationEmail(@Body() dto: ResendVerificationEmailDto) {
    return this.authService.resendVerificationEmail(dto);
  }

  @Post('forgot-password')
  @Public()
  @Throttle({ default: AUTH_THROTTLES.forgotPassword })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @Public()
  @Throttle({ default: AUTH_THROTTLES.resetPassword })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a one-time token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /**
   * Logout — invalidates refresh token.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.id);
  }

  /**
   * Admin-only: create another admin account.
   * Requires an existing admin access token.
   */
  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create an admin account (admin only)',
    description: 'Only existing admins can create new admin accounts.',
  })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.authService.createAdmin(dto);
  }
}
