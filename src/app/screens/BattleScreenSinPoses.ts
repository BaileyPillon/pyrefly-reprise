/**
 * **Sin's painted states in a real battle (FFX only): Genais's shell, the Core's charge, the head's mouth.**
 *
 * Game case: FFX only [AGENTS.md rule 14; research/ffx-sin.md §0.3]. Only Sin's link-3 and link-4 foes carry
 * these ids; every other battle finds none of them and this does nothing.
 *
 * The art is the driver's picks (D-279, delegated by Bailey; `docs/concepts/chapters/sin-2026-09-29/install/
 * INSTALL.md` "The exact keys", items 4 and 5). Each subject's states share one crop box and one baseline, so a
 * swap never moves or resizes the sprite:
 *
 * - **Sinspawn Genais** rests on `shell` while `sin.genais.shelled` holds ("Enters shell."), `idle` otherwise;
 * - **Sin's Core** rests on `charge` while `sin.core.state` is `charging` or `ready` ("Core gathers energy."),
 *   `idle` otherwise;
 * - **Overdrive Sin** rests on `stage-<n>` for `n = sin.mouthStage` (0 shut to 4 fully open,
 *   `overdrive-sin-rules.ts#mouthStage`, our estimate of the stages' turns).
 *
 * Head C is also **placed** per range at its painted framing ({@link OVERDRIVE_SIN_PLACEMENT}); the range
 * director stages only Evrae and the Fins, so the head's framing lives here.
 *
 * The state goes in the idle slot and in every slot the subject has no painting of its own (attack, cast, hurt),
 * the way Evrae's Inhale telegraph does (`scenes/evrae-airship-director.ts`), so a hit reaction never flashes the
 * resting painting. A state the art manifest does not list is never loaded: a subject whose files are not
 * installed keeps the stage's silhouette.
 *
 * Presentation only: reads the engine state, never writes it (rule 1 is the engine's; this is the screen).
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { SIN_CORE_ID, SIN_CORE_STATE, SIN_GENAIS_ID, SIN_GENAIS_SHELLED } from '../../battle/ffx/ai/sin-ids.ts';
import { SIN_MOUTH } from '../../battle/ffx/ai/overdrive-sin-rules.ts';
import { artStatesFor } from '../../engine/ArtManifest.ts';
import { characterUrl } from '../../engine/BattlePresenterArt.ts';
import type { PaintedActor } from '../../engine/PaintedActor.ts';
import type { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import { keepUpright } from '../../scenes/evrae-airship-director.ts';
import { airshipRangeOf, EVRAE_WORLD_HEIGHT, type AirshipRange } from '../../scenes/evrae-airship-range.ts';

/** Overdrive Sin's combatant id and art folder (`src/data/ffx/enemies/overdrive-sin.ts`). */
export const OVERDRIVE_SIN_ID = 'overdrive-sin';

/** Where a subject stands and how tall it is, per range: the painted framing, solved like the Fins'. */
export interface SinPlacement {
  readonly spot: readonly [number, number, number];
  /** World height (the stage drew the subject at `EVRAE_WORLD_HEIGHT`; the group is scaled by the ratio). */
  readonly height: number;
}

/**
 * **Head C's framing** (D-279): its sidecar's `frameFraction` (x 0.41 to 1.0, y 0 to 0.51 of the 2352x1344 frame)
 * and baseline row 678 of 745, cast from each range's `idle` rig onto Evrae's depth for that range, exactly as the
 * Fins are (`scenes/evrae-airship-subjects.ts`): the head fills the upper right of the frame as painted and its
 * cut edges (top, right) sit on the frame's. Derived with three's camera maths on RANGE_STAGING, then looked at
 * in the browser; not measured in the engine.
 */
export const OVERDRIVE_SIN_PLACEMENT: Readonly<Record<AirshipRange, SinPlacement>> = {
  far: { spot: [11.05, 2.57, -30], height: 14.23 },
  near: { spot: [4.29, 2.16, -4.7], height: 4.49 },
};

