/**
 * What the upright phone's enemy-move line must not sit on (iter2 B6: "the
 * phone intent strip over the Vegnagun leg's lens").
 *
 * The phone hangs the enemy-move line under the rail, full width
 * (`phone-battle-parts.css`). At Chapter V's link 2 the colossus staging
 * (D-228, the picked phone frame) runs the leg off the top edge, and the line
 * lay on the leg's green lens (0.99 of it, `docs/handoff/iter2-vegnagun-a.md`
 * "Not met" item 1). The picked frame stays as it is; the HUD steps aside:
 * when the line would cover a guarded feature, it moves to the wider side of
 * that feature, keeping its top.
 *
 * The desktop solver's hard features (`engine/keyFeatures.ts`: faces and
 * weapons) are left alone; this table only holds what the phone's line must
 * miss, as fractions of the painting's tight alpha box, which is what
 * `TargetingPort.rect` projects (`BattlePresenterStage.projectRect`).
 *
 * Game case (AGENTS.md rule 14): the mechanism is **both** (shared phone
 * plumbing); the only table entry is FFX-2's (Chapter V). No camera, rig,
 * painting or number of either game changes.
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import type { PhoneField } from './phoneFraming.ts';

export interface GuardBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** `[u0, t0, u1, t1]`: fractions across and down the painting's tight alpha box. */
export type GuardFraction = readonly [number, number, number, number];

/**
 * The guarded features by painting id. The leg's lens: its idle painting is
 * 777 x 1175 with a tight alpha box of (16, 16)-(761, 1159); the green glass,
 * measured by colour, spans x 196 to 312 and y 630 to 712 (painting pixels).
 */
export const PHONE_GUARDS: Readonly<Record<string, Readonly<Record<string, GuardFraction>>>> = Object.freeze({
  'vegnagun-leg': { lens: [(196 - 16) / 745, (630 - 16) / 1143, (312 - 16) / 745, (712 - 16) / 1143] },
});

/** Screen pixels of room kept round a guarded feature. */
export const GUARD_PAD = 6;
/** The line never narrows below this (two words of the move and its number fit). */
export const MIN_LINE_WIDTH = 180;
/** The line's gutter from the window's edges (the stylesheet's `left: 10px`). */
export const LINE_GUTTER = 10;
/** Once the line has moved, it stays moved until the feature is this much further away (camera sway). */
export const GUARD_HYSTERESIS = 12;

type RectOf = (id: CombatantId) => GuardBox | null;

/** Each guarded feature of the listed figures, on screen, padded. */
export function guardBoxes(ids: readonly CombatantId[], rectOf: RectOf, pad = GUARD_PAD): GuardBox[] {
  const out: GuardBox[] = [];
  for (const id of ids) {
    const table = PHONE_GUARDS[id];
    if (!table) continue;
    const r = rectOf(id);
    if (!r || !Number.isFinite(r.x) || !Number.isFinite(r.y) || r.w <= 0 || r.h <= 0) continue;
    for (const [u0, t0, u1, t1] of Object.values(table)) {
      const x = r.x + u0 * r.w - pad;
      const y = r.y + t0 * r.h - pad;
      out.push({ x, y, w: (u1 - u0) * r.w + 2 * pad, h: (t1 - t0) * r.h + 2 * pad });
    }
  }
  return out;
}

const hits = (a: GuardBox, b: GuardBox, grow = 0): boolean =>
  a.x < b.x + b.w + grow && b.x - grow < a.x + a.w && a.y < b.y + b.h + grow && b.y - grow < a.y + a.h;

/** Where the line goes: its left edge and widest width, in CSS px. */
export interface LineSlot {
  left: number;
  maxWidth: number;
}

/**
 * The line's slot. `line` is where the line stands at its default slot (full
 * width from the gutter); `moved` says whether it is already out of the way,
 * which widens the test by {@link GUARD_HYSTERESIS} so camera sway cannot
 * flick it back and forth. Null: the default slot (nothing covered, or no side
 * has room, in which case the line keeps its place rather than being crushed).
 */
