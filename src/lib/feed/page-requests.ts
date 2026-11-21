/**
 * Which feed pages have been asked for. A cursor is requested at most once
 * while its request is in flight or after it succeeded, even when React runs
 * an effect twice; a failed request may be tried again on the next trigger.
 */
export class PageRequests {
  private readonly taken = new Set<string>();

  /** True when `cursor` should be requested now; it is then marked as taken. */
  begin(cursor: string | null): boolean {
    const key = cursor ?? "";
    if (this.taken.has(key)) return false;
    this.taken.add(key);
    return true;
  }

  /** Frees a failed cursor so a later trigger can request it again. */
  fail(cursor: string | null): void {
    this.taken.delete(cursor ?? "");
  }
}
