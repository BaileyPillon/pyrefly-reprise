/**
 * The three FFX-2 party rows: dressphere monogram, name, HP/MP, ATB runway and
 * status chips.
 *
 * Split out of `FFX2BattleHud.ts` when the boss strip and the damage numerals
 * landed there — the house rule is 400 lines a file (`docs/DEV.md`), and the
 * row markup is the part of that HUD that stands on its own.
 *
 * Geometry comes from the shared Ink & Gold layer (`.ig-stat*`), with one
 * exception the layer explicitly leaves to the HUD owner: `.ig-stat__od`'s
 * width, which FFX-2 drives from the actor's `required` ticks so that
 * `research/visual-bible.md` §4.3's verified "higher Agility = shorter bar to
 * fill" is literally what the pixels say.
 */

import type { AtbSnapshot, CombatantId, FFX2Combatant } from '../../battle/common/types.ts';
import { dressphereAbbr, dressphereColour, dressphereLabel } from './dressphereIcons.ts';
import { statusChipsFor, statusChipsHtml } from './statusChips.ts';
import { faceLayersHtml } from '../common/portrait.ts';

/** `AtbState.ticks`'s own reference: one drawn bar at default speed [types.ts §7]. */
export const TICKS_PER_BAR = 24000;

/**
 * §4.3: "draw the track at `306 * (agility_reference / agility)` px clamped to
 * `[120, 306]`, right-aligned, so a fast character visibly has a shorter
 * runway". Those numbers are quoted against §4.1's 348px-wide party panel; this
 * row is 170px wide (it shrank when the panel moved off the actors — see
 * `ffx2-hud.css`), so the pair is scaled by the same 170/348 and rounded.
 *
 * The track is a full-width second line now rather than a stub squeezed in
 * beside the MP figure, which is what §4.3's verified layout requirement asks
 * for in the first place: **"the ATB bar sits under the HP and MP data"**.
 */
export const BAR_MIN_PX = 58;
export const BAR_MAX_PX = 132;

export function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

/** §4.9 correction: white >= 33% max, gold-critical < 33%, blood at 0. */
export function hpClass(hp: number, maxHp: number): string {
  if (hp <= 0) return 'ffx2-hp--ko';
  return hp / Math.max(1, maxHp) < 0.33 ? 'ffx2-hp--crit' : '';
}

export function barTrackWidth(required: number): number {
  if (!required) return BAR_MAX_PX;
  return clamp(BAR_MIN_PX, BAR_MAX_PX, BAR_MAX_PX * (required / TICKS_PER_BAR));
}

export interface PartyRowOptions {
  /** The actor whose command menu is open, if any — drives `.ig-stat--acting`. */
  actingId: CombatantId | null;
  /** Row index, for the cascade offset. */
  index: number;
}

/**
 * One `.ig-stat` row: monogram, then a two-line body — `Name  HP  MP  [chips]`
 * over the full-width ATB track.
 *
 * Two shape changes from what shipped, both to stop the row overflowing itself.
 * The single-line version asked for 240px of content inside a 200px row, which
 * is why Paine's status chip ended up hanging off the end (and why it was cut
 * to two letters in the first place — see `statusChips.ts`); and §4.3's own
 * verified layout puts the bar under the data rather than beside it.
 *
 * The rows also cascade with `margin-right` rather than the shared layer's
 * `margin-left`: FFX-2's list is anchored by its *right* edge now, so the step
 * has to come off that same edge or the cascade would walk the rows out of the
 * frame instead of into it.
 */
