import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  list(@Query('category') category?: string, @Query('q') q?: string) {
    return this.articles.listPublic(category, q);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  adminList() {
    return this.articles.adminList();
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.articles.bySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Record<string, unknown>) {
    return this.articles.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.articles.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.articles.remove(id);
  }
}
