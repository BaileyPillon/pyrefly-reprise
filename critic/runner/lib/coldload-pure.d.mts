/** Types for `critic/runner/lib/coldload-pure.mjs`, so the unit tests can import it. */
export declare const COLD_TIMEOUT_MS: number;
export declare const HOST_BUSY_PCT: number;
export declare const HOST_SAMPLE_MS: number;
export interface Throttle { downMbps: number; upMbps: number; latencyMs: number }
export declare const THROTTLE_DEFAULT: Readonly<Throttle>;
export interface NetworkProfile { name: string; throttled: boolean; net: null | { offline: boolean; latency: number; downloadThroughput: number; uploadThroughput: number } }
export declare function profilesFor(o?: { runs?: number; throttle?: Throttle | null }): NetworkProfile[];
export declare function parseThrottle(arg: unknown): Throttle | null;
export declare function medianOf(values: (number | null | undefined)[]): number | null;
export interface ColdRun {
  profile: string; throttled: boolean; wallMsToTitle: number | null; pageMsToTitle?: number | null; bytesAtTitle?: number; requestsAtTitle?: number;
  navigations?: number; cacheDisabled?: boolean; timedOut?: boolean; host?: { cpuBusyPct: number | null }; error?: string;
}
export declare function judgeColdRun(rec: Pick<ColdRun, 'navigations' | 'cacheDisabled' | 'timedOut' | 'wallMsToTitle' | 'error'>): { protocol: boolean; problems: string[]; reachedTitle: boolean };
export declare function cpuBusyPct(before: { times: Record<'user' | 'nice' | 'sys' | 'irq' | 'idle', number> }[], after: { times: Record<'user' | 'nice' | 'sys' | 'irq' | 'idle', number> }[]): number | null;
export declare function frameStats(timestamps: number[]): { frames: number; medianMs: number | null; p95Ms: number | null; maxMs: number | null };
export interface ColdSummary {
  runs: number;
  unthrottled: { runs: number; reached: number; timedOut: number; medianMs: number | null; minMs: number | null; maxMs: number | null; medianPageMs: number | null; medianBytesAtTitle: number | null; medianRequestsAtTitle: number | null };
  throttled: { profile: string; protocol: boolean; reachedTitle: boolean; wallMsToTitle: number | null; bytesAtTitle: number | null }[];
  protocolProblems: { profile: string; problems: string[] }[];
  busyHost: { profile: string; cpuBusyPct: number }[];
  hostUnread: string[];
}
export declare function summarizeColdLoads(runs: ColdRun[], o?: { busyPct?: number }): ColdSummary;
export declare function coldLoadReportLine(summary: ColdSummary, ctx?: { base?: string; mode?: string; viewport?: string; browser?: string; machine?: string }): string;