/**
 * The girl's face for a row, as a stack of layers in one square tile.
 *
 * Painted portraits, not the bare job monogram the rows shipped with: the
 * monogram alone is the one thing the FFX side never does (`ui/ffx/
 * portraits.ts` stacks the same three layers), and a row of `WM` / `DK` / `WR`
 * tiles next to three painted girls is what the report called out.
 *
 * The layers are stacked rather than chosen because the manifest may not have
 * landed yet on the first frame, and because the art for a girl in a given
 * dressphere arrives in three different shapes:
 *
 * - **z2** `portraits/<girl>-<dressphere>.png`, then `portraits/<girl>-x2.png`,
 *   then `portraits/<girl>.png` — the dedicated head-and-shoulders painting.
 *   Only Yuna's and Rikku's plain FFX portraits exist today; the X-2 ones are
 *   still numbered candidates (`portraits/yuna-ffx2-a.*`), so the specific ids
 *   cost nothing now and start working the moment the fleet picks one.
 * - **z1** the head band of `characters/<girl>-<dressphere>/idle.png`, the
 *   full-body painting the stage is already drawing (so it is in cache). This
 *   is what gives **Paine** a painted face at all — she has no portrait file —
 *   and it is per dressphere, which is the "per current dressphere" the report
 *   asks for.
 * - **z0** the two-letter job monogram, unchanged, as the floor.
 *
 * Each `<img>` removes itself on a miss, so whichever layer is real wins and
 * nothing ever shows a broken image.
 */
function faceStackHtml(c: FFX2Combatant, dressphere: string, monogram: string): string {
  const art = `${c.id}-${dressphere}`;
  // The stacking itself lives in `ui/common/portrait.ts` so the prep screen's
  // roster — which draws Paine's initial where this draws her face — can adopt
  // it in one line (docs/handoff/fix3-ffx2-hud-prep.md).
  const layers = faceLayersHtml([art, `${c.id}-x2`, c.id], art, c.name, {
    className: 'ffx2stat__face-img',
  });
  return `<div class="ffx2stat__face" title="${dressphereLabel(dressphere)}" style="--ffx2-job:${dressphereColour(dressphere)}">
      <span class="ffx2stat__mono">${monogram}</span>
      ${layers}
      <i class="ffx2stat__job">${monogram}</i>
    </div>`;
}

export function partyRowHtml(
  c: FFX2Combatant,
  bar: AtbSnapshot['bars'][number] | null,
  opts: PartyRowOptions,
): string {
  const dressphere = c.dresspheres?.current ?? 'gunner';
  // Two letters, from the shared table: `charAt(0)` drew the same `W` for
  // Paine's Warrior and Yuna's White Mage. See `dressphereIcons.dressphereAbbr`.
  const monogram = dressphereAbbr(dressphere);
  const trackW = barTrackWidth(bar?.required ?? TICKS_PER_BAR);
  const fillPct = clamp(0, 100, (bar?.fill ?? 0) * 100);
  const stateClass = bar ? `ffx2atb--${bar.state}` : '';
  const readyClass = bar?.ready ? 'ffx2atb--ready' : '';
  const charge =
    bar?.charge != null
      ? `<div class="ffx2atb__charge" style="width:${clamp(0, 100, bar.charge * 100)}%"></div>`
      : '';
  const acting = c.id === opts.actingId ? ' ig-stat--acting' : '';
  const statuses = statusChipsHtml(statusChipsFor(c.statuses));
  return `<div class="ig-stat${acting}" data-actor-id="${c.id}" style="margin-right: calc(var(--ig-stat-step) * ${opts.index})">
    ${faceStackHtml(c, dressphere, monogram)}
    <div class="ffx2stat__body">
      <div class="ffx2stat__top">
        <div class="ig-stat__name">${c.name}</div>
        <div class="ig-stat__value ${hpClass(c.hp, c.stats.maxHp)}">${Math.max(0, c.hp)}<small>/${c.stats.maxHp}</small></div>
        <div class="ig-stat__value ig-stat__value--mp">${c.mp}<small>/${c.stats.maxMp}</small></div>
        <div class="ffx2party__status">${statuses}</div>
      </div>
      <div class="ig-stat__od ffx2atb__track ${stateClass} ${readyClass}" style="width:${trackW}px">
        <i class="ffx2atb__fill" style="width:${fillPct}%"></i>
        ${charge}
      </div>
    </div>
  </div>`;
}
