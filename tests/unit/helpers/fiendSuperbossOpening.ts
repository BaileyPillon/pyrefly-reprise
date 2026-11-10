/**
 * Two small measurements the Fiend Arena Superbosses bench needs to explain its own numbers (the chapter's whole difficulty is its first seconds): the OPENING (when the first foe blow lands, when a girl's first
 * action completes) and the MIRACLE DRINK LOOP's arithmetic (how long a Drink takes from Rikku's menu to the status, how long Invincible lasts, how often Rikku gets a menu). **FFX-2 only.** Both step the engine one
 * millisecond at a time so that the event log can be dated (the log itself carries no clock); the numbers are seconds of battle time at the engine's 29.97 logic steps a second. A measurement, never game data.
 */

import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { LINES, openEngine, type Spec } from './fiendSuperbossBench.ts';
import { GIRLS, forcedAct, openAct, type Act } from './fiendSuperbossDrive.ts';

type Ev = { type: string; actorId?: string; targetId?: string; sourceId?: string; status?: string };
const isGirl = (id: string | undefined): boolean => id !== undefined && (GIRLS as readonly string[]).includes(id);
const now = (engine: FFX2Engine): number => engine.state().ticks / STEPS_PER_SECOND;

export interface Opening {
  /** Seconds to the first girl's menu, to the first foe blow (a hit or a miss), and to the first girl action that COMPLETES; `null` when it never came. */
  firstMenu: number | null;
  firstBlow: number | null;
  firstGirlActionEnd: number | null;
  /** Girls still standing when the foe's first move has ended. */
  standingAfterFirstMove: number | null;
  /** Seconds to the end of the battle. */
  ends: number;
}

/** The opening of one fight of a cell on one seed (the cell's line plays; the foes' own scripts run). */
export function openingOf(spec: Spec, seed: number): Opening {
  const engine = openEngine(spec, seed);
  const turn = LINES[spec.line](spec.act);
  const out: Opening = { firstMenu: null, firstBlow: null, firstGirlActionEnd: null, standingAfterFirstMove: null, ends: 0 };
  let seen = 0;
  let foe: string | null = null;
  const flush = (): void => {
    const log = engine.state().log as unknown as readonly Ev[];
    for (; seen < log.length; seen++) {
      const e = log[seen]!;
      if (out.firstBlow === null && (e.type === 'damage' || e.type === 'miss') && !isGirl(e.sourceId)) out.firstBlow = now(engine);
      if (out.firstGirlActionEnd === null && e.type === 'action-end' && isGirl(e.actorId)) out.firstGirlActionEnd = now(engine);
      if (e.type === 'action-start' && foe === null && !isGirl(e.actorId)) foe = e.actorId ?? null;
      if (out.standingAfterFirstMove === null && e.type === 'action-end' && foe !== null && e.actorId === foe) {
        out.standingAfterFirstMove = GIRLS.filter((g) => engine.state().combatants[g]!.alive).length;
      }
    }
  };
  for (let i = 0; i < 20_000; i++) {
    const d = engine.nextDecision();
    flush();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') {
      engine.tick(1);
      flush();
      continue;
    }
    if (d.kind !== 'player-input') continue;
    out.firstMenu ??= now(engine);
    engine.submit(turn(d, engine) ?? { kind: 'defend', targets: [] });
  }
  out.ends = now(engine);
  return out;
}

export interface LoopTiming {
  /** Seconds from Rikku's menu (the Mix is chosen) to Invincible on her. */
  landing: number;
  /** Seconds Invincible lasts on her. */
  lasts: number;
  /** Seconds between two of Rikku's menus while she Mixes at every one. */
  cadence: number;
}

const MIX = { kind: 'ability', id: 'x2-alchemist-mix', targets: [], extra: { kind: 'rikku-mix', mix: { ingredients: ['x2-dark-matter', 'x2-potion'], resultAbilityId: null } } };

/** Rikku Mixes a Miracle Drink at every menu of hers with the foes' scripts held back and the other girls defending: the loop's own clock, no fight in it. */
export function miracleLoopTiming(act: Act, seed: number, build: FFX2PartyBuild): LoopTiming {
  const engine = openAct(act, seed, { group: forcedAct(act).group, build });
  const menus: number[] = [];
  let landed: number | null = null;
  let gone: number | null = null;
  let seen = 0;
  const flush = (): void => {
    const log = engine.state().log as unknown as readonly Ev[];
    for (; seen < log.length; seen++) {
      const e = log[seen]!;
      if (e.type === 'status-add' && e.status === 'invincible' && e.targetId === 'rikku' && landed === null) landed = now(engine);
      if (e.type === 'status-remove' && e.status === 'invincible' && e.targetId === 'rikku' && landed !== null && gone === null) gone = now(engine);
    }
  };
  for (let i = 0; i < 30_000 && menus.length < 4; i++) {
    const d = engine.nextDecision();
    flush();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') {
      engine.tick(1);
      flush();
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (d.actorId === 'rikku') {
      menus.push(now(engine));
      engine.submit(MIX as never);
    } else engine.submit({ kind: 'defend', targets: [] });
  }
  if (landed === null || gone === null || menus.length < 3) throw new Error('the loop did not run long enough to be timed');
  return { landing: landed - menus[0]!, lasts: gone - landed, cadence: (menus[2]! - menus[0]!) / 2 };
}
