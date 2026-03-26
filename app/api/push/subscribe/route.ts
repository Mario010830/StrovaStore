import { NextRequest, NextResponse } from "next/server";
import { upsertSubscription } from "../_store";
import { validateSubscriptionPayload } from "../_validators";
import { getApiUrl } from "@/lib/auth-api";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = validateSubscriptionPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    await upsertSubscription(parsed.value);

    // Forward subscription to backend API so admin-side promo triggers
    // can reach devices even when this frontend app is closed.
    const apiBase = getApiUrl().replace(/\/$/, "");
    let forwarded = false;
    let forwardError: string | null = null;
    try {
      const forwardRes = await fetch(`${apiBase}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.value),
        cache: "no-store",
      });
      forwarded = forwardRes.ok;
      if (!forwardRes.ok) {
        const text = await forwardRes.text().catch(() => "");
        forwardError = text || `HTTP ${forwardRes.status}`;
      }
    } catch (error) {
      forwardError = error instanceof Error ? error.message : "forward failed";
    }

    return NextResponse.json({
      success: true,
      forwarded,
      ...(forwardError ? { forwardError } : {}),
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }
}
