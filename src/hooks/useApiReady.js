import { useEffect, useState } from "react";
import { getHealthCheckUrl } from "../config/api";

const MAX_WAIT_MS = 30_000;
const PING_INTERVAL_MS = 1500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pingHealth() {
  try {
    const res = await fetch(getHealthCheckUrl(), { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Waits for the backend health check (Render cold start) before mounting data-heavy UI.
 * After MAX_WAIT_MS, sets apiReady anyway so the app is not blocked forever.
 */
export function useApiReady() {
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    (async () => {
      while (!cancelled && Date.now() - started < MAX_WAIT_MS) {
        if (await pingHealth()) {
          if (!cancelled) setApiReady(true);
          return;
        }
        await sleep(PING_INTERVAL_MS);
      }
      if (!cancelled) setApiReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { apiReady };
}
