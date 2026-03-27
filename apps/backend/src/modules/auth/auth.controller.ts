import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateAdminDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access + refresh tokens' })
  refresh() {
    // In production the userId is decoded from the refresh JWT itself.
    // Placeholder — JWT refresh strategy guard handles this via Passport.
    return {
      message:
        'Use the jwt-refresh guard in your middleware for production refresh.',
    };
  }

  /**
   * Logout — invalidates refresh token.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  logout(@CurrentUser() user: User) {
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
