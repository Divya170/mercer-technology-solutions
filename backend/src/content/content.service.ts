import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { ContentBlock } from './content-block.entity';
import { CONTENT_TYPE_MAP, CONTENT_TYPES, ContentTypeDef } from './content.schemas';
import { validateContentFields } from './content.validation';
import { SettingsService } from '../settings/settings.service';
import { ServicesService } from '../services/services.service';

export interface ContentWriteInput {
  type?: string;
  fields?: Record<string, unknown>;
  published?: boolean;
  isSample?: boolean;
}

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentBlock) private readonly repo: Repository<ContentBlock>,
    private readonly settings: SettingsService,
    private readonly services: ServicesService,
  ) {}

  types() {
    return CONTENT_TYPES;
  }

  private def(type: string): ContentTypeDef {
    const def = CONTENT_TYPE_MAP.get(type);
    if (!def) throw new BadRequestException(`Unknown content type "${type}".`);
    return def;
  }

  /**
   * Public read: published rows for the requested types, grouped by type.
   * Sample rows only appear while "Show sample content" is on.
   */
  async publicBundle(typesParam: string) {
    const types = (typesParam || '').split(',').map((t) => t.trim()).filter((t) => CONTENT_TYPE_MAP.has(t));
    const out: Record<string, unknown[]> = {};
    if (!types.length) return out;
    const [rows, samples] = await Promise.all([this.repo.find({ where: { type: In(types), published: true }, order: { sortOrder: 'ASC', id: 'ASC' } }), this.settings.showSamples()]);
    for (const t of types) out[t] = [];
    for (const row of rows) {
      if (row.isSample && !samples) continue;
      const list = out[row.type];
      list.push({ id: row.id, num: String(list.length + 1).padStart(2, '0'), isSample: row.isSample, ...row.fields });
    }
    return out;
  }

  /** Public detail by slug for types with a slugField (e.g. /careers/:slug). */
  async publicItem(type: string, slug: string) {
    const def = this.def(type);
    if (!def.slugField) throw new NotFoundException('Not found.');
    const bundle = await this.publicBundle(type);
    const item = (bundle[type] as Record<string, unknown>[]).find((x) => x[def.slugField as string] === slug);
    if (!item) throw new NotFoundException('This page isn’t available.');
    return item;
  }

  /** Published labels of a type (e.g. quote help options) — used for server-side validation. */
  async publishedValues(type: string, key: string): Promise<string[]> {
    const rows = await this.repo.find({ where: { type, published: true }, order: { sortOrder: 'ASC', id: 'ASC' } });
    return rows.map((r) => String(r.fields[key] ?? '')).filter(Boolean);
  }

  /** { slot: { url, alt } } for every published page photo. */
  async siteImages() {
    const rows = await this.repo.find({ where: { type: 'site-image', published: true }, order: { updatedAt: 'DESC' } });
    const map: Record<string, { url: string; alt: string }> = {};
    for (const r of rows) {
      const slot = String(r.fields.slot || '');
      if (slot && !map[slot] && r.fields.image) map[slot] = { url: String(r.fields.image), alt: String(r.fields.alt || '') };
    }
    return map;
  }

  async adminList(type: string) {
    this.def(type);
    return this.repo.find({ where: { type }, order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async counts() {
    const raw = await this.repo
      .createQueryBuilder('c')
      .select('c.type', 'type')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN c.published = 1 THEN 1 ELSE 0 END)', 'published')
      .groupBy('c.type')
      .getRawMany<{ type: string; total: string; published: string }>();
    return Object.fromEntries(raw.map((r) => [r.type, { total: Number(r.total), published: Number(r.published) }]));
  }

  private async validate(def: ContentTypeDef, fields: Record<string, unknown>) {
    const { value, errors } = validateContentFields(def, fields || {}, { serviceSlugs: await this.services.allSlugs() });
    if (Object.keys(errors).length) {
      const n = Object.keys(errors).length;
      throw new BadRequestException({ message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`, errors });
    }
    return value;
  }

  /** Detail slugs must be unique within a type. */
  private async ensureUniqueSlug(def: ContentTypeDef, fields: Record<string, unknown>, id?: number) {
    if (!def.slugField) return;
    const slug = fields[def.slugField];
    const rows = await this.repo.find({ where: { type: def.type } });
    if (rows.some((r) => r.id !== id && r.fields[def.slugField as string] === slug)) {
      throw new BadRequestException({ message: 'That URL slug is already used.', errors: { [def.slugField]: 'That URL slug is already used by another item.' } });
    }
  }

  /** For types with uniqueBy (site images): publishing one hides the others with the same key. */
  private async enforceUnique(def: ContentTypeDef, row: ContentBlock) {
    if (!def.uniqueBy || !row.published) return;
    const key = row.fields[def.uniqueBy];
    const others = await this.repo.find({ where: { type: def.type, published: true, id: Not(row.id) } });
    const clash = others.filter((o) => o.fields[def.uniqueBy as string] === key);
    if (clash.length) await this.repo.save(clash.map((o) => ({ ...o, published: false })));
  }

  async create(input: ContentWriteInput) {
    if (!input.type) throw new BadRequestException('Content type is required.');
    const def = this.def(input.type);
    const fields = await this.validate(def, input.fields || {});
    await this.ensureUniqueSlug(def, fields);
    const max = await this.repo
      .createQueryBuilder('c')
      .select('MAX(c.sortOrder)', 'max')
      .where('c.type = :type', { type: def.type })
      .getRawOne<{ max: number | null }>();
    const row = await this.repo.save(
      this.repo.create({
        type: def.type,
        fields,
        published: input.published ?? true,
        isSample: def.sampleable ? !!input.isSample : false,
        sortOrder: (max?.max ?? 0) + 1,
      }),
    );
    await this.enforceUnique(def, row);
    return row;
  }

  async update(id: number, input: ContentWriteInput) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Content item not found.');
    const def = this.def(row.type);
    if (input.fields !== undefined) {
      row.fields = await this.validate(def, { ...row.fields, ...input.fields });
      await this.ensureUniqueSlug(def, row.fields, row.id);
    }
    if (input.published !== undefined) row.published = !!input.published;
    if (input.isSample !== undefined) row.isSample = def.sampleable ? !!input.isSample : false;
    const saved = await this.repo.save(row);
    await this.enforceUnique(def, saved);
    return saved;
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Content item not found.');
    await this.repo.remove(row);
    return { ok: true };
  }

  async reorder(type: string, ids: number[]) {
    this.def(type);
    const rows = await this.repo.find({ where: { type, id: In(ids) } });
    if (rows.length !== ids.length) throw new BadRequestException('Reorder list does not match items of this type.');
    await Promise.all(ids.map((id, i) => this.repo.update({ id }, { sortOrder: i + 1 })));
    return this.adminList(type);
  }

  /** Used by the seeder. */
  async seedType(type: string, items: { fields: Record<string, unknown>; isSample?: boolean }[]) {
    if ((await this.repo.count({ where: { type } })) > 0) return 0;
    await this.repo.save(items.map((it, i) => this.repo.create({ type, fields: it.fields, sortOrder: i + 1, published: true, isSample: !!it.isSample })));
    return items.length;
  }
}
