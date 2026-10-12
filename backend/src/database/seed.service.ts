import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { SettingsService } from '../settings/settings.service';
import { ContentService } from '../content/content.service';
import { ServicesService } from '../services/services.service';
import { CaseStudiesService } from '../case-studies/case-studies.service';
import { ArticlesService } from '../articles/articles.service';
import { ARTICLES_SEED, CASE_STUDIES_SEED, CONTENT_SEED, SERVICES_SEED } from './seed-data';

/** Idempotent first-boot seed: each step checks before inserting. */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed');

  constructor(
    private readonly admins: AdminAuthService,
    private readonly settings: SettingsService,
    private readonly content: ContentService,
    private readonly services: ServicesService,
    private readonly cases: CaseStudiesService,
    private readonly articles: ArticlesService,
  ) {}

  async onApplicationBootstrap() {
    await this.admins.ensureDefaultAdmin();
    await this.settings.ensure();
    let created = await this.services.seed(SERVICES_SEED);
    for (const [type, items] of Object.entries(CONTENT_SEED)) created += await this.content.seedType(type, items);
    created += await this.cases.seed(CASE_STUDIES_SEED);
    created += await this.articles.seed(ARTICLES_SEED);
    if (created) this.logger.log(`Seeded ${created} rows from the design (sample rows are marked and hidden when "Show sample content" is off).`);
  }
}
