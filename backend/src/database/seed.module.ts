import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { SettingsModule } from '../settings/settings.module';
import { ContentModule } from '../content/content.module';
import { ServicesModule } from '../services/services.module';
import { CaseStudiesModule } from '../case-studies/case-studies.module';
import { ArticlesModule } from '../articles/articles.module';

@Module({
  imports: [AdminAuthModule, SettingsModule, ContentModule, ServicesModule, CaseStudiesModule, ArticlesModule],
  providers: [SeedService],
})
export class SeedModule {}
