/**
 * **Chapter XII — which colour each Mortiphasm shows Seymour, on the field.**
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The discs exist only in the FFX Seymour Omnis
 * fight (`research/ffx-seymour-omnis.md` §0.3). The tap is installed on the FFX HUD only
 * (`BattleScreenWiring.createHud`), and it does nothing unless the battle carries the Omnis disc
 * state (`omnis.discs` on `BattleState.flags`, set only by the Omnis formation's setup) or an
 * `affinity-change` event (emitted only by the Omnis rules).
 *
 * **What it does.** It writes the colour each disc shows him onto that disc's staged actor, as
 * `userData.omnisFacing`, so the Garden of Pain scene (`src/scenes/garden-of-pain-discs.ts`) can
 * turn the painted disc to match (O-2 B, Bailey 2026-09-25: painted discs with the facing quarter
 * lit; plan O-G8). The opening layout comes from the state at the first sync; every change after
 * that comes from the `affinity-change` event as the presenter plays it, so a disc turns when
 * the blow that turned it lands on screen, not when the engine decided it.
 *
 * The same shape as the FFX-2 Oversoul look (`./OversoulLook.ts#withOversoulLook`): the HUD
 * instance's own methods are wrapped and the same object returned. Presentation only: nothing
 * here reaches into `src/battle` beyond its types (rule 1).
 */

import type { Object3D } from 'three';
import type { AtbSnapshot, BattleEvent, BattleState, CombatantId, TurnPreview } from '../battle/common/types.ts';
import type { HudPort } from './HudPort.ts';

/** The four discs, left to right as the party faces them (`src/data/ffx/enemies/seymour-omnis.ts`). */
export const OMNIS_DISC_IDS: readonly CombatantId[] = ['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4'];

/** The `BattleState.flags` key the Omnis rules keep the discs in (`seymour-omnis-rules.ts#OMNIS_DISCS`). */
export const OMNIS_DISCS_FLAG = 'omnis.discs';

/** The `userData` key a disc's staged actor carries its colour under. */
export const OMNIS_FACING_KEY = 'omnisFacing';

/** Where the tap finds the disc actors: the painted stage (`PaintedStage.actor`). */
export interface OmnisDiscField {
  actor(id: CombatantId): Object3D | undefined;
}

/** The colour each disc shows in `state`, by disc id; empty outside Chapter XII. */
export function discFacingsOf(state: Pick<BattleState, 'flags'>): Record<CombatantId, string> {
  const raw = state.flags[OMNIS_DISCS_FLAG];
  if (typeof raw !== 'string') return {};
  const out: Record<CombatantId, string> = {};
  raw.split(',').forEach((element, i) => {
    const id = OMNIS_DISC_IDS[i];
    if (id && element) out[id] = element;
  });
  return out;
}

/** Keeps the disc actors' `userData.omnisFacing` in step with the fight. */
export class OmnisDiscFacings {
  constructor(private readonly field: () => OmnisDiscField | null) {}

  /** A freshly staged disc (the battle's start, a retry) takes the state's colour. */
  sync(state: Pick<BattleState, 'flags'>): void {
    const facings = discFacingsOf(state);
    const field = this.field();
    if (!field) return;
    for (const [id, element] of Object.entries(facings)) {
      const actor = field.actor(id);
      if (actor && actor.userData[OMNIS_FACING_KEY] === undefined) actor.userData[OMNIS_FACING_KEY] = element;
    }
  }

  /** A turned disc, or the reset after Ultima, as the presenter plays it. */
  onEvent(event: BattleEvent): void {
    if (event.type !== 'affinity-change' || !event.facings) return;
    const field = this.field();
    if (!field) return;
    for (const [id, element] of Object.entries(event.facings)) {
      const actor = field.actor(id);
      if (actor) actor.userData[OMNIS_FACING_KEY] = element;
    }
  }
}

/** Tap a HUD's sync and event stream for the disc colours (see the module note). */
export function withOmnisDiscs<T extends HudPort>(hud: T, field: () => OmnisDiscField | null): T {
  const facings = new OmnisDiscFacings(field);
  const sync = hud.sync.bind(hud);
  const onEvent = hud.onEvent.bind(hud);
  hud.sync = (state: BattleState, preview: TurnPreview[] | AtbSnapshot): void => {
    sync(state, preview);
    facings.sync(state);
  };
  hud.onEvent = (event: BattleEvent): Promise<void> | void => {
    const out = onEvent(event);
    facings.onEvent(event);
    return out;
  };
  return hud;
}
