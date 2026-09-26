/**
 * The story-text lint: what may never reach the dialogue box (CHK-007).
 *
 * **Game case: both** (shared plumbing, CHK-020). Every line a chapter speaks,
 * in either game, goes through the same box, and the box prints its text
 * literally: `*better*` shows as two asterisks, not as emphasis (PR-0102).
 * So a line that carries markup, a research citation or an engine id is a
 * defect on screen however it reads in the source.
 *
 * What it rejects, per `critic/CHECKS.md` CHK-007 and the thresholds program
 * (`docs/plans/thresholds-program-2026-09-26.md` §2, batch 4):
 *
 * - Markdown and markup: `*`, `_`, `` ` ``, `[`, `]`, `<`, `>`;
 * - research citations: `§`;
 * - file stems and paths: `ffx-` / `ffx2-` prefixes, `.ts` / `.png` / `.json`
 *   / `.md` suffixes;
 * - raw ids: a lowercase token of three or more hyphen-joined parts
 *   (`x2-leblanc-not-so-mighty-guard`), and camelCase (`ormiActOne`).
 *
 * An ordinary hyphenated word ("half-sphere", "Fem-Goon", "Not-So-Mighty")
 * passes: two lowercase parts are English, three or more lowercase parts in a
 * row are an id.
 *
 * Wired through `lintScript` in `./dsl.ts`, which every story test
 * already runs; `tests/unit/story-text-lint.test.ts` runs it over every line
 * of every registered chapter.
 */

/** One reason a line may not be shown. */
export interface StoryTextRule {
  /** What the finding says. */
  message: string;
  test: (text: string) => boolean;
}

export const STORY_TEXT_RULES: readonly StoryTextRule[] = [
  { message: 'markup character (* _ ` [ ] < >) shows literally in the box', test: (t) => /[*_`[\]<>]/.test(t) },
  { message: 'research citation mark (§)', test: (t) => t.includes('§') },
  { message: 'file stem (ffx-/ffx2- prefix)', test: (t) => /\bffx2?-[a-z]/i.test(t) },
  { message: 'file extension (.ts/.png/.json/.md)', test: (t) => /\.(ts|png|json|md)\b/i.test(t) },
  { message: 'raw id (three or more lowercase hyphen-joined parts)', test: (t) => /\b[a-z0-9]+(?:-[a-z0-9]+){2,}\b/.test(t) },
  { message: 'raw id (camelCase)', test: (t) => /\b[a-z]+[A-Z][A-Za-z]*\b/.test(t) },
];

/** Every rule `text` breaks, as messages. Empty when the line may be shown. */
export function storyTextIssues(text: string): string[] {
  return STORY_TEXT_RULES.filter((r) => r.test(text)).map((r) => r.message);
}
