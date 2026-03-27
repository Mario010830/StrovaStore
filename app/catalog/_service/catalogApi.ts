import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiUrl } from "@/lib/auth-api";
import { slugifyBusinessCategoryName } from "@/utils/businessCategoryIcons";
import type {
  PublicLocation,
  PublicCatalogItem,
  PublicCatalogImageItem,
  PaginationMeta,
  Tag,
  BusinessCategory,
} from "@/lib/dashboard-types";

export const QUERY_REFRESH_MS = {
  general: 5 * 60 * 1000,
  storeCatalog: 2 * 60 * 1000,
} as const;

export const QUERY_POLLING_OPTIONS = {
  general: { pollingInterval: QUERY_REFRESH_MS.general },
  storeCatalog: { pollingInterval: QUERY_REFRESH_MS.storeCatalog },
} as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asPositiveInt(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}


function parseList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const obj = asRecord(raw);
  if (!obj) return [];
  const inner = obj.result ?? obj.data ?? obj;
  if (Array.isArray(inner)) return inner as T[];
  const nested = asRecord(inner);
  if (nested && Array.isArray(nested.data)) return nested.data as T[];
  return [];
}

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCatalogImage(rec: Record<string, unknown>): PublicCatalogImageItem | null {
  const imageUrl = asNullableString(rec.imageUrl);
  if (!imageUrl?.trim()) return null;
  return {
    imageUrl: imageUrl.trim(),
    sortOrder: parseNumber(rec.sortOrder, 0),
    isMain: rec.isMain === true,
  };
}

function normalizeCatalogImages(item: Record<string, unknown>): PublicCatalogImageItem[] {
  const raw = item.images;
  if (!Array.isArray(raw)) return [];
  const list: PublicCatalogImageItem[] = [];
  for (const el of raw) {
    const rec = asRecord(el);
    if (!rec) continue;
    const img = normalizeCatalogImage(rec);
    if (img) list.push(img);
  }
  list.sort((a, b) => a.sortOrder - b.sortOrder);
  return list;
}

/** Texto descriptivo: el API puede usar distintos nombres o casing. */
function pickProductDescription(item: Record<string, unknown>): string | null {
  const keys = [
    "description",
    "Description",
    "descripcion",
    "Descripcion",
    "shortDescription",
    "ShortDescription",
  ] as const;
  for (const k of keys) {
    const v = item[k];
    if (typeof v === "string") {
      const t = v.trim();
      if (t.length > 0) return t;
    }
  }
  return null;
}

function normalizeProductTags(item: Record<string, unknown>): PublicCatalogItem["tags"] | undefined {
  const raw = item.tags;
  if (!Array.isArray(raw)) return undefined;
  const out: NonNullable<PublicCatalogItem["tags"]> = [];
  for (const el of raw) {
    const rec = asRecord(el);
    if (!rec) continue;
    const id = asPositiveInt(rec.id);
    const name = asString(rec.name, "").trim();
    if (!id || !name) continue;
    const slugRaw = asString(rec.slug, "").trim();
    const slug = slugRaw || `tag-${id}`;
    const color = asNullableString(rec.color);
    out.push({
      id,
      name,
      slug,
      ...(color ? { color } : {}),
    });
  }
  return out.length ? out : undefined;
}

/** Asegura tagIds en cada ítem: el backend puede enviar "tags" (objetos) en lugar de "tagIds". */
function normalizePublicItem(item: Record<string, unknown>): PublicCatalogItem {
  const tags = Array.isArray(item.tags) ? (item.tags as { id: number }[]) : undefined;
  const tagIds =
    (Array.isArray(item.tagIds) ? (item.tagIds as number[]) : undefined) ??
    (Array.isArray(tags) ? tags.map((t) => t.id) : []);

  const tagsNormalized = normalizeProductTags(item);

  return {
    id: asPositiveInt(item.id),
    code: asString(item.code),
    name: asString(item.name, "Producto"),
    description: pickProductDescription(item),
    precio: parseNumber(item.precio, 0),
    originalPrecio: parseNullableNumber(item.originalPrecio),
    hasActivePromotion: item.hasActivePromotion === true,
    promotionType:
      item.promotionType === "percentage" || item.promotionType === "fixed"
        ? item.promotionType
        : null,
    promotionValue: parseNullableNumber(item.promotionValue),
    promotionId: parseNullableNumber(item.promotionId),
    imagenUrl: asNullableString(item.imagenUrl),
    images: normalizeCatalogImages(item),
    categoryId: asPositiveInt(item.categoryId),
    categoryColor: asNullableString(item.categoryColor),
    stockAtLocation: asPositiveInt(item.stockAtLocation),
    tipo: (asString(item.tipo, "inventariable") === "elaborado" ? "elaborado" : "inventariable"),
    categoryName: asNullableString(item.categoryName),
    isOpenNow: typeof item.isOpenNow === "boolean" ? item.isOpenNow : null,
    locationId: item.locationId == null ? null : asPositiveInt(item.locationId),
    locationName: asNullableString(item.locationName),
    tagIds: tagIds.filter((id) => Number.isInteger(id)),
    tags: tagsNormalized,
  } as PublicCatalogItem;
}

