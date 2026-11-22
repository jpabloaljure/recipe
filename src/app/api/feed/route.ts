import { getAppDb } from "../../../lib/db/client";
import { handleFeedRequest } from "../../../lib/feed/handle-request";
import { createFeedQuery } from "../../../lib/feed/query";

/**
 * GET /api/feed: one page of the feed (contract: docs/api/openapi.yaml).
 *
 * Reads the database as the read-only role (ADR 0007). The client is made per
 * request, inside the handler's try, so a missing DATABASE_URL is a 500
 * response, not a crash at import time.
 */
export async function GET(request: Request): Promise<Response> {
  return handleFeedRequest(request, (after) => createFeedQuery(getAppDb())(after));
}
