import type { MetadataRoute } from "next";
import { getApiUrl } from "@/lib/auth-api";
import { getSiteUrl } from "@/lib/runtime-config";
import { buildLocationCatalogPath, buildLocationProductPath } from "@/lib/location-path";

const PUBLIC_FETCH_HEADERS = { "ngrok-skip-browser-warning": "true" } as const;
const SITEMAP_REVALIDATE_SEC = 3600;
const CATALOG_PAGE_SIZE = 200;

function siteOrigin(): string {
  return getSiteUrl().replace(/\/$/, "");
}

function parseList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!obj) return [];
  const inner = obj.result ?? obj.data ?? obj;
  if (Array.isArray(inner)) return inner as Record<string, unknown>[];
  const nested = inner && typeof inner === "object" ? (inner as Record<string, unknown>) : null;
  if (nested && Array.isArray(nested.data)) return nested.data as Record<string, unknown>[];
  return [];
}

function asPositiveInt(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullablePositiveInt(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function fetchPublicJson(pathWithQuery: string): Promise<unknown | null> {
  const base = getApiUrl().replace(/\/$/, "");
  const url = `${base}${pathWithQuery.startsWith("/") ? "" : "/"}${pathWithQuery}`;
  try {
    const res = await fetch(url, {
      headers: PUBLIC_FETCH_HEADERS,
      next: { revalidate: SITEMAP_REVALIDATE_SEC },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function parseLocationSummaries(raw: unknown): { id: number; name: string }[] {
  const out: { id: number; name: string }[] = [];
  for (const loc of parseList(raw)) {
    const id = asPositiveInt(loc.id);
    if (!id) continue;
    const name = asString(loc.name, "Tienda").trim() || "Tienda";
    out.push({ id, name });
  }
  return out;
}

type CatalogPage = {
  products: { id: number; locationId: number | null }[];
  totalPages: number;
};

function parseCatalogPage(raw: unknown): CatalogPage {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!obj) return { products: [], totalPages: 0 };
  const data = parseList(obj.data ?? obj.result ?? []);
  const products: { id: number; locationId: number | null }[] = [];
  for (const item of data) {
    const id = asPositiveInt(item.id);
    if (!id) continue;
    products.push({ id, locationId: asNullablePositiveInt(item.locationId) });
  }
  const rawPagination = (obj.pagination ?? {}) as Record<string, unknown>;
  const page = asPositiveInt(rawPagination.page) || 1;
  const totalPages = asPositiveInt(rawPagination.totalPages) || 1;
  return { products, totalPages: Math.max(totalPages, page) };
}

async function fetchAllPublicProducts(): Promise<{ id: number; locationId: number | null }[]> {
  const all: { id: number; locationId: number | null }[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const qs = new URLSearchParams({
      all: "true",
      page: String(page),
      pageSize: String(CATALOG_PAGE_SIZE),
    });
    const raw = await fetchPublicJson(`/public/catalog?${qs.toString()}`);
    if (raw == null) break;
    const { products, totalPages: tp } = parseCatalogPage(raw);
    all.push(...products);
    totalPages = tp;
    page += 1;
  } while (page <= totalPages);

  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${origin}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/catalog`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${origin}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const locationsRaw = await fetchPublicJson("/public/locations");
  const locations = locationsRaw != null ? parseLocationSummaries(locationsRaw) : [];
  const locationById = new Map(locations.map((l) => [l.id, l]));

  const locationEntries: MetadataRoute.Sitemap = locations.map((loc) => ({
    url: `${origin}${buildLocationCatalogPath(loc)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const products = await fetchAllPublicProducts();
  const productEntries: MetadataRoute.Sitemap = [];

  for (const p of products) {
    if (p.locationId == null) continue;
    const loc = locationById.get(p.locationId);
    if (!loc) continue;
    productEntries.push({
      url: `${origin}${buildLocationProductPath(loc, p.id)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return [...staticEntries, ...locationEntries, ...productEntries];
}
