import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseStudy } from './case-study.entity';
import { CaseInput, validateCaseStudy } from './case-study-validation';
import { SettingsService } from '../settings/settings.service';
import { ServicesService } from '../services/services.service';
import { slugify } from '../common/utils';

@Injectable()
export class CaseStudiesService {
  constructor(
    @InjectRepository(CaseStudy) private readonly repo: Repository<CaseStudy>,
    private readonly settings: SettingsService,
    private readonly services: ServicesService,
  ) {}

  private async visibleRows() {
    const [rows, samples] = await Promise.all([this.repo.find({ where: { status: 'published' }, order: { updatedAt: 'DESC', id: 'DESC' } }), this.settings.showSamples()]);
    return rows.filter((r) => samples || !r.isSample);
  }

  private async names(): Promise<Map<string, string>> {
    return new Map<string, string>((await this.services.listVisible()).map((s) => [String(s.slug), String(s.name)] as [string, string]));
  }

  private card(r: CaseStudy, names: Map<string, string>) {
    return { id: r.id, slug: r.slug, title: r.title, client: r.client, serviceSlug: r.serviceSlug, serviceName: names.get(r.serviceSlug) || '', image: r.image, imageAlt: r.imageAlt, isSample: r.isSample };
  }

  /** GET /case-studies?service= → filtered list + filter chips (visible services) */
  async listPublic(service?: string) {
    const rows = await this.visibleRows();
    const names = await this.names();
    const items = rows.filter((r) => !service || service === 'all' || r.serviceSlug === service).map((r) => this.card(r, names));
    const filters = Array.from(names.entries()).map(([value, label]) => ({ value, label }));
    return { items, total: rows.length, filters, hasSamples: rows.some((r) => r.isSample) };
  }

  async bySlug(slug: string) {
    const rows = await this.visibleRows();
    const names = await this.names();
    const r = rows.find((x) => x.slug === slug);
    if (!r) throw new NotFoundException('This case study isn’t available.');
    return { ...this.card(r, names), context: r.context, challenge: r.challenge, approach: r.approach, scope: r.scope, implementation: r.implementation, outcomes: r.outcomes };
  }

  // ---------- admin ----------

  adminList() {
    return this.repo.find({ order: { updatedAt: 'DESC', id: 'DESC' } });
  }

  async get(id: number) {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Case study not found.');
    return r;
  }

  private async check(input: CaseInput) {
    const { value, errors } = validateCaseStudy(input, await this.services.allSlugs());
    const n = Object.keys(errors).length;
    if (n) throw new BadRequestException({ message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`, errors });
    return value;
  }

  private async uniqueSlug(slug: string, id?: number) {
    const clash = await this.repo.findOne({ where: { slug } });
    if (clash && clash.id !== id) throw new ConflictException({ message: 'That slug is already used.', errors: { slug: 'That slug is already used by another case study.' } });
  }

  async create(input: CaseInput) {
    const v = await this.check(input);
    const slug = v.slug || slugify(v.title).slice(0, 80);
    await this.uniqueSlug(slug);
    return this.repo.save(this.repo.create({ ...v, slug }));
  }

  async update(id: number, input: CaseInput) {
    const r = await this.get(id);
    const v = await this.check({ ...r, ...input });
    const slug = v.slug || r.slug;
    await this.uniqueSlug(slug, id);
    Object.assign(r, v, { slug });
    return this.repo.save(r);
  }

  async remove(id: number) {
    await this.repo.remove(await this.get(id));
    return { ok: true };
  }

  async seed(items: CaseInput[]) {
    if ((await this.repo.count()) > 0) return 0;
    for (const it of items) await this.repo.save(this.repo.create({ ...(await this.check(it)), slug: String(it.slug) }));
    return items.length;
  }
}
