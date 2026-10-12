import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, LessThan, MoreThan, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Inquiry, LEAD_STATUSES, LeadStatus } from './inquiry.entity';
import { BUDGETS, isBot, LeadInput, TIMELINES, validateLead } from './inquiry-validation';
import { NotifierService } from './notifier.service';
import { SettingsService } from '../settings/settings.service';
import { ServicesService } from '../services/services.service';
import { clampInt, csvCell } from '../common/utils';

export const STATUS_LABELS: Record<LeadStatus, string> = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', closed: 'Closed', spam: 'Spam' };
const PER_EMAIL_LIMIT = 3; // per hour

const retentionDays = () => clampInt(process.env.LEAD_RETENTION_DAYS, 30, 3650, 730);
const minFillMs = () => clampInt(process.env.MIN_FORM_FILL_MS, 0, 60_000, 2500);

@Injectable()
export class InquiriesService {
  // Structured logs never include names, emails, phone numbers or message text.
  private readonly logger = new Logger('Leads');

  constructor(
    @InjectRepository(Inquiry) private readonly repo: Repository<Inquiry>,
    private readonly settings: SettingsService,
    private readonly services: ServicesService,
    private readonly notifier: NotifierService,
  ) {}

  /** Everything the form needs so nothing is hard-coded in the frontend. */
  async formOptions() {
    const s = await this.settings.get();
    return {
      interests: await this.services.interestOptions(),
      timelines: TIMELINES,
      budgets: s.showBudget ? BUDGETS : [],
      showBudget: s.showBudget,
      enquiriesOpen: s.enquiriesOpen,
      minFillMs: minFillMs(),
    };
  }

  async submit(input: LeadInput, idempotencyKey?: string) {
    const bot = isBot(input, minFillMs());
    if (bot === 'honeypot') {
      // Look successful to the bot; nothing is stored.
      this.logger.warn(JSON.stringify({ event: 'lead.rejected', reason: 'honeypot' }));
      return { id: null, reference: null };
    }
    if (bot === 'too-fast') {
      this.logger.warn(JSON.stringify({ event: 'lead.rejected', reason: 'too-fast' }));
      throw new BadRequestException('Something went wrong while sending. Please try again in a moment.');
    }
    const settings = await this.settings.get();
    if (!settings.enquiriesOpen) throw new ServiceUnavailableException('Online enquiries are paused. Please email or call us instead.');

    const key = String(idempotencyKey || input.clientRequestId || '').trim().slice(0, 100) || null;
    if (key) {
      const existing = await this.repo.findOne({ where: { clientRequestId: key } });
      if (existing) return { id: existing.id, reference: existing.reference };
    }

    const interests = new Set((await this.services.interestOptions()).map((o) => o.value));
    const { value, errors } = validateLead(input, { interests, showBudget: settings.showBudget });
    if (Object.keys(errors).length) {
      const n = Object.keys(errors).length;
      throw new UnprocessableEntityException({ statusCode: 422, message: n === 1 ? 'Please check 1 field.' : `Please check ${n} fields.`, errors });
    }

    // Per-email rate limit (per-IP limit is the route throttle)
    const recent = await this.repo.count({ where: { email: value.email, createdAt: MoreThan(new Date(Date.now() - 3600_000)) } });
    if (recent >= PER_EMAIL_LIMIT) throw new HttpException('Too many submissions from this connection. Please wait a few minutes and try again.', HttpStatus.TOO_MANY_REQUESTS);

    const now = new Date();
    const lead = await this.repo.save(
      this.repo.create({
        ...value,
        interestLabel: await this.services.interestLabel(value.interest),
        consentAt: now,
        retentionUntil: new Date(now.getTime() + retentionDays() * 86400_000),
        clientRequestId: key,
        reference: await this.newReference(),
        status: 'new',
        assignedTo: '',
        notes: '',
        notificationStatus: this.notifier.configured ? 'pending' : 'not-configured',
        notificationError: null,
      }),
    );
    this.logger.log(JSON.stringify({ event: 'lead.created', ref: lead.reference, interest: lead.interest, source: lead.source }));
    if (this.notifier.configured) void this.notify(lead, settings.email);
    return { id: lead.id, reference: lead.reference };
  }

  private async notify(l: Inquiry, fallbackTo: string | null) {
    try {
      await this.notifier.sendNewLead(l, fallbackTo);
      await this.repo.update({ id: l.id }, { notificationStatus: 'sent', notificationError: null });
    } catch (err) {
      const msg = (err as Error).message?.slice(0, 240) || 'Unknown error';
      this.logger.error(JSON.stringify({ event: 'lead.notify_failed', ref: l.reference }));
      await this.repo.update({ id: l.id }, { notificationStatus: 'failed', notificationError: msg });
    }
  }

  async resendNotification(id: string) {
    if (!this.notifier.configured) throw new BadRequestException('Email notifications are not configured (set SMTP_HOST).');
    const l = await this.get(id);
    await this.repo.update({ id }, { notificationStatus: 'pending' });
    await this.notify(l, (await this.settings.get()).email);
    return this.get(id);
  }

  // ---------- admin ----------

