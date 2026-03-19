import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return new Response("Missing path parameter", { status: 400 });
  }

  const tunnelUrl = process.env.TUNNEL_URL;

  // Si el path ya es una URL absoluta (http/https), úsala directamente.
  // Esto cubre el caso en el que el backend devuelve la URL completa del túnel.
  let targetUrl: string;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    targetUrl = path;
  } else {
    if (!tunnelUrl) {
      return new Response("TUNNEL_URL is not configured", { status: 500 });
    }
    targetUrl = `${tunnelUrl}${path}`;
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      headers: {
        "bypass-tunnel-reminder": "true",
      },
    });
  } catch {
    return new Response("Upstream fetch failed", { status: 404 });
  }

  if (!upstreamResponse.ok) {
    return new Response("Image not found", { status: 404 });
  }

  const contentType = upstreamResponse.headers.get("content-type") ?? "application/octet-stream";
  const buffer = await upstreamResponse.arrayBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=60",
    },
  });
}

