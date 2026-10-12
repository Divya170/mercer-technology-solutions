import { Body, Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { ChangePasswordDto, LoginDto } from './admin-auth.dto';
import { AuthedRequest, JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthedRequest) {
    return this.auth.me(req.admin.sub);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: AuthedRequest, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.admin.sub, dto.currentPassword, dto.newPassword);
  }
}
