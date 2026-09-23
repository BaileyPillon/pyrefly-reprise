import './enemy-intent-brief-status.css';
import { escapeHtml } from './html.ts';

/**
 * Promote a meaningful-chance status into the enemy-intent panel's brief body
 * (round 09 PR-0011, FFX only).
 *
 * FFX mounts the shared panel (`src/ui/common/EnemyIntent.ts`) at density
 * `'brief'` (`src/ui/ffx/FFXBattleHud.ts`), which is what hides the Statuses
 * block entirely (`bodyHtml`'s `full &&` guard) — so Lance of Atrophy's 100%
 * Zombie, the fact the whole Seymour Flux chapter turns on, never reaches the
 * player even though `view.statusText` already carries it
 * (`src/data/ffx/enemies/seymour-flux-abilities.ts`'s
 * `statusEffects: [{ status: 'zombie', chance: 100 }]`, read out by
 * `predictEnemyIntent`). Widening the panel is not the fix here: round 02
 * asked for brief density in FFX specifically, and PR-0010 is already fighting
 * the panel's own height cap in the same release. So this promotes at most
 * one line instead of the whole block — the highest-chance status that is not
 * already blocked by a ward, as a chip beside the move name's SCRIPTED/Likely
 * badge — which survives at brief density without adding a section.
 *
 * FFX-2 is untouched: it mounts at `'full'` (`src/ui/ffx2/FFX2BattleHud.ts`),
 * so the Statuses block already renders there, and `bodyHtml` only calls this
 * for the density where that block does not.
 *
 * The threshold below is 40, not "100 only": `lanceOfAtrophy`'s own comment
 * (`src/data/ffx/enemies/seymour-flux-abilities.ts`) records that "a Zombie
 * Ward halves it to ~49.5%", and a live check against the shipped rotation's
 * default party found exactly that — `"Zombie 50%"` on the targeted
 * character, not the bare ability chance of 100. A threshold of 80 would have
 * hidden the fact for that party. 40 still excludes an incidental low-chance
 * status while keeping the case the ward itself is built to produce.
 */
const MEANINGFUL_CHANCE = 40;

/** `view.statusText` entries look like `"Zombie 100%"` or `"Zombie 40% (blocked)"`. */
const PERCENT_IN_STATUS_TEXT = /(\d+)%/;

export function briefStatusChip(statusText: readonly string[]): string {
  const best = statusText
    .filter((s) => !s.includes('(blocked)'))
    .map((s) => ({ text: s, percent: Number(PERCENT_IN_STATUS_TEXT.exec(s)?.[1] ?? '0') }))
    .sort((a, b) => b.percent - a.percent)[0];
  if (!best || best.percent < MEANINGFUL_CHANCE) return '';
  return `<span class="eint__status-chip">${escapeHtml(best.text)}</span>`;
}
