import { NextRequest } from "next/server";
import { hasAbsoluteHttpUrl } from "../push/_validators";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encodedPath = searchParams.get("path");

  if (!encodedPath) {
    return new Response("Missing path parameter", { status: 400 });
  }
  const path = decodeURIComponent(encodedPath);

  const tunnelUrl = process.env.TUNNEL_URL;

  let targetUrl: string;
  if (hasAbsoluteHttpUrl(path)) {
    targetUrl = path;
  } else {
    if (!tunnelUrl) {
      return new Response("TUNNEL_URL is not configured", { status: 500 });
    }
    if (!path.startsWith("/")) {
      return new Response("Invalid path parameter", { status: 400 });
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

