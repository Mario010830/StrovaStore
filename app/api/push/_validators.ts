import type { StoredSubscription } from "./_store";

interface PushSendInput {
  title?: string;
  body?: string;
  url?: string;
  locationId?: number;
}

interface ValidationResult<T> {
  ok: true;
  value: T;
}

interface ValidationError {
  ok: false;
  error: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeText(value: string | undefined, fallback = ""): string {
  if (!value) return fallback;
  return value.trim().slice(0, 200);
}

function normalizeLocationId(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function normalizeNotificationUrl(value: unknown): string {
  if (typeof value !== "string") return "/catalog";
  const trimmed = value.trim();
  if (!trimmed) return "/catalog";
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
  } catch {
    return "/catalog";
  }
  return "/catalog";
}

export function validateSubscriptionPayload(raw: unknown): ValidationResult<StoredSubscription> | ValidationError {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid payload" };
  }

  const body = raw as Record<string, unknown>;
  const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  if (!endpoint) {
    return { ok: false, error: "Missing endpoint" };
  }

  const keysRaw = body.keys as Record<string, unknown> | undefined;
  const p256dh = typeof keysRaw?.p256dh === "string" ? keysRaw.p256dh.trim() : "";
  const auth = typeof keysRaw?.auth === "string" ? keysRaw.auth.trim() : "";
  if (!p256dh || !auth) {
    return { ok: false, error: "Invalid push keys" };
  }

  const expirationTimeRaw = body.expirationTime;
  const expirationTime =
    typeof expirationTimeRaw === "number" && Number.isFinite(expirationTimeRaw)
      ? expirationTimeRaw
      : null;

  return {
    ok: true,
    value: {
      endpoint,
      expirationTime,
      keys: { p256dh, auth },
      locationId: normalizeLocationId(body.locationId),
    },
  };
}

export function validatePushSendPayload(raw: unknown): ValidationResult<Required<PushSendInput>> | ValidationError {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const body = raw as Record<string, unknown>;

  if (body.title != null && typeof body.title !== "string") {
    return { ok: false, error: "Invalid title" };
  }
  if (body.body != null && typeof body.body !== "string") {
    return { ok: false, error: "Invalid body" };
  }
  if (body.url != null && typeof body.url !== "string") {
    return { ok: false, error: "Invalid url" };
  }

  const locationIdRaw = normalizeLocationId(body.locationId);
  if (body.locationId != null && locationIdRaw == null) {
    return { ok: false, error: "Invalid locationId" };
  }

  return {
    ok: true,
    value: {
      title: sanitizeText(body.title as string | undefined, "StrovaStore"),
      body: sanitizeText(body.body as string | undefined, ""),
      url: normalizeNotificationUrl(body.url),
      locationId: locationIdRaw ?? 0,
    },
  };
}

export function safeClientIp(headerValue: string | null): string {
  const first = headerValue?.split(",")[0]?.trim() || "unknown";
  return first.slice(0, 64);
}

export function hasAbsoluteHttpUrl(value: string): boolean {
  if (!isNonEmptyString(value)) return false;
  return value.startsWith("http://") || value.startsWith("https://");
}
