'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminArticle } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, ImageField, LoadingRows, Modal, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';
import { fromLocalInput, SLUG_RE, toLocalInput } from '@/components/admin/helpers';

interface Form {
  id?: number;
  title: string;
  slug: string;
  category: string;
  author: string;
  excerpt: string;
  body: string;
  readingMinutes: string;
  publishedAt: string; // datetime-local value
  image: string;
  imageAlt: string;
  featured: boolean;
  status: 'published' | 'draft';
  isSample: boolean;
}

const BLANK: Form = { title: '', slug: '', category: '', author: '', excerpt: '', body: '', readingMinutes: '', publishedAt: '', image: '', imageAlt: '', featured: false, status: 'draft', isSample: false };

const toForm = (a: AdminArticle): Form => ({
  id: a.id,
  title: a.title,
  slug: a.slug,
  category: a.category,
  author: a.author,
  excerpt: a.excerpt,
  body: a.body,
  readingMinutes: a.readingMinutes ? String(a.readingMinutes) : '',
  publishedAt: toLocalInput(a.publishedAt),
  image: a.image || '',
  imageAlt: a.imageAlt,
  featured: a.featured,
  status: a.status,
  isSample: a.isSample,
});

const toBody = (f: Form) => ({
  title: f.title.trim(),
  slug: f.slug.trim().toLowerCase(),
  category: f.category.trim(),
  author: f.author.trim(),
  excerpt: f.excerpt.trim(),
  body: f.body.trim(),
  readingMinutes: f.readingMinutes.trim(), // '' = calculate from the text
  publishedAt: fromLocalInput(f.publishedAt), // '' = now (when published)
  image: f.image.trim(),
  imageAlt: f.imageAlt.trim(),
  featured: f.featured,
  status: f.status,
  isSample: f.isSample,
});

