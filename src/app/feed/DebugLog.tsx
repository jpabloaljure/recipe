"use client";

import { useEffect, useState } from "react";
import { debugEnabled } from "../../lib/player/debug-log";
import styles from "./Feed.module.css";

const VISIBLE_LINES = 30;

/** The player log on screen, only with `?debug` in the address. It never catches a tap. */
export function DebugLog() {
  const [enabled, setEnabled] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!debugEnabled()) return;
    setEnabled(true);
    const update = () => setLines([...((window as Window & { __playerLog?: string[] }).__playerLog ?? [])]);
    update();
    window.addEventListener("playerlog", update);
    return () => window.removeEventListener("playerlog", update);
  }, []);

  if (!enabled) return null;
  return (
    <pre className={styles.debug} data-testid="player-debug-log">
      {lines.slice(-VISIBLE_LINES).join("\n")}
    </pre>
  );
}
