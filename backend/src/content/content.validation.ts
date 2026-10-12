import { ContentTypeDef } from './content.schemas';

export type FieldErrors = Record<string, string>;

/**
 * Validate + sanitise `fields` for a content type. Pure function (unit-testable).
 */
export function validateContentFields(
  def: ContentTypeDef,
  input: Record<string, unknown>,
  ctx: { serviceSlugs?: Set<string> } = {},
): { value: Record<string, unknown>; errors: FieldErrors } {
  const value: Record<string, unknown> = {};
  const errors: FieldErrors = {};

  for (const f of def.fields) {
    const raw = input?.[f.key];
    switch (f.kind) {
      case 'text':
      case 'textarea':
      case 'image': {
        const s = typeof raw === 'string' ? raw.trim() : raw == null ? '' : String(raw).trim();
        if (f.required && !s) errors[f.key] = `${f.label} is required.`;
        else if (f.max && s.length > f.max) errors[f.key] = `${f.label}: use ${f.max} characters or fewer.`;
        else if (f.kind === 'image' && s && !/^(\/uploads\/|\/assets\/|https:\/\/)/.test(s)) errors[f.key] = 'Upload an image or use an https:// URL.';
        value[f.key] = s;
        break;
      }
      case 'number': {
        if (raw === '' || raw == null) {
          if (f.required) errors[f.key] = `${f.label} is required.`;
          value[f.key] = f.required ? null : 0;
          break;
        }
        const n = Number(raw);
        if (!Number.isFinite(n)) errors[f.key] = `${f.label} must be a number.`;
        else if (f.min !== undefined && n < f.min) errors[f.key] = `${f.label} must be at least ${f.min}.`;
        else if (f.maxValue !== undefined && n > f.maxValue) errors[f.key] = `${f.label} must be at most ${f.maxValue}.`;
        value[f.key] = n;
        break;
      }
      case 'list': {
        const list = Array.isArray(raw)
          ? raw.map((x) => String(x ?? '').trim()).filter(Boolean)
          : typeof raw === 'string'
            ? raw.split('\n').map((x) => x.trim()).filter(Boolean)
            : [];
        if (f.required && list.length === 0) errors[f.key] = `Add at least one item to ${f.label.toLowerCase()}.`;
        else if (f.max && list.length > f.max) errors[f.key] = `${f.label}: use ${f.max} items or fewer.`;
        else if (list.some((x) => x.length > 300)) errors[f.key] = `${f.label}: keep each item under 300 characters.`;
        value[f.key] = list;
        break;
      }
      case 'slug': {
        const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
        if (f.required && !s) errors[f.key] = `${f.label} is required.`;
        else if (s && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) errors[f.key] = 'Use lowercase letters, numbers and hyphens only.';
        else if (f.max && s.length > f.max) errors[f.key] = `${f.label}: use ${f.max} characters or fewer.`;
        value[f.key] = s;
        break;
      }
      case 'services': {
        const list = Array.isArray(raw) ? raw.map((x) => String(x ?? '').trim()).filter(Boolean) : typeof raw === 'string' ? raw.split(/[\n,]/).map((x) => x.trim()).filter(Boolean) : [];
        const uniq = Array.from(new Set(list));
        if (f.required && !uniq.length) errors[f.key] = `Choose at least one ${f.label.toLowerCase()}.`;
        else if (ctx.serviceSlugs && uniq.some((x) => !ctx.serviceSlugs!.has(x))) errors[f.key] = 'Choose capabilities from the list.';
        value[f.key] = uniq;
        break;
      }
      case 'select': {
        const s = typeof raw === 'string' ? raw : '';
        const allowed = (f.options || []).map((o) => o.value);
        if (f.required && !s) errors[f.key] = `${f.label} is required.`;
        else if (s && !allowed.includes(s)) errors[f.key] = `Choose a valid ${f.label.toLowerCase()}.`;
        value[f.key] = s;
        break;
      }
    }
  }
  return { value, errors };
}
