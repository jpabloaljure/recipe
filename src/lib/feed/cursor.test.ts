import { describe, expect, test } from "vitest";
import { decodeCursor, encodeCursor } from "./cursor";

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

describe("feed cursor", () => {
  test("round trip", () => {
    const position = { enteredFeedAt: new Date("2026-11-20T10:15:30.123Z"), id: 42 };
    expect(decodeCursor(encodeCursor(position))).toEqual({ ok: true, position });
  });

  test("the empty string is invalid", () => {
    expect(decodeCursor("")).toEqual({ ok: false });
  });

  test("text that is not base64url is invalid", () => {
    expect(decodeCursor("not a cursor!")).toEqual({ ok: false });
    expect(decodeCursor("a+b/c=")).toEqual({ ok: false });
  });

  test("base64 that is not JSON is invalid", () => {
    expect(decodeCursor(Buffer.from("hello").toString("base64url"))).toEqual({ ok: false });
  });

  test("JSON of the wrong shape is invalid", () => {
    expect(decodeCursor(b64(null))).toEqual({ ok: false });
    expect(decodeCursor(b64([1, 2]))).toEqual({ ok: false });
    expect(decodeCursor(b64({ t: "2026-11-20T10:15:30.123Z" }))).toEqual({ ok: false });
    expect(decodeCursor(b64({ o: 3 }))).toEqual({ ok: false }); // the old offset cursor
  });

  test("an invalid time is invalid", () => {
    expect(decodeCursor(b64({ t: "yesterday", i: 1 }))).toEqual({ ok: false });
    expect(decodeCursor(b64({ t: "2026-13-45T00:00:00.000Z", i: 1 }))).toEqual({ ok: false });
    expect(decodeCursor(b64({ t: 1700000000000, i: 1 }))).toEqual({ ok: false });
  });

  test("an id that is not a positive integer is invalid", () => {
    const t = "2026-11-20T10:15:30.123Z";
    expect(decodeCursor(b64({ t, i: 1.5 }))).toEqual({ ok: false });
    expect(decodeCursor(b64({ t, i: "7" }))).toEqual({ ok: false });
    expect(decodeCursor(b64({ t, i: 0 }))).toEqual({ ok: false });
    expect(decodeCursor(b64({ t, i: -3 }))).toEqual({ ok: false });
  });

  test("a value the database column cannot hold is invalid, so it never reaches the query", () => {
    const t = "2026-11-20T10:15:30.123Z";
    expect(decodeCursor(b64({ t, i: 2_147_483_647 })).ok).toBe(true);
    expect(decodeCursor(b64({ t, i: 2_147_483_648 }))).toEqual({ ok: false });
    expect(decodeCursor(b64({ t, i: 99_999_999_999 }))).toEqual({ ok: false });
    expect(decodeCursor(b64({ t: "+275760-09-13T00:00:00.000Z", i: 1 }))).toEqual({ ok: false });
    expect(decodeCursor(b64({ t: "1969-12-31T23:59:59.999Z", i: 1 }))).toEqual({ ok: false });
  });
});
