export interface OrderTokenItem {
  name: string;
  qty: number;
  /** Unit price in the smallest currency unit (e.g. cents or whole units) */
  price: number;
  originalPrice?: number;
}

export interface OrderTokenData {
  folio: string;
  store: string;
  locationId: number;
  customer: {
    name: string;
    address: string;
    phone?: string;
    notes?: string;
  };
  items: OrderTokenItem[];
  total: number;
  /** Unix timestamp (seconds) when the order was placed */
  ts: number;
}

/**
 * Encodes order data into a URL-safe base64 string.
 * Works in both browser (btoa) and Node.js (Buffer).
 */
export function encodeOrderToken(data: OrderTokenData): string {
  const json = JSON.stringify(data);
  let base64: string;

  if (typeof window !== "undefined") {
    // Browser — handle unicode with encodeURIComponent
    base64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1: string) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  } else {
    base64 = Buffer.from(json, "utf-8").toString("base64");
  }

  // Make URL-safe (base64url) and strip padding
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Decodes a URL-safe base64 token back into order data.
 * Returns null if the token is invalid or corrupted.
 */
export function decodeOrderToken(token: string): OrderTokenData | null {
  try {
    // Restore standard base64 chars and padding
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    let json: string;
    if (typeof window !== "undefined") {
      // Browser
      json = decodeURIComponent(
        Array.from(atob(padded))
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      );
    } else {
      json = Buffer.from(padded, "base64").toString("utf-8");
    }

    return JSON.parse(json) as OrderTokenData;
  } catch {
    return null;
  }
}

/** Returns the public URL for a given order token */
export function buildOrderUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/pedido/${token}`;
}
