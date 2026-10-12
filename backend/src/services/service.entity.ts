import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const PUBLISH_STATUSES = ['published', 'draft'] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export interface Consideration {
  title: string;
  body: string;
}

/** A capability ("solution"). Drives the home cards, explorer, stack toggles, footer and the enquiry "Area of interest". */
@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  short: string;

  @Column({ type: 'text', default: '' })
  overview: string;

  @Column({ type: 'simple-json' })
  problems: string[];

  @Column({ type: 'simple-json' })
  scope: string[];

  @Column({ type: 'simple-json' })
  considerations: Consideration[];

  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Column({ default: '' })
  imageAlt: string;

  /** Caption shown on the placeholder until a photo is uploaded */
  @Column({ default: '' })
  imageLabel: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: PublishStatus;

  /** Unconfirmed/sample service — visible only while "Show sample content" is on */
  @Column({ default: false })
  isSample: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
