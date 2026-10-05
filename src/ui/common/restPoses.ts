/**
 * The Sleep hunch and the low-HP ("critical") painting: which painting a party member **rests** in
 * (D-296, the paintings Bailey approved on 2026-09-30, D-298: "all your recommendations, godspeed").
 *
 * Sources (rule 6), `research/status-display.md`:
 * - Sleep, both games: FFX "they appear hunched over and have Z's emerge from their head" (§2, FF Wiki
 *   *Sleep (Final Fantasy X status)* rev 4030962); FFX-2 "Their battle model will hunch over and Z's
 *   appear above their head" (§3, 2 sources). The Z's stay the status layer's overlay (`statusMarks.ts`),
 *   drawn over the painting as before.
 * - Critical, FFX: "Their HP digits turn yellow and the character slouches in fatigue" (§2, W-XS rev
 *   4030921). The threshold is the one the HUD's yellow digits use, HP below half of max
 *   (`FFX_HP_YELLOW_BELOW`, research/ffx-combat-core.md V8). One painting stands for both of FFX's bands
 *   (the "even more exhausted stance" under 25 % is not painted separately).
 * - Critical, FFX-2: below a third of max HP the girl appears "tired and hunched over" and "visibly kneels"
 *   (§3, 2 sources). The threshold is the HUD's gold digits, `hpClass` (< 33 %, research/ffx2-combat-core.md §4.9).
 *
 * Game case (rule 14): both games, each with its own threshold; the paintings are per character (FFX cast
 * and FFX-2 dresspheres). A figure with no painting of its own for the pose keeps today's standing painting.
 *
 * Precedence (written down, pinned by tests/unit/rest-poses.test.ts):
 *   KO (not alive)            -> the presenter's KO pose; this module stands aside (rest = idle).
 *   Petrify (both), Stop (FFX-2) -> HOLD: the figure keeps the painting it had when the stone or the freeze
 *                                set (a statue does not change its pose; Stop "prevents all movement").
 *   Sleep                     -> 'sleep' (over Critical: the sleeping hunch is the status on the figure).
 *   HP below the HUD's yellow -> 'critical'.
 *   otherwise                 -> 'idle'.
 * Zombie's green, Berserk's red, Curse's brown or darkening and Pointless's flash are tints on whatever
 * painting is up (`statusFigureTint.ts`), so they combine with any of the three. An action's own pose
 * (ready, attack, cast, item, hurt, defend, victory, ko) is never replaced: only a request for a *resting*
 * pose (idle, sleep, critical) is turned into the current rest, so every place the presenter says "back to
 * idle" (after an action, after a flinch, a revive, a spherechange) lands on the right painting.
 *
 * Rule 1: presentation only. Reads the battle state; writes only which painting a figure shows, through the
 * figure's own `setPose`. REDUCE MOTION: nothing here moves; the swap is the figure's usual pose crossfade.
 */

import type { AnyCombatant, BattleState, CombatantId } from '../../battle/common/types.ts';
import { FFX_HP_YELLOW_BELOW } from '../ffx/PartyStatusWindow.ts';
import { hpClass } from '../ffx2/PartyRows.ts';
import type { StatusGame } from './statusLooks.ts';
import { characterUrl } from '../../engine/BattlePresenterArt.ts';
import { sidecarUrlOf } from '../../engine/ArtShipped.ts';

export type RestPose = 'idle' | 'sleep' | 'critical';

/** The names that mean "at rest": a request for any of them is answered with the current rest. */
export const REST_POSES: ReadonlySet<string> = new Set<RestPose>(['idle', 'sleep', 'critical']);

/** 'hold' = keep whatever rest the figure had (Petrify, FFX-2 Stop). */
export type RestAnswer = RestPose | 'hold';

const has = (c: AnyCombatant, s: string): boolean => {
  const v = (c.statuses as Record<string, unknown>)[s];
  return v !== undefined && v !== null;
};

/** Is this member at the HUD's low-HP colour in this game? */
export function isLowHp(game: StatusGame, hp: number, maxHp: number): boolean {
  if (hp <= 0) return false;
  if (game === 'ffx2') return hpClass(hp, maxHp) === 'ffx2-hp--crit';
  return hp / Math.max(1, maxHp) < FFX_HP_YELLOW_BELOW;
}

/** The resting painting for one combatant. Pure. Party members only; everyone else rests in idle. */
export function restPoseOf(game: StatusGame, c: AnyCombatant): RestAnswer {
  if (c.side !== 'party') return 'idle';
  if (!c.alive || c.hp <= 0) return 'idle';
  if (has(c, 'petrify') || (game === 'ffx2' && has(c, 'stop'))) return 'hold';
  if (has(c, 'sleep')) return 'sleep';
  if (isLowHp(game, c.hp, c.stats.maxHp)) return 'critical';
  return 'idle';
}

/** The figure surface this needs; `PaintedActor` has all of it. */
export interface PoseFigure {
  setPose(name: string, opts?: { immediate?: boolean; force?: boolean }): void;
  readonly pose: string;
}

