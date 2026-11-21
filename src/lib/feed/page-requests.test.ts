import { describe, expect, it } from "vitest";
import { PageRequests } from "./page-requests";

describe("PageRequests", () => {
  it("lets each cursor be requested once", () => {
    const requests = new PageRequests();
    expect(requests.begin(null)).toBe(true);
    expect(requests.begin(null)).toBe(false);
    expect(requests.begin("c1")).toBe(true);
    expect(requests.begin("c1")).toBe(false);
  });

  it("lets a failed cursor be requested again", () => {
    const requests = new PageRequests();
    requests.begin("c1");
    requests.fail("c1");
    expect(requests.begin("c1")).toBe(true);
  });

  it("lets a failed first page be requested again", () => {
    const requests = new PageRequests();
    requests.begin(null);
    requests.fail(null);
    expect(requests.begin(null)).toBe(true);
  });
});
