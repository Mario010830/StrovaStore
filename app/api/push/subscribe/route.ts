import { NextRequest, NextResponse } from "next/server";
import { upsertSubscription } from "../_store";
import { validateSubscriptionPayload } from "../_validators";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = validateSubscriptionPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    await upsertSubscription(parsed.value);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }
}
