export type CatalogTrafficSource = "search" | "direct" | "social" | "external";

const SOCIAL_HOST_SUFFIXES = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "pinterest.com",
  "reddit.com",
  "t.co",
  "snapchat.com",
  "threads.net",
  "youtube.com",
  "youtu.be",
];

function isSocialHost(hostname: string): boolean {
  const h = hostname.replace(/^www\./, "").toLowerCase();
  return SOCIAL_HOST_SUFFIXES.some((s) => h === s || h.endsWith(`.${s}`));
}

/**
 * Traffic source for catalog_view (referrer + URL params).
 */
export function detectSource(): CatalogTrafficSource {
  if (typeof window === "undefined") return "direct";

  const params = new URLSearchParams(window.location.search);
  if (params.get("source") === "search") return "search";

  const ref = document.referrer;
  if (!ref) return "direct";

  let refUrl: URL;
  try {
    refUrl = new URL(ref);
  } catch {
    return "direct";
  }

  const here = window.location;

  if (refUrl.origin !== here.origin) {
    if (isSocialHost(refUrl.hostname)) return "social";
    return "external";
  }

  // Same origin: treat navigation from marketplace directory as search-driven discovery.
  const refPath = refUrl.pathname.replace(/\/$/, "") || "/";
  const catalogIdx = refPath === "/catalog" || refPath.endsWith("/catalog");
  if (catalogIdx && here.pathname !== "/catalog" && here.pathname.startsWith("/catalog/")) {
    return "search";
  }

  return "direct";
}
