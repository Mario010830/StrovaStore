/** Tipos usados por el catálogo público (solo lo necesario). */

export type ProductTipo = "inventariable" | "elaborado";

export interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
  productCount?: number;
}

export interface PublicLocation {
  id: number;
  name: string;
  description: string | null;
  organizationId: number;
  organizationName: string;
  whatsAppContact: string | null;
  photoUrl?: string | null;
  province?: string | null;
  municipality?: string | null;
  street?: string | null;
  businessHours?: Record<
    string,
    | { open: string; close: string }
    | null
  > | null;
  coordinates?: { lat: number; lng: number } | null;
  isOpenNow?: boolean | null;
  todayOpen?: string | null;
  todayClose?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
}

export interface PublicCatalogItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  imagenUrl: string | null;
  precio: number;
  categoryId: number;
  categoryName: string | null;
  categoryColor: string | null;
  tagIds?: number[];
  tags?: { id: number; name: string; slug: string; color?: string }[];
  stockAtLocation: number;
  tipo: ProductTipo;
  isOpenNow: boolean | null;
  locationId: number | null;
  locationName: string | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CartItem {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  imagenUrl: string | null;
  stockAtLocation: number;
  tipo?: ProductTipo;
}

export interface CreateSaleOrderItem {
  productId: number;
  quantity: number;
  unitPrice: number | null;
  discount: number;
}

export interface CreateSaleOrderRequest {
  locationId: number;
  contactId: number | null;
  notes: string | null;
  discountAmount: number;
  items: CreateSaleOrderItem[];
}
