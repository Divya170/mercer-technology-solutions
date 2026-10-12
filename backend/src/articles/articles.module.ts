import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), SettingsModule],
  providers: [ArticlesService],
  controllers: [ArticlesController],
  exports: [ArticlesService],
})
export class ArticlesModule {}
