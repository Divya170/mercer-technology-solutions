import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './settings.entity';
import { UpdateSettingsDto } from './settings.dto';
import { telHref } from '../common/utils';
import { SETTINGS_SEED } from '../database/seed-data';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Settings) private readonly repo: Repository<Settings>) {}

  async ensure(): Promise<Settings> {
    const existing = await this.repo.findOne({ where: { id: 1 } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ id: 1, ...SETTINGS_SEED }));
  }

  get(): Promise<Settings> {
    return this.ensure();
  }

  /** Sample rows are visible only while this is on. */
  async showSamples() {
    return (await this.ensure()).showSamples;
  }

  async getPublic() {
    const s = await this.ensure();
    return {
      companyName: s.companyName,
      contactName: s.contactName,
      email: s.email,
      phone: s.phone,
      mailHref: s.email ? `mailto:${s.email}` : null,
      telHref: telHref(s.phone),
      addressLine1: s.addressLine1,
      addressLine2: s.addressLine2,
      locationTag: s.locationTag,
      companyStatement: s.companyStatement,
      companyOverview: s.companyOverview,
      companyFocus: s.companyFocus,
      hasPrivacyPolicy: !!s.privacyPolicy.trim(),
      privacyPolicy: s.privacyPolicy,
      showSamples: s.showSamples,
      showBudget: s.showBudget,
      enquiriesOpen: s.enquiriesOpen,
    };
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    const s = await this.ensure();
    const clean = (v: string | null | undefined) => (v === undefined ? undefined : v === null || v.trim() === '' ? null : v.trim());
    if (dto.companyName !== undefined) s.companyName = dto.companyName.trim();
    const email = clean(dto.email);
    if (email !== undefined) s.email = email ? email.toLowerCase() : null;
    for (const k of ['phone', 'addressLine1', 'addressLine2'] as const) {
      const v = clean(dto[k]);
      if (v !== undefined) s[k] = v;
    }
    for (const k of ['contactName', 'locationTag', 'companyStatement', 'companyOverview', 'companyFocus', 'privacyPolicy'] as const) {
      const v = dto[k];
      if (v !== undefined) s[k] = v.trim();
    }
    for (const k of ['showSamples', 'showBudget', 'enquiriesOpen'] as const) {
      const v = dto[k];
      if (v !== undefined) s[k] = v;
    }
    return this.repo.save(s);
  }
}
