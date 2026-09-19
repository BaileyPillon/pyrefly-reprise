export declare const SWIFTSHADER_ARGS: readonly string[];
export declare const GPU_ARGS: readonly string[];
export declare const BROWSER_MODES: readonly ['swiftshader', 'gpu'];
export type BrowserMode = (typeof BROWSER_MODES)[number];

export declare function resolveBrowserMode(env?: Record<string, string | undefined>): BrowserMode;
export declare function chromiumArgsForMode(mode: BrowserMode): readonly string[];
export declare function currentChromiumArgs(env?: Record<string, string | undefined>): readonly string[];
