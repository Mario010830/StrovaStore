function stripBaseUrl(url: string, baseUrl?: string): string {
  if (!baseUrl) return url;
  return url.startsWith(baseUrl) ? url.slice(baseUrl.length) : url;
}

export function toImageProxyUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;

  const cleaned = rawUrl.trim();
  if (!cleaned) return null;

  const tunnelUrl = process.env.NEXT_PUBLIC_TUNNEL_URL?.trim();
  const pathOrUrl = stripBaseUrl(cleaned, tunnelUrl);

  return `/api/image?path=${encodeURIComponent(pathOrUrl)}`;
}
