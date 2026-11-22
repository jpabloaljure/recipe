// What GET /api/feed does (REC-002, design D2 and D3), kept out of
// `route.ts` so the route file exports only the handler Next.js expects and
// a test can inject the database query. Contract: docs/api/openapi.yaml.
import { decodeCursor } from "./cursor";
import type { FeedQuery } from "./query";
import type { ApiError, FeedPage } from "./types";

const CACHEABLE = "public, s-maxage=3600";
const NOT_CACHEABLE = "no-store";

/** A page with at least one video is cached for 1 hour (PERF-6); every other response is not. */
function cacheControlFor(page: FeedPage | null): string {
  return page !== null && page.items.length > 0 ? CACHEABLE : NOT_CACHEABLE;
}

function errorResponse(status: number, body: ApiError): Response {
  return Response.json(body, { status, headers: { "Cache-Control": cacheControlFor(null) } });
}

export async function handleFeedRequest(request: Request, query: FeedQuery): Promise<Response> {
  const cursor = new URL(request.url).searchParams.get("cursor");

  let after = null;
  if (cursor !== null) {
    const decoded = decodeCursor(cursor);
    if (!decoded.ok) {
      return errorResponse(400, {
        error: { code: "invalid_cursor", message: "The cursor could not be decoded." },
      });
    }
    after = decoded.position;
  }

  let page: FeedPage;
  try {
    page = await query(after);
  } catch (error) {
    console.error("GET /api/feed failed:", error);
    return errorResponse(500, {
      error: { code: "internal_error", message: "The feed could not be read." },
    });
  }
  return Response.json(page, { headers: { "Cache-Control": cacheControlFor(page) } });
}
