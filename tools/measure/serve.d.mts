/** Types for `tools/measure/serve.mjs`. */
export declare const MIME: Readonly<Record<string, string>>;
export declare function resolveUnder(root: string, urlPath: string): string | null;
export declare function parseRange(header: string | undefined, size: number): { start: number; end: number } | null | 'bad';
export declare function serveDist(root: string, o?: { port?: number }): Promise<{ base: string; port: number; close: () => Promise<void> }>;
