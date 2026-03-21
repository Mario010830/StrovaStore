import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StoredSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  locationId?: number;
}

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "push-subscriptions.json");
let cache: StoredSubscription[] | null = null;

async function ensureLoaded(): Promise<StoredSubscription[]> {
  if (cache) return cache;
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as StoredSubscription[];
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

async function persist(subscriptions: StoredSubscription[]): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(subscriptions, null, 2), "utf8");
}

export async function listSubscriptions(): Promise<StoredSubscription[]> {
  const current = await ensureLoaded();
  return [...current];
}

export async function upsertSubscription(
  subscription: StoredSubscription,
): Promise<void> {
  const current = await ensureLoaded();
  const idx = current.findIndex((s) => s.endpoint === subscription.endpoint);

  if (idx >= 0) current[idx] = subscription;
  else current.push(subscription);

  cache = current;
  await persist(current);
}

export async function removeSubscriptionByEndpoint(endpoint: string): Promise<void> {
  const current = await ensureLoaded();
  const next = current.filter((s) => s.endpoint !== endpoint);
  cache = next;
  await persist(next);
}
