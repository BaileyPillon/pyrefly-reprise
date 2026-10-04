/** Types for `tools/actions-ledger.mjs`, so the unit test can import the validator and the renderer directly. */

export declare const KINDS: readonly string[];
export declare const GAMES: readonly string[];
export declare const FIRST_DAY: string;

/** One entry of `docs/target/actions.json` (one per line). */
export interface ActionRow {
  id: string;
  date: string;
  kind: string;
  title: string;
  what: string;
  who: string;
  decisions: string[];
  game: string;
  result: string;
  evidence: string[];
  reversible: { value: boolean; how: string };
}

export interface ActionsFile {
  note?: string;
  actions: ActionRow[];
}

/** Every problem in a parsed actions.json; an empty array means it is well formed. */
export declare function validateActions(data: unknown): string[];
/** The whole ACTIONS.md text for a parsed (and valid) actions.json. */
export declare function renderActions(data: ActionsFile): string;
export declare function loadActions(root: string): ActionsFile;
/** Problems with the data, or with an existing ACTIONS.md text that no longer matches it (line endings ignored). */
export declare function compareLedger(data: unknown, existing: string): string[];
/** Validates docs/target/actions.json and compares the rendered text with ACTIONS.md. */
export declare function checkLedger(root: string): { ok: boolean; problems: string[] };
