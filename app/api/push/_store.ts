/**
 * Almacén en memoria de suscripciones push.
 * En producción reemplazar por llamadas al backend C# que persista en BD.
 */
export interface StoredSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  locationId?: number;
}

export const subscriptions: StoredSubscription[] = [];
