const DEFAULT_BUSINESS_URL = "https://strova.com";

export function getBusinessUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_STROVA_BUSINESS_URL?.trim();
  return envUrl && envUrl.length > 0 ? envUrl : DEFAULT_BUSINESS_URL;
}

export function getPushInternalToken(): string {
  return process.env.PUSH_INTERNAL_TOKEN?.trim() ?? "";
}
