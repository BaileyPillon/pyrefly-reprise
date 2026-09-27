/**
 * One retry for a transient host error (PR-0149, both games).
 *
 * GitHub Pages occasionally answers a shipped file with a 5xx (a pose sidecar
 * returned 503 once on live; a re-fetch returned 200). A painted pose that
 * loses its sidecar silently loses its scale, anchor and facing, so the loaders
 * in `PaintedArt.ts` try once more after about half a second. A 404 or any
 * other 4xx is a real answer and is not retried, so a true miss stays fast.
 */

export const RETRY_DELAY_MS = 500;

export type Sleep = (ms: number) => Promise<void>;

const realSleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The pause before the one retry, for loaders that cannot use the helpers below. */
export function retryPause(): Promise<void> {
  return realSleep(RETRY_DELAY_MS);
}

export interface RetryOptions {
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
  sleep?: Sleep;
  delayMs?: number;
}

/** `fetch`, retried once on a 5xx answer or a thrown request. */
export async function fetchWithOneRetry(
  url: string,
  init: RequestInit = {},
  opts: RetryOptions = {},
): Promise<Response> {
  const doFetch = opts.fetchImpl ?? ((input: string, i?: RequestInit) => fetch(input, i));
  const sleep = opts.sleep ?? realSleep;
  const delay = opts.delayMs ?? RETRY_DELAY_MS;
  try {
    const first = await doFetch(url, init);
    if (first.status < 500) return first;
  } catch {
    // A thrown request (network blip): fall through to the one retry.
  }
  await sleep(delay);
  return doFetch(url, init);
}
