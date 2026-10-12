import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * One polymorphic table for every simple CMS collection on the site
 * (services, FAQs, steps, quote options, page photos, …).
 * `type` is the discriminator; `fields` holds the type-specific values
 * validated against CONTENT_TYPES in content.schemas.ts.
 */
@Entity('content_blocks')
@Index(['type', 'sortOrder'])
export class ContentBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'simple-json' })
  fields: Record<string, unknown>;

  @Column({ default: true })
  published: boolean;

  /** Reserved for sample rows (unused on this site). */
  @Column({ default: false })
  isSample: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