export interface RestField {
  actor(id: CombatantId): unknown;
  /** Its own painting for a pose, not a fallback (`PaintedStage.paints`). */
  paints?(id: CombatantId, pose: string): boolean;
  /** Which painting (art id) each combatant wears (`PaintedStage.snapshot`). */
  snapshot?(): ReadonlyArray<{ id: CombatantId; art: string }>;
}

/** A screen rectangle (CSS px), the painted silhouette's box (`PaintedStage.projectRect`). */
export interface HeadRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Wrapped {
  id: CombatantId;
  /** The figure's own `setPose` when it was an own property (a prototype method needs no restore). */
  own: PoseFigure['setPose'] | null;
  wrapper: PoseFigure['setPose'];
}

const isFigure = (a: unknown): a is PoseFigure =>
  !!a && typeof (a as PoseFigure).setPose === 'function' && typeof (a as PoseFigure).pose === 'string';

export class RestPoses {
  private readonly rest = new Map<CombatantId, RestPose>();
  private readonly wrapped = new Map<PoseFigure, Wrapped>();
  /** `headTop` from each rest painting's sidecar, by URL: the top of the hunched head, fractions of the opaque box. */
  private readonly heads = new Map<string, readonly [number, number] | null>();

  constructor(private readonly game: StatusGame, private readonly field: () => RestField | null) {}

  /** The rest each member is in right now (tests, captures). */
  restOf(id: CombatantId): RestPose {
    return this.rest.get(id) ?? 'idle';
  }

  sync(state: BattleState): void {
    const f = this.field();
    for (const c of Object.values(state.combatants)) {
      if (!c || c.side !== 'party') continue;
      const answer = restPoseOf(this.game, c);
      const before = this.rest.get(c.id) ?? 'idle';
      const next = answer === 'hold' ? before : answer;
      this.rest.set(c.id, next);
      const fig = f?.actor(c.id);
      if (!isFigure(fig)) continue;
      this.wrap(fig, c.id);
      // Resting now and the painting it should rest in changed: ask for "idle", which the wrapper answers.
      if (next !== before && REST_POSES.has(fig.pose)) fig.setPose('idle');
    }
  }

  /**
   * Where the status marks sit on a figure resting in its sleep or critical painting: the top of the painted head
   * (the sidecar's `headTop`, measured on the painting), inside the silhouette's screen box. `null` for any other
   * pose, or before the sidecar has been read: the marks then use the field's standing head, as before. Party
   * paintings face right on a party that faces right, so no mirror is applied.
   */
  headOf(id: CombatantId, rect: HeadRect | null): { x: number; y: number } | null {
    const fig = this.field()?.actor(id);
    if (!rect || !isFigure(fig) || (fig.pose !== 'sleep' && fig.pose !== 'critical')) return null;
    const art = this.field()?.snapshot?.().find((s) => s.id === id)?.art;
    if (!art) return null;
    const url = sidecarUrlOf(characterUrl(art, fig.pose));
    if (!this.heads.has(url)) {
      this.heads.set(url, null);
      void fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { headTop?: unknown } | null) => {
          const h = j?.headTop;
          if (Array.isArray(h) && h.length === 2 && h.every((v) => typeof v === 'number' && v >= 0 && v <= 1)) this.heads.set(url, [h[0], h[1]]);
        })
        .catch(() => undefined);
      return null;
    }
    const h = this.heads.get(url);
    return h ? { x: rect.x + h[0] * rect.w, y: rect.y + h[1] * rect.h } : null;
  }

  /** The painting a rest request lands on for this member: its rest, when it has that painting. */
  private target(id: CombatantId): RestPose {
    const r = this.rest.get(id) ?? 'idle';
    if (r === 'idle') return 'idle';
    return this.field()?.paints?.(id, r) === true ? r : 'idle';
  }

  private wrap(fig: PoseFigure, id: CombatantId): void {
    const had = this.wrapped.get(fig);
    if (had) {
      had.id = id;
      return;
    }
    const own = Object.prototype.hasOwnProperty.call(fig, 'setPose') ? fig.setPose : null;
    const original = fig.setPose;
    const entry: Wrapped = {
      id,
      own,
      wrapper: (name, opts) => original.call(fig, REST_POSES.has(name) ? this.target(entry.id) : name, opts),
    };
    (fig as { setPose: PoseFigure['setPose'] }).setPose = entry.wrapper;
    this.wrapped.set(fig, entry);
  }

  /** Put every figure back on its own `setPose` and on the painting it would show without this module. */
  dispose(): void {
    for (const [fig, w] of this.wrapped) {
      if (fig.setPose !== w.wrapper) continue;
      if (w.own) (fig as { setPose: PoseFigure['setPose'] }).setPose = w.own;
      else delete (fig as { setPose?: unknown }).setPose;
      if (fig.pose === 'sleep' || fig.pose === 'critical') fig.setPose('idle', { immediate: true });
    }
    this.wrapped.clear();
    this.rest.clear();
  }
}
