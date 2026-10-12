import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

@Global()
@Module({
  imports: [
    // Async so values from .env (loaded by ConfigModule) are available
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
      }),
    }),
  ],
  providers: [JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class CommonModule {}
