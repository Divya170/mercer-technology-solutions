import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { PublishStatus } from '../services/service.entity';

/** Published only with client approval and verified outcomes (API-CONTRACT.md). */
@Entity('case_studies')
export class CaseStudy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  /** Approved client name or description */
  @Column({ default: '' })
  client: string;

  /** Related solution (service slug) */
  @Column()
  serviceSlug: string;

  @Column({ type: 'text', default: '' }) context: string;
  @Column({ type: 'text', default: '' }) challenge: string;
  @Column({ type: 'text', default: '' }) approach: string;
  @Column({ type: 'text', default: '' }) scope: string;
  @Column({ type: 'text', default: '' }) implementation: string;
  /** Verified outcomes only */
  @Column({ type: 'text', default: '' }) outcomes: string;

  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Column({ default: '' })
  imageAlt: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: PublishStatus;

  @Column({ default: false })
  isSample: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
