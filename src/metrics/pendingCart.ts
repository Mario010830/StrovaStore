const PENDING_KEY = "mkt_pending_cart";
const SESSION_CART_ID_KEY = "mkt_cart_id";

export interface PendingCartSnapshot {
  cartId: string;
  businessId: string;
  productIds: number[];
}

function parsePending(raw: string | null): PendingCartSnapshot | null {
  if (!raw?.trim()) return null;
  try {
    const o = JSON.parse(raw) as Partial<PendingCartSnapshot>;
    if (typeof o.cartId !== "string" || !o.cartId) return null;
    if (typeof o.businessId !== "string") return null;
    const ids = Array.isArray(o.productIds)
      ? o.productIds.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    return { cartId: o.cartId, businessId: o.businessId, productIds: ids };
  } catch {
    return null;
  }
}

function newCartId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `cart_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateSessionCartId(): string {
  if (typeof window === "undefined") return newCartId();
  try {
    const existing = window.sessionStorage.getItem(SESSION_CART_ID_KEY);
    if (existing?.trim()) return existing.trim();
    const id = newCartId();
    window.sessionStorage.setItem(SESSION_CART_ID_KEY, id);
    return id;
  } catch {
    return newCartId();
  }
}

/**
 * After add_to_cart: persist cart id, business id, and merged product ids for abandonment tracking.
 */
export function updatePendingCartAfterAdd(
  businessId: string,
  productId: number | string,
  explicitCartId?: string | null,
): string {
  const cartId = explicitCartId?.trim() || getOrCreateSessionCartId();
  const pid = typeof productId === "number" ? productId : Number(productId);
  if (typeof window === "undefined" || !Number.isInteger(pid) || pid <= 0) return cartId;

  try {
    const prev = parsePending(window.sessionStorage.getItem(PENDING_KEY));
    const productIds = new Set(prev?.productIds ?? []);
    productIds.add(pid);
    const next: PendingCartSnapshot = {
      cartId,
      businessId,
      productIds: [...productIds],
    };
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return cartId;
}

export function clearPendingCartStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

export function readPendingCartSnapshot(): PendingCartSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    return parsePending(window.sessionStorage.getItem(PENDING_KEY));
  } catch {
    return null;
  }
}