/** One subject: whose actor, which art folder, and the resting painting the state asks for. */
export interface SinPoseRule {
  readonly id: CombatantId;
  readonly artId: string;
  readonly restFor: (flags: Readonly<Record<string, unknown>>) => string;
  /** Per-range framing, for a subject the range director does not stage (the head); absent = the stage's spot. */
  readonly placement?: Readonly<Record<AirshipRange, SinPlacement>>;
}

/** The three rules, by the flags the engine publishes. */
export const SIN_POSE_RULES: readonly SinPoseRule[] = [
  { id: SIN_GENAIS_ID, artId: 'sinspawn-genais', restFor: (f) => (f[SIN_GENAIS_SHELLED] === true ? 'shell' : 'idle') },
  {
    id: SIN_CORE_ID,
    artId: 'sin-core',
    restFor: (f) => (f[SIN_CORE_STATE] === 'charging' || f[SIN_CORE_STATE] === 'ready' ? 'charge' : 'idle'),
  },
  {
    id: OVERDRIVE_SIN_ID,
    artId: 'overdrive-sin',
    placement: OVERDRIVE_SIN_PLACEMENT,
    restFor: (f) => {
      const n = f[SIN_MOUTH];
      return typeof n === 'number' && Number.isFinite(n) ? `stage-${Math.max(0, Math.min(4, Math.round(n)))}` : 'idle';
    },
  },
];

/** The slots a resting state fills when the subject has no painting of that name. */
const REST_SLOTS = ['idle', 'attack', 'cast', 'hurt'] as const;

/** The pose map that puts `rest` in the idle slot and every unpainted slot, or `null` when `rest` is not installed. */
export function restPoseMap(artId: string, rest: string, states: readonly string[] | null): Record<string, string> | null {
  if (!states || !states.includes(rest)) return null;
  const url = characterUrl(artId, rest);
  const map: Record<string, string> = {};
  for (const slot of REST_SLOTS) if (slot === 'idle' || !states.includes(slot)) map[slot] = url;
  return map;
}

/** The part of the stage this reads. */
type SinPoseStage = Pick<PaintedStage, 'actor'>;

export interface SinPoseFollower {
  /** Follow the engine. Cheap; call every frame with the live state. */
  sync(state: BattleState | null | undefined): void;
}

/**
 * Follow Sin's states on `stage`. Each actor instance is tracked on its own, so a chain's re-stage starts fresh.
 * The first time an installed subject is seen it is made upright (its wide paintings are creatures, not bodies
 * on a floor: `keepUpright`), and the head is placed at its range's framing whenever the range changes.
 */
export function followSinPoses(stage: SinPoseStage, rules: readonly SinPoseRule[] = SIN_POSE_RULES): SinPoseFollower {
  const shown = new WeakMap<PaintedActor, string>();
  const placedAt = new WeakMap<PaintedActor, AirshipRange>();
  const busy = new WeakSet<PaintedActor>();
  return {
    sync(state) {
      if (!state) return;
      for (const rule of rules) {
        const c = state.combatants[rule.id];
        if (!c || c.side !== 'enemy' || c.removed) continue;
        const actor = stage.actor(rule.id) ?? null;
        if (!actor || busy.has(actor) || actor.lifeState === 'down') continue;
        const rest = rule.restFor(state.flags);
        const range = rule.placement ? (airshipRangeOf(state) ?? 'near') : null;
        const first = !shown.has(actor);
        if (!first && shown.get(actor) === rest && placedAt.get(actor) === (range ?? undefined)) continue;
        busy.add(actor);
        void (async (): Promise<void> => {
          try {
            const states = await artStatesFor(rule.artId);
            const map = restPoseMap(rule.artId, rest, states);
            if (map && actor.lifeState !== 'down') {
              if (first) keepUpright(actor);
              if (first || shown.get(actor) !== rest) await actor.loadPoses(map, actor.pose);
              if (range && rule.placement) {
                const at = rule.placement[range];
                actor.scale.setScalar(at.height / EVRAE_WORLD_HEIGHT);
                actor.position.set(at.spot[0], at.spot[1], at.spot[2]);
              }
            }
            // Not installed: remember the ask, keep what the stage drew.
            shown.set(actor, rest);
            if (range) placedAt.set(actor, range);
          } finally {
            busy.delete(actor);
          }
        })();
      }
    },
  };
}
