'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminContentItem, AdminService, ContentTypeDef, FieldDef } from '@/lib/types';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, ImageField, LoadingRows, Modal, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

type Values = Record<string, string>;
interface Editing {
  id?: number;
  values: Values;
  published: boolean;
  isSample: boolean;
}

/** Field value <-> form string */
function toForm(def: ContentTypeDef, fields: Record<string, unknown>): Values {
  const v: Values = {};
  for (const f of def.fields) {
    const raw = fields[f.key];
    v[f.key] = f.kind === 'list' ? (Array.isArray(raw) ? raw.join('\n') : '') : f.kind === 'services' ? (Array.isArray(raw) ? raw.join(',') : '') : raw == null ? '' : String(raw);
  }
  return v;
}
function fromForm(def: ContentTypeDef, v: Values): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of def.fields) {
    const s = v[f.key] ?? '';
    out[f.key] =
      f.kind === 'list'
        ? s.split('\n').map((x) => x.trim()).filter(Boolean)
        : f.kind === 'services'
          ? s.split(',').filter(Boolean)
          : f.kind === 'number'
            ? s === ''
              ? ''
              : Number(s)
            : f.kind === 'slug'
              ? s.trim().toLowerCase()
              : s;
  }
  return out;
}
function clientValidate(def: ContentTypeDef, v: Values) {
  const e: Record<string, string> = {};
  for (const f of def.fields) {
    const s = (v[f.key] ?? '').trim();
    if (f.required && !s) e[f.key] = `${f.label} is required.`;
    else if ((f.kind === 'text' || f.kind === 'textarea' || f.kind === 'slug') && f.max && s.length > f.max) e[f.key] = `Use ${f.max} characters or fewer.`;
    else if (f.kind === 'slug' && s && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.toLowerCase())) e[f.key] = 'Use lowercase letters, numbers and hyphens only.';
    else if (f.kind === 'number' && s) {
      const n = Number(s);
      if (!Number.isFinite(n)) e[f.key] = 'Enter a number.';
      else if (f.min !== undefined && n < f.min) e[f.key] = `Must be at least ${f.min}.`;
      else if (f.maxValue !== undefined && n > f.maxValue) e[f.key] = `Must be at most ${f.maxValue}.`;
    } else if (f.kind === 'list' && f.max && s.split('\n').filter((x) => x.trim()).length > f.max) e[f.key] = `Use ${f.max} items or fewer.`;
  }
  return e;
}

