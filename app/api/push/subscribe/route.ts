import { NextRequest, NextResponse } from "next/server";
import { upsertSubscription } from "../_store";
import { validateSubscriptionPayload } from "../_validators";
import { getApiUrl } from "@/lib/auth-api";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = validateSubscriptionPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  let localStored = false;
  let localStoreError: string | null = null;
  try {
    await upsertSubscription(parsed.value);
    localStored = true;
  } catch (error) {
    // Vercel/serverless FS may be read-only. Do not fail the request for this.
    localStoreError = error instanceof Error ? error.message : "local store failed";
  }

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

  if (!forwarded) {
    return NextResponse.json(
      {
        success: false,
        error: "Backend subscribe failed",
        forwarded,
        ...(forwardError ? { forwardError } : {}),
        localStored,
        ...(localStoreError ? { localStoreError } : {}),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    forwarded,
    localStored,
    ...(localStoreError ? { localStoreError } : {}),
  });
}
