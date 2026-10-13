/** Types for `critic/runner/lib/coldload.mjs`, so the unit tests can import it. */
import type { ColdRun, ColdSummary, NetworkProfile } from './coldload-pure.mjs';

export interface ColdHandle {
  browser: { close(): Promise<void> };
  page: { goto(url: string, o: { waitUntil: string }): Promise<unknown>; evaluate(fn: unknown, arg?: unknown): Promise<any>; waitForTimeout(ms: number): Promise<void>; on(event: string, handler: (arg: any) => void): void; mainFrame(): unknown; keyboard: { press(key: string): Promise<void> } };
  cdp: { send(method: string, params?: unknown): Promise<unknown>; on(event: string, handler: (arg: any) => void): void };
  version?: string | null;
}
export interface ColdRunRecord extends ColdRun {
  browserVersion?: string | null; error?: string; paint?: unknown; enterToNextScreen?: string | false; enterToNextMs?: number | null; bytesAfterSettle?: number; requestsAfterSettle?: number;
  frameTimes?: { screen: string | null; frames: number; medianMs: number | null; p95Ms: number | null; maxMs: number | null } | null; servedFromCache?: number; pageErrors?: number;
}
export declare function sampleHost(ms?: number): Promise<{ cpuBusyPct: number | null; sampledMs: number }>;
export declare function launchChromium(o?: { width?: number; height?: number }): Promise<ColdHandle>;
export declare function measureCold(o: { launch: () => Promise<ColdHandle>; base: string; profile: NetworkProfile; timeoutMs?: number; pressEnter?: boolean; frames?: number; host?: { cpuBusyPct: number | null } | null; now?: () => number }): Promise<ColdRunRecord>;
export declare function runColdLoads(o: { launch: () => Promise<ColdHandle>; base: string; profiles: NetworkProfile[]; hostSample?: () => Promise<{ cpuBusyPct: number | null }>; log?: (line: string) => void; timeoutMs?: number; pressEnter?: boolean; frames?: number; now?: () => number }): Promise<{ runs: ColdRunRecord[]; summary: ColdSummary }>;
