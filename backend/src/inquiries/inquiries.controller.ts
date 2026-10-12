import { Body, Controller, Delete, Get, Headers, Logger, Param, ParseUUIDPipe, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Response } from 'express';
import { InquiriesService } from './inquiries.service';
import { LEAD_STATUSES } from './inquiry.entity';
import type { LeadStatus } from './inquiry.entity';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import type { AuthedRequest } from '../common/jwt-auth.guard';

/** Loose shape — validateLead() returns the design's exact per-field messages. */
class SubmitLeadDto {
  @IsOptional() name?: unknown;
  @IsOptional() email?: unknown;
  @IsOptional() company?: unknown;
  @IsOptional() jobTitle?: unknown;
  @IsOptional() phone?: unknown;
  @IsOptional() interest?: unknown;
  @IsOptional() overview?: unknown;
  @IsOptional() timeline?: unknown;
  @IsOptional() budget?: unknown;
  @IsOptional() consent?: unknown;
  @IsOptional() meta?: unknown;
  @IsOptional() clientRequestId?: unknown;
}

class UpdateLeadDto {
  @IsOptional() @IsIn(LEAD_STATUSES as unknown as string[], { message: 'Choose a valid status.' }) status?: LeadStatus;
  @IsOptional() @IsString() @MaxLength(5000, { message: 'Keep notes under 5,000 characters.' }) notes?: string;
  @IsOptional() @IsString() @MaxLength(120) assignedTo?: string;
}

// /api/enquiries is the path in API-CONTRACT.md; /api/inquiries is the standard alias.
@Controller(['inquiries', 'enquiries'])
export class InquiriesController {
  private readonly audit = new Logger('LeadAccess');

  constructor(private readonly leads: InquiriesService) {}

  @Get('options')
  options() {
    return this.leads.formOptions();
  }

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  submit(@Body() body: SubmitLeadDto, @Headers('idempotency-key') key?: string) {
    return this.leads.submit(body, key);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(
    @Req() req: AuthedRequest,
    @Query('status') status?: string,
    @Query('interest') interest?: string,
    @Query('assigned') assigned?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    this.audit.log(JSON.stringify({ event: 'leads.list', admin: req.admin.sub }));
    return this.leads.list({ status, interest, assigned, q, page, limit, sort });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  stats() {
    return this.leads.stats();
  }

  @Get('export.csv')
  @UseGuards(JwtAuthGuard)
  async export(@Req() req: AuthedRequest, @Res() res: Response, @Query('status') status?: string) {
    this.audit.log(JSON.stringify({ event: 'leads.export', admin: req.admin.sub, status: status || 'all' }));
    const csv = await this.leads.exportCsv(status);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mercer-leads-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + csv);
  }

  @Post('admin/purge-expired')
  @UseGuards(JwtAuthGuard)
  purge(@Req() req: AuthedRequest) {
    this.audit.log(JSON.stringify({ event: 'leads.purge', admin: req.admin.sub }));
    return this.leads.purgeExpired();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  get(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    this.audit.log(JSON.stringify({ event: 'lead.view', admin: req.admin.sub, lead: id }));
    return this.leads.get(id);
  }

  @Post(':id/notify')
  @UseGuards(JwtAuthGuard)
  resend(@Param('id', ParseUUIDPipe) id: string) {
    return this.leads.resendNotification(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto) {
    this.audit.log(JSON.stringify({ event: 'lead.update', admin: req.admin.sub, lead: id, fields: Object.keys(dto) }));
    return this.leads.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    this.audit.log(JSON.stringify({ event: 'lead.delete', admin: req.admin.sub, lead: id }));
    return this.leads.remove(id);
  }
}
