import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Singleton row (id = 1): company contact details, company copy and design flags. */
@Entity('settings')
export class Settings {
  @PrimaryColumn({ type: 'integer' })
  id: number;

  @Column({ default: 'Mercer Technology Solutions' })
  companyName: string;

  /** "Primary contact" on the Company and Contact pages */
  @Column({ default: '' })
  contactName: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  addressLine1: string | null;

  @Column({ type: 'varchar', nullable: true })
  addressLine2: string | null;

  /** Hero strip tag, e.g. "PHOENIX, AZ · 33.45°N 112.07°W" */
  @Column({ default: '' })
  locationTag: string;

  /** Large statement on the Company page */
  @Column({ type: 'text', default: '' })
  companyStatement: string;

  /** Extended company overview. Empty → the design's "to be supplied" placeholder. */
  @Column({ type: 'text', default: '' })
  companyOverview: string;

  @Column({ default: '' })
  companyFocus: string;

  /** Empty → "Privacy policy — to be published"; set → /privacy page + consent link */
  @Column({ type: 'text', default: '' })
  privacyPolicy: string;

  /** design prop `showSamples` (v1 `showDrafts`) — must be off in production */
  @Column({ default: true })
  showSamples: boolean;

  /** design prop `showBudget` */
  @Column({ default: true })
  showBudget: boolean;

  @Column({ default: true })
  enquiriesOpen: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
