/**
 * R13-03 (release 13 focused review): in Chapter VIII at 2000x1012 Rikku stood
 * about 30 px left of where the previous live build had her, partly under the
 * FFX command stack (0.87 -> 0.64 of her box clear).
 *
 * The shared relax step moves a party member and a fiend apart by halves, and
 * Evrae is put back on its range spot by the deck's director, so every call
 * that still measured the overlap took another half-step out of Rikku alone.
 * The deck's slot table now carries the spots live e3b8c2a3's relax settled
 * the party on, and the deck holds them there (`holdParty`, the switch
 * Chapters 1-3 use), so a party/Evrae overlap moves neither.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Chapter VIII's deck; the switch
 * itself is shared plumbing and inert elsewhere.
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { DepthRect } from '../../../src/engine/ScreenRects.ts';
import { relaxField, type RelaxActor, type RelaxField } from '../../../src/engine/StageRelax.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS as SLOTS } from '../../../src/scenes/evrae-airship-deck.ts';
import type { SceneSlots } from '../../../src/scenes/index.ts';

function camera(): PerspectiveCamera {
  const c = new PerspectiveCamera(32, 16 / 9, 0.1, 100);
  c.position.set(0, 2, 10);
  c.lookAt(0, 1, 0);
  c.updateMatrixWorld(true);
  return c;
}

/** Rikku in front of Evrae, their boxes crossing by 60 px (100 px a world unit). */
function deck(slots: SceneSlots): { f: RelaxField; rikku: Vector3; evrae: Vector3 } {
  const [rx, ry, rz] = SLOTS.party[2]!;
  const rikku = new Vector3(rx, ry, rz);
  const evrae = new Vector3(rx + 1.85, 0, -6);
  const actors = new Map<string, RelaxActor & { w: number; depth: number }>([
    ['rikku', { kind: 'party', actor: { position: rikku }, w: 166, depth: 9 }],
    ['evrae', { kind: 'enemy', actor: { position: evrae }, w: 700, depth: 16 }],
  ]);
  const f: RelaxField = {
    actors,
    rects: () => {
      const out = new Map<string, DepthRect>();
      for (const [id, a] of actors) {
        out.set(id, { x: 800 + a.actor.position.x * 100 - a.w / 2, y: 300, w: a.w, h: 300, depth: a.depth });
      }
      return out;
    },
    panels: [],
    camera: camera(),
    canvasW: 1600,
    slots,
  };
  return { f, rikku, evrae };
}

/** The battle screen calls the relax until it settles; the director re-plants Evrae between calls. */
function settle(slots: SceneSlots): number {
  const { f, rikku, evrae } = deck(slots);
  for (let call = 0; call < 12; call++) {
    const done = relaxField(f, 14);
    evrae.set(SLOTS.party[2]![0] + 1.85, 0, -6);
    if (done) break;
  }
  return rikku.x;
}

describe('R13-03: the Fahrenheit deck holds its party (FFX only, Chapter VIII)', () => {
  it('publishes holdParty, with the active spots where live settled them', () => {
    expect(SLOTS.holdParty).toBe(true);
    expect(SLOTS.enemySpots).toBeUndefined();
    // R13-04 option B (Bailey, 2026-09-25): the arc re-laid right of the FFX command stack, back row at the rail.
    // Tidus 0.15 right of the sheet's 0.1: at FAR (2000x1012) he covered 0.07 of Wakka at 0.1.
    expect(SLOTS.party).toEqual([
      [0.25, 0, 0.9],
      [-0.95, 0, -2.5],
      [2.2, 0, -2.3],
    ]);
  });

  it('keeps Rikku on her slot while Evrae is re-planted, where the shared step walked her left', () => {
    const slot = SLOTS.party[2]![0];
    expect(settle({ ...SLOTS, holdParty: false })).toBeLessThan(slot - 0.2);
    expect(settle(SLOTS)).toBe(slot);
  });
});
