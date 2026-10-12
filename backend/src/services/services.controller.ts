import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

class ReorderDto {
  @IsArray() @ArrayNotEmpty() @IsInt({ each: true }) ids: number[];
}

@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  list() {
    return this.services.listVisible();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  adminList() {
    return this.services.adminList();
  }

  @Post('admin/reorder')
  @UseGuards(JwtAuthGuard)
  reorder(@Body() dto: ReorderDto) {
    return this.services.reorder(dto.ids);
  }

  // Bodies are validated by validateService() (exact field messages).
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Record<string, unknown>) {
    return this.services.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.services.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.services.remove(id);
  }
}
