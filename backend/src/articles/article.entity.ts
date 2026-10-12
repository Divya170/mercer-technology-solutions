import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { PublishStatus } from '../services/service.entity';

/** Insights article. Published with a future publishedAt = scheduled. */
@Entity('articles')
@Index(['status', 'publishedAt'])
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column({ type: 'text', default: '' })
  excerpt: string;

  /** Plain text; blank lines separate paragraphs */
  @Column({ type: 'text', default: '' })
  body: string;

  @Column({ default: '' })
  author: string;

  @Column({ default: 0 })
  readingMinutes: number;

  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Column({ default: '' })
  imageAlt: string;

  @Column({ default: false })
  featured: boolean;

  @Column({ type: 'varchar', default: 'draft' })
  status: PublishStatus;

  @Column({ type: 'datetime', nullable: true })
  publishedAt: Date | null;

  @Column({ default: false })
  isSample: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
