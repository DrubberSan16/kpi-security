/**
 * Normalizacion del contexto de la solicitud que acompania a un log
 * transaccional: metodo HTTP, endpoint y datos enviados.
 *
 * Los datos enviados se guardan en jsonb, por lo que antes de persistirlos se
 * enmascaran las claves sensibles (contrasenas, tokens) y se acota el tamano
 * para que un payload grande no infle la bitacora.
 */
export const REDACTED_VALUE = '***';

const SENSITIVE_KEY_PATTERN =
  /(pass|clave|token|secret|authorization|api[_-]?key|jwt|refresh|credential)/i;
const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 50;
const MAX_STRING_LENGTH = 2000;
const MAX_SERIALIZED_LENGTH = 8000;
const MAX_URL_LENGTH = 500;
const MAX_METHOD_LENGTH = 10;

function truncateString(value: string) {
  return value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncado]`
    : value;
}

function redactValue(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return truncateString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) return '[...]';
    const items: unknown[] = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => redactValue(item, depth + 1));
    if (value.length > MAX_ARRAY_ITEMS) {
      items.push(`[...${value.length - MAX_ARRAY_ITEMS} elemento(s) omitido(s)]`);
    }
    return items;
  }

  if (typeof value === 'object') {
    if (depth >= MAX_DEPTH) return '{...}';
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? REDACTED_VALUE
        : redactValue(item, depth + 1);
    }
    return result;
  }

  return truncateString(String(value));
}

export function sanitizeRequestPayload(
  value: unknown,
): Record<string, any> | null {
  if (value === null || value === undefined) return null;

  let parsed: unknown = value;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { raw };
    }
    if (parsed === null || typeof parsed !== 'object') parsed = { raw };
  }

  const redacted = redactValue(parsed, 0);
  // La columna es jsonb y se consulta por clave, asi que siempre se guarda un
  // objeto: una lista se envuelve en `items` y un escalar en `raw`.
  const normalized: Record<string, any> = Array.isArray(redacted)
    ? { items: redacted }
    : redacted !== null && typeof redacted === 'object'
      ? (redacted as Record<string, any>)
      : { raw: redacted };

  const serialized = JSON.stringify(normalized) ?? 'null';
  if (serialized.length > MAX_SERIALIZED_LENGTH) {
    return {
      _truncated: true,
      _length: serialized.length,
      _preview: serialized.slice(0, MAX_SERIALIZED_LENGTH),
    };
  }

  return normalized;
}

export function normalizeRequestMethod(value: unknown): string | null {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!normalized) return null;
  return normalized.slice(0, MAX_METHOD_LENGTH);
}

export function normalizeRequestUrl(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;
  return normalized.slice(0, MAX_URL_LENGTH);
}
