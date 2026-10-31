/** Types for `tools/measure/session.mjs` (the Playwright objects are left loose on purpose: the tool is a script, not a library). */
export declare function frameMsFor(hz: number): number[];
export declare function sleep(ms: number): Promise<void>;
export interface GameSession {
  browser: any; context: any; page: any; consoleErrors: string[];
  /** The crash capture of tools/browser-crash-capture.mjs (null when PYREFLY_CRASH_CAPTURE=0): `crash.assertAlive()`, `crash.state.crash`, `crash.dump()`. */
  crash: import('../browser-crash-capture.mjs').CrashCapture | null;
  press(k: string): Promise<void>; scr(): Promise<string>; ss(): Promise<any>; want(name: string, ms?: number): Promise<boolean>; menu(): Promise<boolean>; brief(): Promise<boolean>;
}
export declare function launchBrowser(root: string): Promise<any>;
export declare function openGame(browser: any, base: string, query?: string, viewport?: { width: number; height: number }): Promise<GameSession>;
export declare function reachFirstMenu(g: GameSession, chapter: string): Promise<void>;
export declare function pauseClock(page: any): Promise<void>;
export interface Stepper { hz: number; n: number; ms: number; steps: number[]; tick(read?: string | (() => unknown)): Promise<any>; ticks(k: number, read?: string | (() => unknown)): Promise<any> }
export declare function makeStepper(page: any, hz: number): Stepper;
