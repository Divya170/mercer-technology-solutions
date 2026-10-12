import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CaseStudiesService } from './case-studies.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('case-studies')
export class CaseStudiesController {
  constructor(private readonly cases: CaseStudiesService) {}

  @Get()
  list(@Query('service') service?: string) {
    return this.cases.listPublic(service);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  adminList() {
    return this.cases.adminList();
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.cases.bySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Record<string, unknown>) {
    return this.cases.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.cases.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cases.remove(id);
  }
}
