import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Inquiry } from './inquiry.entity';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/**
 * Emails the team when a new lead arrives. Optional: enabled only when
 * SMTP_HOST is set. Never blocks or fails the visitor's submission.
 */
@Injectable()
export class NotifierService {
  private readonly logger = new Logger('Notifier');
  private transporter: Transporter | null = null;

  get configured() {
    return !!process.env.SMTP_HOST;
  }

  private transport(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
      });
    }
    return this.transporter;
  }

  async sendNewLead(l: Inquiry, fallbackTo: string | null): Promise<void> {
    const to = process.env.NOTIFY_TO || fallbackTo;
    if (!to) throw new Error('No recipient: set NOTIFY_TO or the company email in Settings.');
    const link = process.env.ADMIN_URL || 'http://localhost:3000/admin/leads';
    const rows: [string, string][] = [
      ['Reference', l.reference],
      ['Name', l.name],
      ['Email', l.email],
      ['Company', l.company],
      ['Job title', l.jobTitle || '—'],
      ['Phone', l.phone || '—'],
      ['Interest', l.interestLabel || l.interest],
      ['Timeline', l.timeline],
      ['Budget', l.budget || '—'],
    ];
    await this.transport().sendMail({
      from: process.env.NOTIFY_FROM || 'Mercer Website <no-reply@localhost>',
      to,
      replyTo: l.email,
      subject: `New project enquiry ${l.reference} — ${l.company}`,
      text: `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${l.overview}\n\nOpen in admin: ${link}?id=${l.id}`,
      html: `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows
        .map(([k, v]) => `<tr><td style="color:#5E5878">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`)
        .join('')}</table><p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap;background:#F6F3FF;padding:12px">${esc(l.overview)}</p><p><a href="${esc(link)}?id=${l.id}">Open in admin</a></p>`,
    });
    this.logger.log(JSON.stringify({ event: 'lead.notified', ref: l.reference }));
  }
}
