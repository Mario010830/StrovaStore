import { NextRequest, NextResponse } from "next/server";
import { subscriptions } from "../_store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subscription = body as { endpoint: string; keys?: { p256dh: string; auth: string }; locationId?: number };

    if (!subscription?.endpoint) {
      return NextResponse.json({ success: false, error: "Missing endpoint" }, { status: 400 });
    }

    const exists = subscriptions.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
      subscriptions.push({
        endpoint: subscription.endpoint,
        expirationTime: body.expirationTime ?? null,
        keys: subscription.keys ?? { p256dh: "", auth: "" },
        locationId: subscription.locationId,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