  async list(p: { status?: string; interest?: string; assigned?: string; q?: string; page?: string; limit?: string; sort?: string }) {
    const page = clampInt(p.page, 1, 10_000, 1);
    const limit = clampInt(p.limit, 1, 100, 25);
    const qb = this.repo.createQueryBuilder('x');
    if (p.status && (LEAD_STATUSES as readonly string[]).includes(p.status)) qb.andWhere('x.status = :status', { status: p.status });
    else if (!p.status) qb.andWhere('x.status != :spam', { spam: 'spam' });
    if (p.interest && p.interest !== 'all') qb.andWhere('x.interest = :interest', { interest: p.interest });
    if (p.assigned === 'unassigned') qb.andWhere("x.assignedTo = ''");
    const q = (p.q || '').trim().toLowerCase();
    if (q) {
      const like = `%${q}%`;
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('LOWER(x.name) LIKE :like', { like })
            .orWhere('LOWER(x.email) LIKE :like', { like })
            .orWhere('LOWER(x.company) LIKE :like', { like })
            .orWhere('x.phone LIKE :like', { like })
            .orWhere('LOWER(x.reference) LIKE :like', { like }),
        ),
      );
    }
    qb.orderBy('x.createdAt', p.sort === 'oldest' ? 'ASC' : 'DESC');
    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), counts: await this.counts(), notificationsConfigured: this.notifier.configured };
  }

  async counts() {
    const raw = await this.repo.createQueryBuilder('x').select('x.status', 'status').addSelect('COUNT(*)', 'n').groupBy('x.status').getRawMany<{ status: string; n: string }>();
    const counts: Record<string, number> = { all: 0, new: 0, contacted: 0, qualified: 0, closed: 0, spam: 0 };
    for (const r of raw) {
      counts[r.status] = Number(r.n);
      if (r.status !== 'spam') counts.all += Number(r.n);
    }
    return counts;
  }

  async stats() {
    const since = new Date(Date.now() - 30 * 86400_000);
    const [counts, last30, byInterest, recent, expired] = await Promise.all([
      this.counts(),
      this.repo.count({ where: { createdAt: MoreThan(since) } }),
      this.repo
        .createQueryBuilder('x')
        .select('x.interestLabel', 'label')
        .addSelect('COUNT(*)', 'n')
        .where('x.status != :spam', { spam: 'spam' })
        .groupBy('x.interestLabel')
        .orderBy('n', 'DESC')
        .getRawMany<{ label: string; n: string }>(),
      this.repo.find({ where: {}, order: { createdAt: 'DESC' }, take: 6 }),
      this.repo.count({ where: { retentionUntil: LessThan(new Date()) } }),
    ]);
    return {
      counts,
      last30,
      byInterest: byInterest.map((b) => ({ label: b.label || '—', count: Number(b.n) })),
      recent,
      expired,
      notificationsConfigured: this.notifier.configured,
    };
  }

  async get(id: string) {
    const x = await this.repo.findOne({ where: { id } });
    if (!x) throw new NotFoundException('Lead not found.');
    return x;
  }

  async update(id: string, patch: { status?: LeadStatus; notes?: string; assignedTo?: string }) {
    const x = await this.get(id);
    if (patch.status !== undefined) x.status = patch.status;
    if (patch.notes !== undefined) x.notes = patch.notes;
    if (patch.assignedTo !== undefined) x.assignedTo = patch.assignedTo.trim();
    return this.repo.save(x);
  }

  async remove(id: string) {
    await this.repo.remove(await this.get(id));
    return { ok: true };
  }

  /** Deletes leads whose retention period has ended. */
  async purgeExpired() {
    const res = await this.repo.delete({ retentionUntil: LessThan(new Date()) });
    this.logger.log(JSON.stringify({ event: 'lead.purged', count: res.affected ?? 0 }));
    return { deleted: res.affected ?? 0 };
  }

  async exportCsv(status?: string) {
    const qb = this.repo.createQueryBuilder('x').orderBy('x.createdAt', 'DESC');
    if (status && (LEAD_STATUSES as readonly string[]).includes(status)) qb.where('x.status = :status', { status });
    const rows = await qb.getMany();
    const header = ['Reference', 'Submitted', 'Status', 'Name', 'Email', 'Company', 'Job title', 'Phone', 'Interest', 'Timeline', 'Budget', 'Overview', 'Assigned to', 'Notes', 'Consent given', 'Retain until'];
    const lines = rows.map((r) =>
      [r.reference, new Date(r.createdAt).toISOString(), STATUS_LABELS[r.status], r.name, r.email, r.company, r.jobTitle, r.phone, r.interestLabel, r.timeline, r.budget, r.overview, r.assignedTo, r.notes, new Date(r.consentAt).toISOString(), new Date(r.retentionUntil).toISOString().slice(0, 10)]
        .map(csvCell)
        .join(','),
    );
    return [header.join(','), ...lines].join('\r\n');
  }

  private async newReference(): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 5; i++) {
      const ref = 'MTS-' + Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join('');
      if (!(await this.repo.findOne({ where: { reference: ref } }))) return ref;
    }
    return 'MTS-' + Date.now().toString(36).toUpperCase();
  }
}
