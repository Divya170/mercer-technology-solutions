'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { LeadOptions } from '@/lib/types';
import { EMPTY_FORM, EnquiryForm as Form, FIELDS, newRequestId, validateAll, validateField } from '@/lib/validation';

interface Props {
  options: LeadOptions;
  initialInterest: string;
  email: string | null;
  phone: string | null;
  privacyHref: string | null;
}

type Errors = Record<string, string>;
const LABEL_ID: Record<string, string> = { jobTitle: 'title' };

/** "Project enquiry" — POST /api/inquiries. Only a 2xx response is treated as success (API-CONTRACT.md). */
export function EnquiryForm({ options, initialInterest, email, phone, privacyHref }: Props) {
  const validInterest = (v: string) => options.interests.some((o) => o.value === v);
  const [f, setF] = useState<Form>({ ...EMPTY_FORM, interest: validInterest(initialInterest) ? initialInterest : '' });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'success'>('idle');
  const [failMsg, setFailMsg] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const requestId = useRef<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Follow ?interest= when arriving from a solution or case study
  useEffect(() => {
    if (validInterest(initialInterest) && status !== 'success') setF((x) => ({ ...x, interest: initialInterest }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInterest]);

  const onField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const t = e.target as HTMLInputElement;
    const name = t.name as keyof Form;
    const v = t.type === 'checkbox' ? t.checked : t.value;
    const next = { ...f, [name]: v } as Form;
    setF(next);
    if (touched[name] || showSummary || t.type === 'checkbox' || errors[name]) {
      const m = validateField(name, next);
      setErrors((er) => {
        const o = { ...er };
        if (m) o[name] = m;
        else delete o[name];
        if (showSummary && !Object.keys(o).length) setShowSummary(false);
        return o;
      });
    }
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const n = e.target.name;
    setTouched((t) => ({ ...t, [n]: true }));
    const m = validateField(n, f);
    setErrors((er) => {
      const o = { ...er };
      if (m) o[n] = m;
      else delete o[n];
      return o;
    });
  };

  const fail = (msg: string) => {
    setStatus('error');
    setFailMsg(msg);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    const errs = validateAll(f) as Errors;
    if (Object.keys(errs).length) {
      setErrors(errs);
      setShowSummary(true);
      setStatus('idle');
      setTimeout(() => summaryRef.current?.focus(), 30);
      return;
    }
    if (!requestId.current) requestId.current = newRequestId();
    setStatus('sending');
    setShowSummary(false);
    setFailMsg('');
    const payload = {
      name: f.name.trim(),
      email: f.email.trim().toLowerCase(),
      company: f.company.trim(),
      jobTitle: f.title.trim() || null,
      phone: f.phone.trim() || null,
      interest: f.interest,
      overview: f.overview.trim(),
      timeline: f.timeline,
      budget: options.showBudget ? f.budget || null : null,
      consent: true,
      meta: { source: 'website-contact', formStartedAt: new Date(startedAt.current).toISOString(), hp: f.website },
    };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Idempotency-Key': requestId.current },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      let body: { message?: string | string[]; errors?: Errors; reference?: string | null } = {};
      try {
        body = await res.json();
      } catch {
        /* non-JSON */
      }
      const msg = Array.isArray(body.message) ? body.message[0] : body.message;
      if (res.ok) {
        setReference(body.reference || null);
        setStatus('success');
        requestId.current = null;
        setTimeout(() => successRef.current?.focus(), 30);
        return;
      }
      if (res.status === 422) {
        const fe = body.errors;
        if (fe && typeof fe === 'object') {
          const mapped: Errors = {};
          Object.entries(fe).forEach(([k, v]) => (mapped[LABEL_ID[k] || k] = v));
          setErrors(mapped);
          setShowSummary(true);
          setStatus('idle');
          setTimeout(() => summaryRef.current?.focus(), 30);
          return;
        }
        return fail('Some details could not be accepted. Please review the form and try again.');
      }
      if (res.status === 429) return fail(msg || 'Too many submissions from this connection. Please wait a few minutes and try again.');
      if (res.status === 400 || res.status === 503) return fail(msg || 'Something went wrong while sending. Please try again in a moment.');
      return fail(`Our server could not process the enquiry. Please try again${email ? `, or email ${email}` : ''}.`);
    } catch {
      return fail('We could not reach the server. Check your connection and try again.');
    } finally {
      clearTimeout(timer);
    }
  };

  const reset = () => {
    startedAt.current = Date.now();
    setF({ ...EMPTY_FORM });
    setErrors({});
    setTouched({});
    setStatus('idle');
    setShowSummary(false);
    setReference(null);
    setTimeout(() => document.getElementById('f-name')?.focus(), 30);
  };

  if (status === 'success') {
    return (
      <div ref={successRef} role="status" tabIndex={-1} className="success">
        <span aria-hidden="true" className="success__check">
          ✓
        </span>
        <h2 className="d" style={{ fontSize: 28, letterSpacing: '-.04em', lineHeight: 1.15 }}>
          Thank you. Your enquiry has been received.
        </h2>
        <p className="body" style={{ fontSize: 16 }}>
          We&apos;ll review the details you shared and reply to the email address you provided.
          {email && (
            <>
              {' '}
              If anything changes in the meantime, you can reach us at <a href={`mailto:${email}`}>{email}</a>.
            </>
          )}
        </p>
        {reference && (
          <p className="small">
            Your reference: <span className="ref">{reference}</span>
          </p>
        )}
        <div className="flex-wrap" style={{ gap: 10 }}>
          <Link href="/solutions" className="btn btn--md">
            Explore our solutions →
          </Link>
          <button type="button" className="btn btn--md btn-outline" onClick={reset}>
            Send another enquiry
          </button>
        </div>
      </div>
    );
  }

  const order = [...FIELDS.slice(0, 3), 'title', ...FIELDS.slice(3), 'budget'];
  const errList = order.filter((k) => errors[k]).map((k) => ({ k, msg: errors[k] }));
  const sending = status === 'sending';
  const aria = (k: string, help?: string) => ({
    'aria-invalid': errors[k] ? (true as const) : undefined,
    'aria-describedby': [help, errors[k] ? `e-${k}` : ''].filter(Boolean).join(' ') || undefined,
  });
  const Err = ({ k }: { k: string }) =>
    errors[k] ? (
      <p id={`e-${k}`} className="field-err">
        {errors[k]}
      </p>
    ) : null;
  const mailBody = encodeURIComponent(`Name: ${f.name}\nCompany: ${f.company}\nInterest: ${options.interests.find((o) => o.value === f.interest)?.label || f.interest}\nTimeline: ${f.timeline}\n\n${f.overview}`);
  const mailto = email ? `mailto:${email}?subject=${encodeURIComponent(`Project enquiry — ${f.company || 'Website'}`)}&body=${mailBody}` : null;

  return (
    <form noValidate onSubmit={submit} aria-labelledby="form-title" className="col" style={{ gap: 20 }}>
      <div className="flex-wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <h2 id="form-title" className="d" style={{ fontSize: 24 }}>
          Project enquiry
        </h2>
        <p className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
          <span aria-hidden="true" className="req">
            *
          </span>{' '}
          Required<span className="sr-only"> fields are marked with an asterisk</span>
        </p>
      </div>

      {!options.enquiriesOpen && (
        <div role="note" className="alert-warn">
          <p>Online enquiries are paused.</p>
          <p className="msg">
            Please email {email ? <a href={`mailto:${email}`}>{email}</a> : 'us'}
            {phone ? ` or call ${phone}` : ''}.
          </p>
        </div>
      )}

      {showSummary && errList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="alert-err">
          <p>Please check {errList.length === 1 ? '1 field' : `${errList.length} fields`} before sending:</p>
          <ul className="col" style={{ margin: 0, paddingLeft: 18, gap: 4 }}>
            {errList.map((er) => (
              <li key={er.k}>
                <a
                  href={`#f-${er.k}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`f-${er.k}`)?.focus();
                  }}
                >
                  {er.msg}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="alert-warn">
          <p>Your enquiry was not sent.</p>
          <p className="msg">{failMsg}</p>
          <div className="flex-wrap" style={{ gap: 10 }}>
            <button type="submit" className="btn btn--sm">
              Try again
            </button>
            {mailto && (
              <a href={mailto} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 6px', fontWeight: 600 }}>
                Email your enquiry instead
              </a>
            )}
          </div>
        </div>
      )}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="f-name">
            Full name <span aria-hidden="true" className="req">*</span>
          </label>
          <input id="f-name" name="name" type="text" autoComplete="name" maxLength={120} aria-required="true" className="control" value={f.name} onChange={onField} onBlur={onBlur} {...aria('name')} />
          <Err k="name" />
        </div>
        <div className="field">
          <label htmlFor="f-email">
            Business email <span aria-hidden="true" className="req">*</span>
          </label>
          <input id="f-email" name="email" type="email" autoComplete="email" maxLength={254} aria-required="true" className="control" value={f.email} onChange={onField} onBlur={onBlur} {...aria('email')} />
          <Err k="email" />
        </div>
        <div className="field">
          <label htmlFor="f-company">
            Company name <span aria-hidden="true" className="req">*</span>
          </label>
          <input id="f-company" name="company" type="text" autoComplete="organization" maxLength={160} aria-required="true" className="control" value={f.company} onChange={onField} onBlur={onBlur} {...aria('company')} />
          <Err k="company" />
        </div>
        <div className="field">
          <label htmlFor="f-title">
            Job title <span className="opt">(optional)</span>
          </label>
          <input id="f-title" name="title" type="text" autoComplete="organization-title" maxLength={120} className="control" value={f.title} onChange={onField} {...aria('title')} />
          <Err k="title" />
        </div>
        <div className="field">
          <label htmlFor="f-phone">
            Phone number <span className="opt">(optional)</span>
          </label>
          <input id="f-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} className="control" value={f.phone} onChange={onField} onBlur={onBlur} {...aria('phone')} />
          <Err k="phone" />
        </div>
        <div className="field">
          <label htmlFor="f-interest">
            Area of interest <span aria-hidden="true" className="req">*</span>
          </label>
          <select id="f-interest" name="interest" aria-required="true" className="control" value={f.interest} onChange={onField} onBlur={onBlur} {...aria('interest')}>
            <option value="">Select an area</option>
            {options.interests.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Err k="interest" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-overview">
          Project overview / business challenge <span aria-hidden="true" className="req">*</span>
        </label>
        <textarea id="f-overview" name="overview" rows={5} maxLength={4000} aria-required="true" className="control" value={f.overview} onChange={onField} onBlur={onBlur} {...aria('overview', 'h-overview')} />
        <p id="h-overview" className="help" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>Current systems, what needs to change, and any constraints.</span>
          <span className="mono">{f.overview.length} / 4000</span>
        </p>
        <Err k="overview" />
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="f-timeline">
            Expected timeline <span aria-hidden="true" className="req">*</span>
          </label>
          <select id="f-timeline" name="timeline" aria-required="true" className="control" value={f.timeline} onChange={onField} onBlur={onBlur} {...aria('timeline')}>
            <option value="">Select a timeline</option>
            {options.timelines.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <Err k="timeline" />
        </div>
        {options.showBudget && (
          <div className="field">
            <label htmlFor="f-budget">
              Estimated budget <span className="opt">(optional)</span>
            </label>
            <select id="f-budget" name="budget" className="control" value={f.budget} onChange={onField} {...aria('budget')}>
              <option value="">Select a range</option>
              {options.budgets.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <Err k="budget" />
          </div>
        )}
      </div>

      <div aria-hidden="true" className="honeypot">
        <label htmlFor="f-website">Website</label>
        <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={onField} />
      </div>

      <div className="field">
        <label htmlFor="f-consent" className="consent">
          <input id="f-consent" name="consent" type="checkbox" checked={f.consent} onChange={onField} aria-required="true" {...aria('consent')} />
          <span>
            I agree that Mercer Technology Solutions may store and use these details to respond to my enquiry. <span aria-hidden="true" className="req">*</span>{' '}
            {privacyHref ? (
              <Link href={privacyHref} target="_blank">
                Read the privacy policy
              </Link>
            ) : (
              <span style={{ color: 'var(--muted)' }}>[Privacy policy link — add when published]</span>
            )}
          </span>
        </label>
        {errors.consent && (
          <p id="e-consent" className="field-err" style={{ paddingLeft: 32 }}>
            {errors.consent}
          </p>
        )}
      </div>

      <button type="submit" className="btn" disabled={sending || !options.enquiriesOpen} aria-busy={sending} style={{ height: 58, fontSize: 16, boxShadow: '0 0 30px rgba(185,166,255,.3)' }}>
        {sending && <span aria-hidden="true" className="spinner" />}
        {sending ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
