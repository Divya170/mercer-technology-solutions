import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseStudy } from './case-study.entity';
import { CaseStudiesService } from './case-studies.service';
import { CaseStudiesController } from './case-studies.controller';
import { SettingsModule } from '../settings/settings.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [TypeOrmModule.forFeature([CaseStudy]), SettingsModule, ServicesModule],
  providers: [CaseStudiesService],
  controllers: [CaseStudiesController],
  exports: [CaseStudiesService],
})
export class CaseStudiesModule {}
