import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AdminJwtPayload {
  sub: number;
  email: string;
  name: string;
}

export type AuthedRequest = Request & { admin: AdminJwtPayload };

/** Protects admin routes. Expects `Authorization: Bearer <token>`. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Sign in to continue.');
    }
    try {
      req.admin = await this.jwt.verifyAsync<AdminJwtPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }
  }
}
