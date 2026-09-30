/**
 * Per-option debug surfaces for the eye-candy options round: each option's glue registers
 * `snapshot` (merged into `__pyrefly.fx.snapshot()`) and `api` (`__pyrefly.fx.<opt>`).
 * Captures and checks only, never a player path. Pure: no DOM, no `three`.
 */
export const fxDebugHooks: Record<string, { snapshot?: () => unknown; api?: Record<string, unknown> }> = {};
