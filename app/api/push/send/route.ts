import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { subscriptions } from "../_store";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidEmailRaw = process.env.VAPID_EMAIL;
// web-push exige que el subject sea una URL (p. ej. mailto:...)
const vapidSubject =
  vapidEmailRaw?.startsWith("mailto:") ? vapidEmailRaw : vapidEmailRaw ? `mailto:${vapidEmailRaw}` : "";

if (vapidSubject && vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

export async function POST(req: NextRequest) {
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 }
    );
  }

  try {
    const { title, body, url, locationId } = await req.json();

    const payload = JSON.stringify({
      title: title ?? "StrovaStore",
      body: body ?? "",
      icon: "/images/icon-192x192.png",
      badge: "/images/icon-72x72.png",
      data: { url: url ?? "/catalog" },
    });

    const toSend =
      locationId != null
        ? subscriptions.filter((s) => s.locationId === locationId)
        : subscriptions;

    const results = await Promise.allSettled(
      toSend.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
            expirationTime: sub.expirationTime ?? undefined,
          },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ sent, total: toSend.length });
  } catch (e) {
    console.error("Push send error:", e);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
