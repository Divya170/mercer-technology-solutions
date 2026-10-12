import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Service } from './service.entity';
import { ServiceInput, validateService } from './service-validation';
import { SettingsService } from '../settings/settings.service';
import { slugify } from '../common/utils';

export const NOT_SURE = { value: 'not-sure', label: 'Not sure yet' };

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service) private readonly repo: Repository<Service>,
    private readonly settings: SettingsService,
  ) {}

  private ordered() {
    return { order: { sortOrder: 'ASC' as const, id: 'ASC' as const } };
  }

  /** Published services, plus sample ones while sample content is shown. Numbered 01, 02… */
  async listVisible() {
    const [rows, samples] = await Promise.all([this.repo.find({ where: { status: 'published' }, ...this.ordered() }), this.settings.showSamples()]);
    return rows
      .filter((r) => samples || !r.isSample)
      .map((r, i) => ({
        id: r.id,
        n: String(i + 1).padStart(2, '0'),
        slug: r.slug,
        name: r.name,
        short: r.short,
        overview: r.overview,
        problems: r.problems,
        scope: r.scope,
        considerations: r.considerations,
        image: r.image,
        imageAlt: r.imageAlt,
        imageLabel: r.imageLabel,
        isSample: r.isSample,
      }));
  }

  /** "Area of interest" options: visible services + "Not sure yet" */
  async interestOptions() {
    return [...(await this.listVisible()).map((s) => ({ value: s.slug, label: s.name })), NOT_SURE];
  }

  async interestLabel(value: string) {
    if (value === NOT_SURE.value) return NOT_SURE.label;
    return (await this.repo.findOne({ where: { slug: value } }))?.name ?? value;
  }

  async allSlugs(): Promise<Set<string>> {
    return new Set<string>((await this.repo.find({ select: { slug: true } })).map((s) => String(s.slug)));
  }

  // ---------- admin ----------

  adminList() {
    return this.repo.find(this.ordered());
  }

  async get(id: number) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Service not found.');
    return s;
  }

  private check(input: ServiceInput) {
    const { value, errors } = validateService(input);
    const n = Object.keys(errors).length;
    if (n) throw new BadRequestException({ message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`, errors });
    return value;
  }

  async create(input: ServiceInput) {
    const v = this.check(input);
    const slug = v.slug || slugify(v.name).slice(0, 60);
    if (!slug) throw new BadRequestException({ message: 'Enter a valid slug.', errors: { slug: 'Enter a valid slug.' } });
    if (await this.repo.findOne({ where: { slug } })) throw new ConflictException({ message: 'That slug is already used.', errors: { slug: 'That slug is already used by another service.' } });
    const max = await this.repo.createQueryBuilder('s').select('MAX(s.sortOrder)', 'max').getRawOne<{ max: number | null }>();
    return this.repo.save(this.repo.create({ ...v, slug, sortOrder: (max?.max ?? 0) + 1 }));
  }

  /** Slug is fixed after creation: it is used in links, leads and case studies. */
  async update(id: number, input: ServiceInput) {
    const s = await this.get(id);
    const v = this.check({ ...s, ...input, slug: s.slug });
    Object.assign(s, { ...v, slug: s.slug });
    return this.repo.save(s);
  }

  async remove(id: number) {
    await this.repo.remove(await this.get(id));
    return { ok: true };
  }

  async reorder(ids: number[]) {
    const rows = await this.repo.find({ where: { id: In(ids) } });
    if (rows.length !== ids.length) throw new BadRequestException('Reorder list does not match the services.');
    await Promise.all(ids.map((id, i) => this.repo.update({ id }, { sortOrder: i + 1 })));
    return this.adminList();
  }

  async seed(items: ServiceInput[]) {
    if ((await this.repo.count()) > 0) return 0;
    let i = 0;
    for (const it of items) {
      const v = this.check(it);
      await this.repo.save(this.repo.create({ ...v, sortOrder: ++i }));
    }
    return items.length;
  }
}
