import { getFixturePage } from "../../../lib/feed/fixture-pages";
import type { ApiError } from "../../../lib/feed/types";

/**
 * GET /api/feed: one page of the feed (contract: docs/api/openapi.yaml).
 *
 * Stub (REC-001): pages a fixture of title-only items. REC-002 replaces the
 * data with the database query and adds the empty-feed and 5xx responses;
 * the response shape and headers stay the same.
 */
export async function GET(request: Request): Promise<Response> {
  const cursor = new URL(request.url).searchParams.get("cursor");
  const result = getFixturePage(cursor);

  if (!result.ok) {
    const body: ApiError = {
      error: { code: "invalid_cursor", message: "The cursor could not be decoded." },
    };
    return Response.json(body, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  return Response.json(result.page, {
    headers: { "Cache-Control": "public, s-maxage=3600" },
  });
}
