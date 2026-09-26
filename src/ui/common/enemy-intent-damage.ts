import { escapeHtml } from './html.ts';
import type { IntentTargetView, IntentView } from './EnemyIntent.ts';

/**
 * The enemy-intent slab's Damage block (`src/ui/common/EnemyIntent.ts`,
 * `bodyHtml`), both games.
 *
 * PR-0153: a move whose victim is rolled (`view.randomTarget`, measured by both
 * predictors through `src/battle/common/intentTargets.ts`) used to print one
 * row — whichever character the dry run happened to pick — under a SCRIPTED
 * badge, and the player read it as "Lance hits Tidus". It now prints every
 * candidate under a "random target" head, each with its own lethal flag, so
 * the SCRIPTED badge answers for the move and nothing else.
 */

function num(n: number): string {
  return Math.abs(Math.round(n)).toLocaleString('en-US');
}

function rowHtml(t: IntentTargetView): string {
  // The sign is the engine's: positive means HP is lost. A boss healing
  // itself therefore reads as a negative amount, and the row says so rather
  // than printing a bare number the player has to interpret.
  const restoring = t.amount < 0;
  const pct = Math.round(t.hpFraction * 100);
  const band = t.min !== t.max ? `${num(t.min)}–${num(t.max)}` : num(t.amount);
  const hit = t.hitChancePercent !== null && t.hitChancePercent < 100 ? ` <i>${Math.max(0, Math.round(t.hitChancePercent))}% to hit</i>` : '';
  return (
    `<li class="eint__dmg${t.lethal ? ' eint__dmg--lethal' : ''}${restoring ? ' eint__dmg--heal' : ''}">` +
    `<span class="eint__who">${escapeHtml(t.targetName)}</span>` +
    `<span class="eint__amt">${restoring ? '+' : ''}${band}</span>` +
    `<span class="eint__pct">${t.lethal ? 'KO' : restoring ? 'heals' : `${pct}% HP`}</span>${hit}` +
    '</li>'
  );
}

export function damageHtml(view: IntentView): string {
  const est = view.estimate;
  const random = view.randomTarget;
  if (random && random.rows.length > 1) {
    const note = random.perHit
      ? `${random.hits} hits, each on a random one of these. Damage shown per hit.`
      : 'Lands on one of these, picked when it acts.';
    // A status-only move (Bahamut's Curse) still has a rolled victim; it has
    // no numbers, so its rows are names, never damage rows (round 03 #37).
    const harms = random.rows.some((t) => t.amount !== 0);
    const rows = harms
      ? random.rows.map(rowHtml).join('')
      : random.rows.map((t) => `<li class="eint__cand">${escapeHtml(t.targetName)}</li>`).join('');
    return (
      `<h4 class="eint__head eint__head--random">${harms ? 'Damage · random target' : 'Random target'}</h4>` +
      `<ul class="eint__dmgs eint__dmgs--random">${rows}</ul>` +
      `<p class="eint__note">${escapeHtml(note)}</p>`
    );
  }
  if (!est) return '';
  // A target the move merely *touched* — a status application with no HP
  // change, e.g. Bahamut's Curse (`formula: 'none'`, `power: 0`) — is not
  // damage and not a heal. `touchedFFX2`/its FFX twin list it in `perTarget`
  // anyway (the move did something to it), so this is the layer that decides
  // a zero row earns no place in a section titled "Damage". Round 03 #37: "a
  // move that deals no damage shows no damage section at all, in both games."
  const targets = est.perTarget.filter((t) => t.amount !== 0);
  if (targets.length === 0) return '';
  const hits = est.hits > 1 ? `<p class="eint__note">${est.hits} hits each.</p>` : '';
  return `<h4 class="eint__head">Damage</h4><ul class="eint__dmgs">${targets.map(rowHtml).join('')}</ul>${hits}`;
}

/** Every row the slab may flag lethal: the estimate's, and a random target's candidates. */
export function anyLethalRow(view: IntentView): boolean {
  return (view.randomTarget?.rows ?? view.estimate?.perTarget ?? []).some((t) => t.lethal);
}
