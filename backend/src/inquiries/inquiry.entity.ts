import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'closed', 'spam'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const NOTIFICATION_STATUSES = ['not-configured', 'pending', 'sent', 'failed'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/** Project enquiry — the `leads` record from API-CONTRACT.md. */
@Entity('leads')
@Index(['status', 'createdAt'])
@Index(['email', 'createdAt'])
export class Inquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human-friendly reference shown on the success card, e.g. MTS-7K2Q9D */
  @Column({ unique: true })
  reference: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  clientRequestId: string | null;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  company: string;

  @Column({ type: 'varchar', nullable: true })
  jobTitle: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  /** Service slug or "not-sure" */
  @Column()
  interest: string;

  /** Service name snapshot at submission time */
  @Column({ default: '' })
  interestLabel: string;

  @Column({ type: 'text' })
  overview: string;

  @Column()
  timeline: string;

  @Column({ type: 'varchar', nullable: true })
  budget: string | null;

  @Column({ type: 'datetime' })
  consentAt: Date;

  @Column({ default: 'website' })
  source: string;

  @Column({ type: 'datetime', nullable: true })
  formStartedAt: Date | null;

  @Column({ type: 'varchar', default: 'new' })
  status: LeadStatus;

  @Column({ default: '' })
  assignedTo: string;

  @Column({ type: 'text', default: '' })
  notes: string;

  /** Due for deletion after this date (LEAD_RETENTION_DAYS) */
  @Column({ type: 'datetime' })
  retentionUntil: Date;

  @Column({ type: 'varchar', default: 'not-configured' })
  notificationStatus: NotificationStatus;

  @Column({ type: 'varchar', nullable: true })
  notificationError: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
