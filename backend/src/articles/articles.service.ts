import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { ArticleInput, paragraphs, validateArticle } from './article-validation';
import { SettingsService } from '../settings/settings.service';
import { slugify } from '../common/utils';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article) private readonly repo: Repository<Article>,
    private readonly settings: SettingsService,
  ) {}

  /** Published, not scheduled for later, and not a sample unless samples are shown. Featured first, newest next. */
  private async visibleRows() {
    const [rows, samples] = await Promise.all([this.repo.find({ where: { status: 'published' } }), this.settings.showSamples()]);
    const now = Date.now();
    return rows
      .filter((r) => (samples || !r.isSample) && (!r.publishedAt || new Date(r.publishedAt).getTime() <= now))
      .sort((a, b) => Number(b.featured) - Number(a.featured) || new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  }

  private card(r: Article) {
    return { id: r.id, slug: r.slug, title: r.title, category: r.category, excerpt: r.excerpt, author: r.author, readingMinutes: r.readingMinutes, image: r.image, imageAlt: r.imageAlt, featured: r.featured, publishedAt: r.publishedAt, isSample: r.isSample };
  }

  /** GET /articles?category&q */
  async listPublic(category?: string, q?: string) {
    const rows = await this.visibleRows();
    const query = (q || '').trim().toLowerCase().slice(0, 100);
    const items = rows
      .filter((r) => !category || category === 'All' || r.category === category)
      .filter((r) => !query || `${r.title} ${r.category} ${r.excerpt}`.toLowerCase().includes(query))
      .map((r) => this.card(r));
    return { items, total: rows.length, categories: Array.from(new Set(rows.map((r) => r.category))).sort(), hasSamples: rows.some((r) => r.isSample) };
  }

  async bySlug(slug: string) {
    const r = (await this.visibleRows()).find((x) => x.slug === slug);
    if (!r) throw new NotFoundException('This article isn’t available.');
    return { ...this.card(r), body: paragraphs(r.body) };
  }

  // ---------- admin ----------

  adminList() {
    return this.repo.find({ order: { updatedAt: 'DESC', id: 'DESC' } });
  }

  async get(id: number) {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Article not found.');
    return r;
  }

  private check(input: ArticleInput) {
    const { value, errors } = validateArticle(input);
    const n = Object.keys(errors).length;
    if (n) throw new BadRequestException({ message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`, errors });
    return value;
  }

  private async uniqueSlug(slug: string, id?: number) {
    const clash = await this.repo.findOne({ where: { slug } });
    if (clash && clash.id !== id) throw new ConflictException({ message: 'That slug is already used.', errors: { slug: 'That slug is already used by another article.' } });
  }

  async create(input: ArticleInput) {
    const v = this.check(input);
    const slug = v.slug || slugify(v.title).slice(0, 100);
    await this.uniqueSlug(slug);
    return this.repo.save(this.repo.create({ ...v, slug, publishedAt: v.publishedAt ?? (v.status === 'published' ? new Date() : null) }));
  }

  async update(id: number, input: ArticleInput) {
    const r = await this.get(id);
    const v = this.check({ ...r, ...input });
    const slug = v.slug || r.slug;
    await this.uniqueSlug(slug, id);
    Object.assign(r, v, { slug, publishedAt: v.publishedAt ?? (v.status === 'published' ? new Date() : null) });
    return this.repo.save(r);
  }

  async remove(id: number) {
    await this.repo.remove(await this.get(id));
    return { ok: true };
  }

  async seed(items: ArticleInput[]) {
    if ((await this.repo.count()) > 0) return 0;
    for (const it of items) await this.repo.save(this.repo.create({ ...this.check(it), slug: String(it.slug), publishedAt: new Date() }));
    return items.length;
  }
}