function normalizeLocations(raw: unknown): PublicLocation[] {
  const base = parseList<Record<string, unknown>>(raw);

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todayKey = days[new Date().getDay()];

  return base.map((loc) => {
    const businessHours = loc.businessHours as
      | Record<string, { open: string; close: string } | null>
      | undefined;
    const today = businessHours?.[todayKey] ?? null;

    const coordinates = loc.coordinates as
      | { lat?: number; lng?: number }
      | undefined;

    const latitude =
      loc.latitude ?? loc.lat ?? coordinates?.lat ?? null;
    const longitude =
      loc.longitude ?? loc.lng ?? coordinates?.lng ?? null;

    const todayOpen = today?.open ?? null;
    const todayClose = today?.close ?? null;

    // Recalculate isOpenNow client-side (server uses its own timezone which may differ)
    let isOpenNow: boolean = false;
    if (todayOpen && todayClose) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const [oh, om] = todayOpen.split(":").map(Number);
      const [ch, cm] = todayClose.split(":").map(Number);
      if (Number.isFinite(oh) && Number.isFinite(om) && Number.isFinite(ch) && Number.isFinite(cm)) {
        isOpenNow = nowMin >= oh * 60 + om && nowMin <= ch * 60 + cm;
      }
    }

    const nestedBc = asRecord(loc.businessCategory);
    const businessCategoryIdRaw =
      loc.businessCategoryId != null && loc.businessCategoryId !== ""
        ? loc.businessCategoryId
        : nestedBc?.id;
    const businessCategoryId =
      businessCategoryIdRaw == null || businessCategoryIdRaw === ""
        ? null
        : asPositiveInt(businessCategoryIdRaw);

    const nestedBcName =
      nestedBc && typeof nestedBc.name === "string" ? nestedBc.name : null;
    const businessCategoryName =
      asNullableString(loc.businessCategoryName) ?? nestedBcName;

    return {
      ...loc,
      id: asPositiveInt(loc.id),
      name: asString(loc.name, "Tienda"),
      organizationId: asPositiveInt(loc.organizationId),
      organizationName: asString(loc.organizationName),
      whatsAppContact: asNullableString(loc.whatsAppContact),
      description: asNullableString(loc.description),
      photoUrl: asNullableString(loc.photoUrl),
      province: asNullableString(loc.province),
      municipality: asNullableString(loc.municipality),
      street: asNullableString(loc.street),
      businessHours,
      coordinates,
      latitude,
      longitude,
      lat: latitude,
      lng: longitude,
      todayOpen,
      todayClose,
      isOpenNow,
      businessCategoryId,
      businessCategoryName,
      isVerified: loc.isVerified === true,
      offersDelivery: loc.offersDelivery !== false,
      offersPickup: loc.offersPickup !== false,
      deliveryHours: (loc.deliveryHours as PublicLocation["deliveryHours"]) ?? null,
      pickupHours: (loc.pickupHours as PublicLocation["pickupHours"]) ?? null,
      createdAt: asNullableString(loc.createdAt),
      productCount: typeof loc.productCount === "number" ? loc.productCount : 0,
      hasPromo: loc.hasPromo === true,
    } as PublicLocation;
  });
}

function normalizeBusinessCategory(raw: Record<string, unknown>): BusinessCategory {
  const name = asString(raw.name, "Categoría");
  const slugFromApi = asNullableString(raw.slug)?.trim();
  return {
    id: asPositiveInt(raw.id),
    name,
    icon: asString(
      raw.icon ?? raw.iconName ?? raw.materialIcon ?? raw.Icon,
      "storefront",
    ),
    slug: slugFromApi || slugifyBusinessCategoryName(name),
  };
}