function ContentInner() {
  const params = useSearchParams();
  const { toast } = useAdmin();
  const [types, setTypes] = useState<ContentTypeDef[] | null>(null);
  const [counts, setCounts] = useState<Record<string, { total: number; published: number }>>({});
  const [type, setType] = useState<string>(params.get('type') || 'stage');
  const [items, setItems] = useState<AdminContentItem[] | null>(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<Editing | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<AdminContentItem | null>(null);
  const [svcOptions, setSvcOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    api<AdminService[]>('/services/admin/all', { admin: true })
      .then((list) => setSvcOptions(list.map((x) => ({ value: x.slug, label: x.name + (x.status === 'draft' ? ' (draft)' : '') }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api<ContentTypeDef[]>('/content/types', { admin: true })
      .then(setTypes)
      .catch((e: ClientApiError) => setError(e.message));
  }, []);

  const loadCounts = useCallback(() => {
    api<Record<string, { total: number; published: number }>>('/content/admin/counts', { admin: true }).then(setCounts).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setItems(null);
    setError('');
    api<AdminContentItem[]>(`/content/admin?type=${encodeURIComponent(type)}`, { admin: true })
      .then(setItems)
      .catch((e: ClientApiError) => setError(e.message));
    loadCounts();
  }, [type, loadCounts]);
  useEffect(load, [load]);

  const def = types?.find((t) => t.type === type);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit || !def) return;
    const fe = clientValidate(def, edit.values);
    setErrors(fe);
    if (Object.keys(fe).length) return;
    setSaving(true);
    const body = { fields: fromForm(def, edit.values), published: edit.published, isSample: edit.isSample };
    try {
      if (edit.id) await api(`/content/${edit.id}`, { method: 'PATCH', body, admin: true });
      else await api('/content', { method: 'POST', body: { ...body, type }, admin: true });
      toast('Saved.');
      setEdit(null);
      load();
    } catch (err) {
      const ce = err as ClientApiError;
      // backend nests field errors as "fields.x" (DTO) or plain "x" (schema validation)
      const mapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(ce.errors)) mapped[k.replace(/^fields\./, '')] = v;
      setErrors(mapped);
      if (!Object.keys(mapped).length) toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (it: AdminContentItem) => {
    try {
      await api(`/content/${it.id}`, { method: 'PATCH', body: { published: !it.published }, admin: true });
      toast(it.published ? 'Hidden from the site.' : 'Shown on the site.');
      load();
    } catch (e) {
      toast((e as ClientApiError).message, true);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!items) return;
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setItems(next);
    try {
      setItems(await api<AdminContentItem[]>('/content/admin/reorder', { method: 'POST', body: { type, ids: next.map((x) => x.id) }, admin: true }));
    } catch (e) {
      toast((e as ClientApiError).message, true);
      load();
    }
  };

  const pick = (t: string) => {
    setType(t);
    const url = new URL(window.location.href);
    url.searchParams.set('type', t);
    window.history.replaceState(null, '', url.toString());
  };

  const renderInput = (f: FieldDef) => {
    if (!edit) return null;
    const id = `c-${f.key}`;
    const value = edit.values[f.key] ?? '';
    const onChange = (v: string) => setEdit((e) => (e ? { ...e, values: { ...e.values, [f.key]: v } } : e));
    const label = `${f.label}${f.required ? ' *' : ''}`;
    if (f.kind === 'image') return <ImageField key={f.key} id={id} label={label} value={value} onChange={onChange} error={errors[f.key]} />;
    let input: React.ReactNode;
    switch (f.kind) {
      case 'textarea':
        input = <textarea id={id} className="control" rows={4} maxLength={f.max} value={value} onChange={(e) => onChange(e.target.value)} />;
        break;
      case 'list':
        input = <textarea id={id} className="control" rows={4} value={value} onChange={(e) => onChange(e.target.value)} />;
        break;
      case 'services': {
        const chosen = value.split(',').filter(Boolean);
        const toggle = (slug: string) => onChange((chosen.includes(slug) ? chosen.filter((x) => x !== slug) : [...chosen, slug]).join(','));
        return (
          <fieldset key={f.key} className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{label}</legend>
            {svcOptions.length === 0 ? (
              <p className="help">No solutions yet — add them under Solutions first.</p>
            ) : (
              <div className="flex-wrap" style={{ gap: 14 }}>
                {svcOptions.map((o) => (
                  <label key={o.value} className="adm-check">
                    <input type="checkbox" checked={chosen.includes(o.value)} onChange={() => toggle(o.value)} />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
            {errors[f.key] && <p className="field-err">{errors[f.key]}</p>}
          </fieldset>
        );
      }
      case 'slug':
        input = <input id={id} className="control" maxLength={f.max} value={value} autoCapitalize="none" spellCheck={false} onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'))} />;
        break;
      case 'number':
        input = <input id={id} type="number" className="control" min={f.min} max={f.maxValue} value={value} onChange={(e) => onChange(e.target.value)} />;
        break;
      case 'select':
        input = (
          <select id={id} className="control" value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select…</option>
            {(f.options || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
        break;
      default: {
        const suggestions = f.suggest ? Array.from(new Set((items || []).map((it) => String(it.fields[f.key] ?? '')).filter(Boolean))) : [];
        input = (
          <>
            <input id={id} className="control" maxLength={f.max} value={value} list={f.suggest ? `${id}-list` : undefined} onChange={(e) => onChange(e.target.value)} />
            {f.suggest && (
              <datalist id={`${id}-list`}>
                {suggestions.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            )}
          </>
        );
      }
    }
    return (
      <Field key={f.key} id={id} label={label} error={errors[f.key]} help={f.kind === 'list' ? `One per line${f.max ? ` (max ${f.max})` : ''}.` : f.help}>
        {input}
      </Field>
    );
  };

  const preview = (it: AdminContentItem) => {
    if (!def) return '';
    const v = it.fields[def.titleField];
    const fd = def.fields.find((f) => f.key === def.titleField);
    if (fd?.kind === 'select') return fd.options?.find((o) => o.value === v)?.label || String(v ?? '');
    return Array.isArray(v) ? v.join(', ') : String(v ?? '');
  };
  const secondary = (it: AdminContentItem) => {
    if (!def) return '';
    const other = def.fields.find((f) => f.key !== def.titleField && (f.kind === 'text' || f.kind === 'textarea'));
    return other ? String(it.fields[other.key] ?? '') : '';
  };

  return (
    <>
      <AdminHeader eyebrow="CONTENT" title="Site content & photos" />
      {error && !types ? (
        <ErrorBox message={error} onRetry={() => window.location.reload()} />
      ) : (
        <div className="adm-split">
          <nav aria-label="Content types" className="adm-panel type-list" style={{ flex: '0 1 300px', minWidth: 240 }}>
            {!types ? (
              <LoadingRows rows={6} />
            ) : (
              types.map((t) => (
                <button key={t.type} type="button" aria-pressed={t.type === type} onClick={() => pick(t.type)}>
                  <span>
                    {t.label}
                    <span className="pg">{t.page}</span>
                  </span>
                  <span className="mono-xs">{counts[t.type] ? `${counts[t.type].published}/${counts[t.type].total}` : '0'}</span>
                </button>
              ))
            )}
          </nav>

          <div className="adm-panel min0" style={{ flex: '1 1 480px' }}>
            {def && (
              <div className="adm-pad" style={{ borderBottom: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="col" style={{ gap: 6, maxWidth: 560 }}>
                  <h2 className="h-card" style={{ fontSize: 20 }}>
                    {def.label}
                  </h2>
                  <p className="small" style={{ lineHeight: 1.5 }}>
                    {def.description} <em>Shown on: {def.page}.</em>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--sm btn-dark"
                  onClick={() => {
                    setErrors({});
                    setEdit({ values: toForm(def, {}), published: true, isSample: false });
                  }}
                >
                  + Add item
                </button>
              </div>
            )}
            {error && types ? (
              <ErrorBox message={error} onRetry={load} />
            ) : !items || !def ? (
              <LoadingRows />
            ) : items.length === 0 ? (
              <EmptyBox>Nothing here yet. The site shows its empty state for this section until you add an item.</EmptyBox>
            ) : (
              items.map((it, i) => (
                <div key={it.id} className="flex-wrap" style={{ gap: 12, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--line)', opacity: it.published ? 1 : 0.6 }}>
                  <span className="mono-xs" style={{ width: 24 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {def.fields.some((f) => f.kind === 'image') &&
                    (() => {
                      const imgKey = def.fields.find((f) => f.kind === 'image')!.key;
                      const src = String(it.fields[imgKey] || '');
                      return src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" className="thumb" />
                      ) : (
                        <span className="thumb" style={{ display: 'inline-block' }} />
                      );
                    })()}
                  <div className="col min0" style={{ flex: '1 1 220px', gap: 4 }}>
                    <span style={{ fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview(it) || '(untitled)'}</span>
                    <span className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {secondary(it)}
                    </span>
                  </div>
                  <div className="flex-wrap" style={{ gap: 6 }}>
                    {!it.published && <StatusTag kind="draft">HIDDEN</StatusTag>}
                    {it.isSample && <StatusTag kind="sample">SAMPLE</StatusTag>}
                    {def.uniqueBy && it.published && <StatusTag kind="new">IN USE</StatusTag>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="iconbtn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                      ↑
                    </button>
                    <button type="button" className="iconbtn" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                      ↓
                    </button>
                    <button type="button" className="iconbtn" onClick={() => togglePublished(it)}>
                      {it.published ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      className="iconbtn"
                      onClick={() => {
                        setErrors({});
                        setEdit({ id: it.id, values: toForm(def, it.fields), published: it.published, isSample: it.isSample });
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="iconbtn" style={{ color: 'var(--error)' }} onClick={() => setDel(it)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {edit && def && (
        <Modal title={`${edit.id ? 'Edit' : 'Add'} — ${def.label}`} onClose={() => setEdit(null)}>
          <form onSubmit={save} noValidate className="adm-form">
            {def.fields.map(renderInput)}
            <div className="flex-wrap" style={{ gap: 20 }}>
              <label className="adm-check">
                <input type="checkbox" checked={edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} />
                Show on site
              </label>
              {def.sampleable && (
                <label className="adm-check">
                  <input type="checkbox" checked={edit.isSample} onChange={(e) => setEdit({ ...edit, isSample: e.target.checked })} />
                  Sample (template preview only)
                </label>
              )}
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
          title="Delete item?"
          message={`"${preview(del)}" will be removed from the site. To keep it for later, use Hide instead.`}
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api(`/content/${del.id}`, { method: 'DELETE', admin: true });
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

export default function ContentAdminPage() {
  return (
    <Suspense fallback={<LoadingRows />}>
      <ContentInner />
    </Suspense>
  );
}
