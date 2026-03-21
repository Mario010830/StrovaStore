import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import {
  listSubscriptions,
  removeSubscriptionByEndpoint,
} from "../_store";
import { getPushInternalToken } from "@/lib/runtime-config";
import { safeClientIp, validatePushSendPayload } from "../_validators";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidEmailRaw = process.env.VAPID_EMAIL;
// web-push exige que el subject sea una URL (p. ej. mailto:...)
const vapidSubject =
  vapidEmailRaw?.startsWith("mailto:") ? vapidEmailRaw : vapidEmailRaw ? `mailto:${vapidEmailRaw}` : "";

if (vapidSubject && vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

const WINDOW_MS = 60_000;
const LIMIT_PER_WINDOW = 30;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = requestBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    requestBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (bucket.count >= LIMIT_PER_WINDOW) return true;
  bucket.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 }
    );
  }

  const token = getPushInternalToken();
  if (token) {
    const providedToken = req.headers.get("x-internal-token")?.trim() ?? "";
    if (providedToken !== token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const ip = safeClientIp(req.headers.get("x-forwarded-for"));
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const rawBody = (await req.json()) as unknown;
    const parsed = validatePushSendPayload(rawBody);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { title, body, url, locationId } = parsed.value;
    const normalizedLocationId = locationId > 0 ? locationId : undefined;

    const payload = JSON.stringify({
      title,
      body,
      icon: "/images/icon-192x192.png",
      badge: "/images/icon-72x72.png",
      data: { url },
    });

    const subscriptions = await listSubscriptions();
    const toSend =
      normalizedLocationId != null
        ? subscriptions.filter((s) => s.locationId === normalizedLocationId)
        : subscriptions;

    const results = await Promise.all(
      toSend.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
            expirationTime: sub.expirationTime ?? undefined,
          },
          payload
        ).then(
          () => ({ ok: true as const, endpoint: sub.endpoint }),
          async (error: unknown) => {
            const statusCode = (error as { statusCode?: number })?.statusCode;
            if (statusCode === 404 || statusCode === 410) {
              await removeSubscriptionByEndpoint(sub.endpoint);
            }
            return { ok: false as const, endpoint: sub.endpoint };
          },
        ),
      )
    );

    const sent = results.filter((r) => r.ok).length;
    return NextResponse.json({ sent, total: toSend.length });
  } catch (e) {
    console.error("Push send error:", e);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