function normalizeBusinessCategories(raw: unknown): BusinessCategory[] {
  return parseList<Record<string, unknown>>(raw).map(normalizeBusinessCategory);
}

export const catalogApi = createApi({
  reducerPath: "catalogApi",

  baseQuery: fetchBaseQuery({
    baseUrl: getApiUrl(),
    prepareHeaders: (headers) => {
      headers.set("ngrok-skip-browser-warning", "true");
      return headers;
    },
  }),

  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,

  endpoints: (builder) => ({
    getPublicLocations: builder.query<
      PublicLocation[],
      {
        sortBy?: string;
        sortDir?: string;
        lat?: number;
        lng?: number;
        radiusKm?: number;
        categoryId?: number;
      } | void
    >({
      query: (params) => {
        const p = params || {};
        const qs = new URLSearchParams();
        if (p.sortBy) qs.set("sortBy", p.sortBy);
        if (p.sortDir) qs.set("sortDir", p.sortDir);
        if (p.lat != null) qs.set("lat", String(p.lat));
        if (p.lng != null) qs.set("lng", String(p.lng));
        if (p.radiusKm != null) qs.set("radiusKm", String(p.radiusKm));
        if (p.categoryId != null) qs.set("categoryId", String(p.categoryId));
        const q = qs.toString();
        return `/public/locations${q ? `?${q}` : ""}`;
      },
      transformResponse: (raw: unknown) => normalizeLocations(raw),
    }),

    getPublicCatalog: builder.query<PublicCatalogItem[], number>({
      query: (locationId) => `/public/catalog?locationId=${locationId}`,
      transformResponse: (raw: unknown) =>
        parseList<Record<string, unknown>>(raw).map(normalizePublicItem),
    }),

    getAllPublicProducts: builder.query<
      { data: PublicCatalogItem[]; pagination: PaginationMeta },
      {
        page: number;
        pageSize: number;
        sortBy?: string;
        sortDir?: string;
        tagId?: number;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
        hasPromotion?: boolean;
      }
    >({
      query: ({ page, pageSize, sortBy, sortDir, tagId, minPrice, maxPrice, inStock, hasPromotion }) => {
        const qs = new URLSearchParams({
          all: "true",
          page: String(page),
          pageSize: String(pageSize),
        });
        if (sortBy) qs.set("sortBy", sortBy);
        if (sortDir) qs.set("sortDir", sortDir);
        if (tagId != null) qs.set("tagId", String(tagId));
        if (minPrice != null) qs.set("minPrice", String(minPrice));
        if (maxPrice != null) qs.set("maxPrice", String(maxPrice));
        if (inStock) qs.set("inStock", "true");
        if (hasPromotion) qs.set("hasPromotion", "true");
        return `/public/catalog?${qs.toString()}`;
      },
      transformResponse: (
        raw: unknown,
      ): { data: PublicCatalogItem[]; pagination: PaginationMeta } => {
        const obj = raw as Record<string, unknown> | null;
        if (!obj) return { data: [], pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 } };
        const data = parseList<Record<string, unknown>>(
          obj.data ?? obj.result ?? [],
        ).map(normalizePublicItem);
        const rawPagination = (obj.pagination ?? {}) as Record<string, unknown>;
        const pagination: PaginationMeta = {
          page: parseNumber(rawPagination.page, 1),
          pageSize: parseNumber(rawPagination.pageSize, 50),
          total: parseNumber(rawPagination.total, data.length),
          totalPages: parseNumber(rawPagination.totalPages, 1),
        };
        return { data, pagination };
      },
    }),

    /** GET /public/tags — etiquetas con al menos un producto público (IsForSale). Sin auth. */
    getPublicTags: builder.query<Tag[], void>({
      query: () => "/public/tags",
      transformResponse: (raw: unknown) => parseList<Tag>(raw),
    }),

    /** GET /business-category — categorías de negocio para filtros (landing, etc.). */
    getBusinessCategories: builder.query<BusinessCategory[], void>({
      query: () => "/business-category",
      transformResponse: (raw: unknown) => normalizeBusinessCategories(raw),
    }),
  }),
});

export const {
  useGetPublicLocationsQuery,
  useGetPublicCatalogQuery,
  useLazyGetPublicCatalogQuery,
  useGetAllPublicProductsQuery,
  useGetPublicTagsQuery,
  useGetBusinessCategoriesQuery,
} = catalogApi;