export function lineSlot(line: GuardBox, guards: readonly GuardBox[], viewWidth: number, moved = false): LineSlot | null {
  const grow = moved ? GUARD_HYSTERESIS : 0;
  const under = guards.filter((g) => hits(line, g, grow));
  if (!under.length) return null;
  const lo = Math.min(...under.map((g) => g.x));
  const hi = Math.max(...under.map((g) => g.x + g.w));
  const edge = Math.ceil(hi);
  const right = viewWidth - LINE_GUTTER - edge;
  const left = lo - LINE_GUTTER;
  if (right >= MIN_LINE_WIDTH && right >= left) return { left: edge, maxWidth: Math.floor(right) };
  if (left >= MIN_LINE_WIDTH) return { left: LINE_GUTTER, maxWidth: Math.floor(left) };
  return null;
}

/** A move under this many px is camera sway: the line holds its slot. */
const SLOT_STEP = 4;

/**
 * Put the enemy-move line (or its folded chip) in its slot for the guarded
 * features now on screen, through `--phud-line-left` / `--phud-line-maxw` on
 * `<html>` (`phone-battle-parts.css`). `was` is the slot last applied (its key,
 * `''` for the default); the new key is returned.
 */
export function placeLineSlot(hud: HTMLElement, html: HTMLElement, guards: readonly GuardBox[], viewWidth: number, was: string): string {
  const el =
    hud.querySelector<HTMLElement>('.eint:not(.eint--off) .eint__panel') ?? hud.querySelector<HTMLElement>('.eint--off .eint__toggle');
  let slot: LineSlot | null = null;
  if (el && guards.length) {
    const r = el.getBoundingClientRect();
    const moved = was !== '';
    // Moved, the line is narrower than at its default slot: test the whole default width.
    const line = moved
      ? { x: LINE_GUTTER, y: r.top, w: viewWidth - 2 * LINE_GUTTER, h: r.height }
      : { x: r.left, y: r.top, w: r.width, h: r.height };
    if (r.width > 0 && r.height > 0) slot = lineSlot(line, guards, viewWidth, moved);
  }
  if (slot && was) {
    const [left] = was.split('/').map(Number);
    if (Math.abs(slot.left - (left ?? 0)) < SLOT_STEP) return was;
  }
  const key = slot ? `${slot.left}/${slot.maxWidth}` : '';
  if (key === was) return was;
  if (slot) {
    html.style.setProperty('--phud-line-left', `${slot.left}px`);
    html.style.setProperty('--phud-line-maxw', `${slot.maxWidth}px`);
    // Narrower, the line may run to five lines, so the move and every number still fit.
    html.dataset['phudLineMoved'] = '';
  } else {
    html.style.removeProperty('--phud-line-left');
    html.style.removeProperty('--phud-line-maxw');
    delete html.dataset['phudLineMoved'];
  }
  return key;
}

/** A phone field that can also say where the guarded features stand. */
export interface GuardedPhoneField extends PhoneField {
  guards?(): GuardBox[];
}

/**
 * Wrap the phone field so it remembers the figures' boxes and who is on the
 * field, and can list the guarded features among them (read, never changed).
 */
export function withGuards(field: PhoneField): GuardedPhoneField {
  let rectOf: RectOf | null = null;
  let state: BattleState | null = null;
  const { setRects, setState } = field;
  return Object.assign(field, {
    setRects(rect: RectOf): void {
      rectOf = rect;
      setRects.call(field, rect);
    },
    setState(s: BattleState): void {
      state = s;
      setState.call(field, s);
    },
    guards(): GuardBox[] {
      if (!rectOf || !state) return [];
      const live = state.enemyIds.filter((id) => {
        const c = state!.combatants[id] as { hp?: number } | undefined;
        return !(c && typeof c.hp === 'number' && c.hp <= 0);
      });
      return guardBoxes(live, rectOf);
    },
  });
}
