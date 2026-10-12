import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { resolve } from 'path';
import { CommonModule } from './common/common.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { SettingsModule } from './settings/settings.module';
import { ServicesModule } from './services/services.module';
import { ContentModule } from './content/content.module';
import { CaseStudiesModule } from './case-studies/case-studies.module';
import { ArticlesModule } from './articles/articles.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { UploadsModule } from './uploads/uploads.module';
import { SeedModule } from './database/seed.module';
import { AdminUser } from './admin-auth/admin-user.entity';
import { Settings } from './settings/settings.entity';
import { Service } from './services/service.entity';
import { ContentBlock } from './content/content-block.entity';
import { CaseStudy } from './case-studies/case-study.entity';
import { Article } from './articles/article.entity';
import { Inquiry } from './inquiries/inquiry.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite' as const,
        database: resolve(process.cwd(), process.env.DATABASE_PATH || '../database/app.sqlite'),
        entities: [AdminUser, Settings, Service, ContentBlock, CaseStudy, Article, Inquiry],
        synchronize: true,
      }),
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    CommonModule,
    AdminAuthModule,
    SettingsModule,
    ServicesModule,
    ContentModule,
    CaseStudiesModule,
    ArticlesModule,
    InquiriesModule,
    UploadsModule,
    SeedModule,
  ],
})
export class AppModule {}
