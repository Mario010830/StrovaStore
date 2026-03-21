import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiUrl } from "@/lib/auth-api";
import type {
  PublicLocation,
  PublicCatalogItem,
  PaginationMeta,
  Tag,
} from "@/lib/dashboard-types";

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

/** Asegura tagIds en cada ítem: el backend puede enviar "tags" (objetos) en lugar de "tagIds". */
function normalizePublicItem(item: Record<string, unknown>): PublicCatalogItem {
  const tags = Array.isArray(item.tags) ? (item.tags as { id: number }[]) : undefined;
  const tagIds =
    (Array.isArray(item.tagIds) ? (item.tagIds as number[]) : undefined) ??
    (Array.isArray(tags) ? tags.map((t) => t.id) : []);

  return {
    id: asPositiveInt(item.id),
    code: asString(item.code),
    name: asString(item.name, "Producto"),
    description: asNullableString(item.description),
    precio: parseNumber(item.precio, 0),
    imagenUrl: asNullableString(item.imagenUrl),
    categoryId: asPositiveInt(item.categoryId),
    categoryColor: asNullableString(item.categoryColor),
    stockAtLocation: asPositiveInt(item.stockAtLocation),
    tipo: (asString(item.tipo, "inventariable") === "elaborado" ? "elaborado" : "inventariable"),
    categoryName: asNullableString(item.categoryName),
    isOpenNow: typeof item.isOpenNow === "boolean" ? item.isOpenNow : null,
    locationId: item.locationId == null ? null : asPositiveInt(item.locationId),
    locationName: asNullableString(item.locationName),
    tagIds: tagIds.filter((id) => Number.isInteger(id)),
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
      isOpenNow: typeof loc.isOpenNow === "boolean" ? loc.isOpenNow : null,
    } as PublicLocation;
  });
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
    getPublicLocations: builder.query<PublicLocation[], void>({
      query: () => "/public/locations",
      transformResponse: (raw: unknown) => normalizeLocations(raw),
    }),

    getPublicCatalog: builder.query<PublicCatalogItem[], number>({
      query: (locationId) => `/public/catalog?locationId=${locationId}`,
      transformResponse: (raw: unknown) =>
        parseList<Record<string, unknown>>(raw).map(normalizePublicItem),
    }),

    getAllPublicProducts: builder.query<
      { data: PublicCatalogItem[]; pagination: PaginationMeta },
      { page: number; pageSize: number }
    >({
      query: ({ page, pageSize }) =>
        `/public/catalog?all=true&page=${page}&pageSize=${pageSize}`,
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
  }),
});

export const {
  useGetPublicLocationsQuery,
  useGetPublicCatalogQuery,
  useLazyGetPublicCatalogQuery,
  useGetAllPublicProductsQuery,
  useGetPublicTagsQuery,
} = catalogApi;