function validate(f: Form) {
  const e: Record<string, string> = {};
  if (f.title.trim().length < 4) e.title = 'Enter a title of at least 4 characters.';
  else if (f.title.trim().length > 200) e.title = 'Use 200 characters or fewer.';
  const slug = f.slug.trim().toLowerCase();
  if (slug && !SLUG_RE.test(slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  if (f.category.trim().length < 2) e.category = 'Enter a category.';
  else if (f.category.trim().length > 40) e.category = 'Use 40 characters or fewer.';
  if (f.excerpt.trim().length > 400) e.excerpt = 'Use 400 characters or fewer.';
  if (f.body.trim().length > 60000) e.body = 'Use 60,000 characters or fewer.';
  const mins = f.readingMinutes.trim();
  if (mins && (!/^\d+$/.test(mins) || Number(mins) < 1 || Number(mins) > 120)) e.readingMinutes = 'Enter whole minutes between 1 and 120, or leave blank.';
  if (f.publishedAt && !fromLocalInput(f.publishedAt)) e.publishedAt = 'Enter a valid date and time.';
  const img = f.image.trim();
  if (img && !/^(\/uploads\/[\w.-]+|https:\/\/\S+)$/.test(img)) e.image = 'Upload an image or use an https:// URL.';
  if (f.status === 'published') {
    if (f.excerpt.trim().length < 10) e.excerpt = 'Write a short excerpt (at least 10 characters) to publish.';
    if (f.body.trim().length < 20) e.body = 'Write the article body (at least 20 characters) to publish.';
  }
  return e;
}

type State = 'draft' | 'scheduled' | 'published';
const stateOf = (a: AdminArticle, now: number): State => (a.status !== 'published' ? 'draft' : a.publishedAt && new Date(a.publishedAt).getTime() > now ? 'scheduled' : 'published');

const FILTERS: { value: 'all' | State; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Drafts' },
];

export default function InsightsAdminPage() {
  const { toast } = useAdmin();
  const [items, setItems] = useState<AdminArticle[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | State>('all');
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<AdminArticle | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setError('');
    api<AdminArticle[]>('/articles/admin/all', { admin: true })
      .then(setItems)
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const now = Date.now();
  const counts = useMemo(() => {
    const c = { all: 0, published: 0, scheduled: 0, draft: 0 };
    for (const a of items || []) {
      c.all++;
      c[stateOf(a, now)]++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const categories = useMemo(() => Array.from(new Set((items || []).map((a) => a.category).filter(Boolean))).sort(), [items]);

  const shown = (items || []).filter((a) => {
    if (filter !== 'all' && stateOf(a, now) !== filter) return false;
    const q = search.trim().toLowerCase();
    return !q || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.author.toLowerCase().includes(q);
  });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEdit((p) => (p ? { ...p, [k]: v } : p));

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!edit) return;
    const fe = validate(edit);
    setErrors(fe);
    if (Object.keys(fe).length) return;
    setSaving(true);
    try {
      if (edit.id) await api(`/articles/${edit.id}`, { method: 'PATCH', admin: true, body: toBody(edit) });
      else await api('/articles', { method: 'POST', admin: true, body: toBody(edit) });
      toast(edit.id ? 'Article saved.' : 'Article added.');
      setEdit(null);
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      setErrors(ce.errors || {});
      toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (a: AdminArticle) => {
    const publishing = a.status !== 'published';
    if (publishing) {
      const f = { ...toForm(a), status: 'published' as const };
      const fe = validate(f);
      if (Object.keys(fe).length) {
        toast('Complete the highlighted fields before publishing.', true);
        setErrors(fe);
        setEdit(f);
        return;
      }
    }
    setBusyId(a.id);
    try {
      await api(`/articles/${a.id}`, { method: 'PATCH', admin: true, body: { status: publishing ? 'published' : 'draft' } });
      toast(publishing ? 'Published.' : 'Moved to draft.');
      load();
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setBusyId(null);
    }
  };

  const tag = (a: AdminArticle) => {
    const s = stateOf(a, now);
    return s === 'draft' ? <StatusTag kind="draft">DRAFT</StatusTag> : s === 'scheduled' ? <StatusTag kind="new">SCHEDULED</StatusTag> : null;
  };

  return (
    <>
      <AdminHeader eyebrow="CONTENT" title="Insights">
        <button
          type="button"
          className="btn btn--sm btn-dark"
          onClick={() => {
            setErrors({});
            setEdit({ ...BLANK });
          }}
        >
          + Add article
        </button>
      </AdminHeader>

      <div className="adm-chips" role="group" aria-label="Filter by state">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" className="chipbtn" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label} ({counts[f.value]})
          </button>
        ))}
      </div>
      <div className="adm-filters">
        <label className="searchbox" style={{ flex: '0 1 320px' }}>
          Search
          <input className="input" type="search" placeholder="Title, category or author" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>

      <div className="adm-panel">
        {error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : !items ? (
          <LoadingRows />
        ) : shown.length === 0 ? (
          <EmptyBox>{items.length === 0 ? 'No articles yet. The Insights page shows its empty state until one is published.' : 'No articles match these filters.'}</EmptyBox>
        ) : (
          shown.map((a) => (
            <div key={a.id} className="flex-wrap" style={{ gap: 12, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--line)', opacity: a.status === 'published' ? 1 : 0.7 }}>
              {a.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image} alt="" className="thumb" />
              ) : (
                <span className="thumb" style={{ display: 'inline-block' }} />
              )}
              <div className="col min0" style={{ flex: '1 1 240px', gap: 4 }}>
                <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{a.title}</span>
                <span className="small">
                  {a.category}
                  {a.author ? ` · ${a.author}` : ''} · {a.publishedAt ? formatDateTime(a.publishedAt) : 'not dated'}
                </span>
              </div>
              <div className="flex-wrap" style={{ gap: 6 }}>
                {tag(a)}
                {a.featured && <StatusTag kind="new">FEATURED</StatusTag>}
                {a.isSample && <StatusTag kind="sample">SAMPLE</StatusTag>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button type="button" className="iconbtn" disabled={busyId === a.id} onClick={() => togglePublished(a)}>
                  {a.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => {
                    setErrors({});
                    setEdit(toForm(a));
                  }}
                >
                  Edit
                </button>
                <button type="button" className="iconbtn" style={{ color: 'var(--error)' }} onClick={() => setDel(a)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {edit && (
        <Modal title={edit.id ? `Edit — ${edit.title || 'article'}` : 'Add article'} onClose={() => setEdit(null)} wide>
          <form onSubmit={save} noValidate className="adm-form">
            <Field id="ar-title" label="Title *" error={errors.title}>
              <input id="ar-title" className="control" maxLength={200} value={edit.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!errors.title} />
            </Field>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <Field id="ar-category" label="Category *" error={errors.category} help="Pick an existing one or type a new one.">
                <input id="ar-category" className="control" maxLength={40} list="ar-categories" value={edit.category} onChange={(e) => set('category', e.target.value)} aria-invalid={!!errors.category} />
                <datalist id="ar-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field id="ar-author" label="Author" error={errors.author}>
                <input id="ar-author" className="control" maxLength={120} value={edit.author} onChange={(e) => set('author', e.target.value)} />
              </Field>
              <Field id="ar-mins" label="Reading time (minutes)" error={errors.readingMinutes} help="Leave blank to calculate from the text.">
                <input id="ar-mins" className="control" inputMode="numeric" maxLength={3} value={edit.readingMinutes} onChange={(e) => set('readingMinutes', e.target.value)} aria-invalid={!!errors.readingMinutes} />
              </Field>
            </div>
            <Field id="ar-slug" label="Page address (slug)" error={errors.slug} help={edit.id ? 'Changing this breaks existing links to the article.' : 'Leave blank to create it from the title.'}>
              <input id="ar-slug" className="control" maxLength={100} value={edit.slug} onChange={(e) => set('slug', e.target.value)} aria-invalid={!!errors.slug} />
            </Field>
            <Field id="ar-excerpt" label="Excerpt" error={errors.excerpt} help="Shown on cards and in search results. Up to 400 characters; required to publish.">
              <textarea id="ar-excerpt" className="control" rows={3} maxLength={400} value={edit.excerpt} onChange={(e) => set('excerpt', e.target.value)} aria-invalid={!!errors.excerpt} />
            </Field>
            <Field id="ar-body" label="Article text" error={errors.body} help="Plain text. Leave a blank line between paragraphs. Required to publish.">
              <textarea id="ar-body" className="control" rows={14} value={edit.body} onChange={(e) => set('body', e.target.value)} aria-invalid={!!errors.body} />
            </Field>

            <ImageField id="ar-image" label="Image" value={edit.image} onChange={(v) => set('image', v)} error={errors.image} />
            <Field id="ar-alt" label="Image description (alt text)" error={errors.imageAlt}>
              <input id="ar-alt" className="control" maxLength={200} value={edit.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} />
            </Field>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, alignItems: 'start' }}>
              <Field id="ar-status" label="Status">
                <select id="ar-status" className="control" value={edit.status} onChange={(e) => set('status', e.target.value as Form['status'])}>
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published</option>
                </select>
              </Field>
              <Field
                id="ar-date"
                label="Publish date and time"
                error={errors.publishedAt}
                help="Leave blank to publish now. A future date schedules the article: it goes live automatically at that time (your local time zone)."
              >
                <input id="ar-date" type="datetime-local" className="control" value={edit.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} aria-invalid={!!errors.publishedAt} />
              </Field>
            </div>
            <div className="flex-wrap" style={{ gap: 20 }}>
              <label className="adm-check">
                <input type="checkbox" checked={edit.featured} onChange={(e) => set('featured', e.target.checked)} />
                Featured (shown first on the Insights page)
              </label>
              <label className="adm-check">
                <input type="checkbox" checked={edit.isSample} onChange={(e) => set('isSample', e.target.checked)} />
                Sample (shown only while “Show sample content” is on)
              </label>
            </div>

            <div className="adm-actions">
              <button type="submit" className="btn btn--sm btn-dark" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn btn--sm btn-outline" onClick={() => setEdit(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {del && (
        <ConfirmDialog
          title="Delete article?"
          message={`"${del.title}" will be permanently removed. To keep it for later, unpublish it instead.`}
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api(`/articles/${del.id}`, { method: 'DELETE', admin: true });
              toast('Deleted.');
              setDel(null);
              load();
            } catch (e) {
              toast((e as ClientApiError).message, true);
            }
          }}
        />
      )}
    </>
  );
}
