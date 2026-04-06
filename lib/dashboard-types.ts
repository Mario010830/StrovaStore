/** Tipos usados por el catálogo público (solo lo necesario). */

export type ProductTipo = "inventariable" | "elaborado";

export interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
  productCount?: number;
}

/** Categoría de negocio (GET /business-category). */
export interface BusinessCategory {
  id: number;
  name: string;
  /** Nombre del ícono Material (p. ej. restaurant). */
  icon: string;
  /** Slug para URL (?category=); si el backend no envía, se deriva del nombre. */
  slug: string;
}

/**
 * Local público en el directorio.
 * Campos futuros pendientes de backend: rating, reviewCount.
 */
export interface PublicLocation {
  id: number;
  name: string;
  description: string | null;
  organizationId: number;
  organizationName: string;
  businessCategoryId?: number | null;
  businessCategoryName?: string | null;
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
  isVerified?: boolean;
  offersDelivery?: boolean;
  offersPickup?: boolean;
  deliveryHours?: Record<string, { open: string; close: string } | null> | null;
  pickupHours?: Record<string, { open: string; close: string } | null> | null;
  createdAt?: string | null;
  productCount?: number;
  hasPromo?: boolean;
}

/** Imagen de galería en respuesta pública del catálogo (JSON camelCase). */
export interface PublicCatalogImageItem {
  imageUrl: string;
  sortOrder: number;
  isMain: boolean;
}

export interface PublicCatalogItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  imagenUrl: string | null;
  /** Galería ordenada por sortOrder; vacío si solo hay imagen legada en imagenUrl. */
  images?: PublicCatalogImageItem[];
  precio: number;
  originalPrecio?: number | null;
  hasActivePromotion?: boolean;
  promotionType?: "percentage" | "fixed" | null;
  promotionValue?: number | null;
  promotionId?: number | null;
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
  originalUnitPrice?: number | null;
  hasActivePromotion?: boolean;
  promotionType?: "percentage" | "fixed" | null;
  promotionValue?: number | null;
  promotionId?: number | null;
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
