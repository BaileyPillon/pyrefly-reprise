/**
 * **Which clip is which pose** (the hidden Wendigo chapter's 3D stage; FFX only). The party's clips are the real FFX battle kit retargeted onto the Meshy rigs (`../../data/ffx/lake-models.ts`), named as the game's own motion
 * banks name them in lower case (`idle1`, `weak1_00`, `dmg1`, `attack1_00`, `magic2_00`, `item_00`, `win_00`, `dead_00` ...); the Wendigo and the two Guado Guardians carry the game's own `m212` and `m213` motion joined into whole
 * performances (`idle`, `attack`, `combo`, `cast`, `item`, `hurt`, `ko`, `arms_up`, `stance_block1`, `sleep_in` ...), and the four aeons their own `s001` to `s004` clips (`idle`, `attack`, `cast`, `hurt`, `ko`). This file keeps the mapping and nothing else: names in, plans out, no `three`.
 *
 * - **The party** takes the plan table of `../yrp3d/clipMap.ts` (the same {@link Pose}s and {@link Plan}s the sequencer there runs: an idle that loops, a kneel for low HP, a hit, a fall with a hold and a rise, an
 *   attack whose parts are the game's run-in, strike and return, a cast and an item as a start, a hold and a finish, a victory), built from the kit's names below. A pose whose clips the file lacks is left out (`usable`);
 *   Lulu has three `attack1` parts and no `skill`, Rikku no fourth, and the table follows the names.
 * - **The monsters** play one-shots chosen by what the action is (`monsterRowFor`): the Wendigo's Punch and plain Attack are `attack`, its Double Punch `combo`, its arms `arms_up` into `stance_block1` (held) and out through
 *   `stance_block2`; a Guardian's blow is `attack` (its bank has none: a forced Attack plays the `cast`, as the game's forced Thundara does) and every spell is `cast`, every potion and eye drop `item`. Each clip has the moment it lands (`strike`) read once from the clip's own motion (`./monsterRig.ts`).
 *
 * Game case: FFX only (the kit is FFX's; the party members' clips are the same ids the Evrae chapter's table names).
 */

import { planFromPlay, usable, type Plan, type PlanTable, type Pose } from '../yrp3d/clipMap.ts';

/** The party's plans from the clip names a file has (the kit above). */
export function partyPlans(names: readonly string[]): PlanTable {
  const has = (n: string): boolean => names.includes(n);
  const out: { -readonly [K in Pose]?: Plan } = {};
  const add = (pose: Pose, play: string, clips: readonly string[]): void => {
    if (!clips.every(has)) return;
    const plan = planFromPlay(play, clips);
    if (plan) out[pose] = plan;
  };
  add('idle', 'loop', ['idle1']);
  add('idle2', 'once', ['idle2']);
  add('critical', 'enter,loop,exit', ['weak1_00', 'weak1_01', 'weak1_02']);
  add('hurt', 'once', ['dmg1']);
  add('ko', 'fall,hold,rise', ['dead_00', 'dead_01', 'dead_02']);
  if (has('attack1_03')) add('attack', 'parts', ['attack1_00', 'attack1_01', 'attack1_02', 'attack1_03']);
  else add('attack', 'start,hold,finish', ['attack1_00', 'attack1_01', 'attack1_02']);
  add('cast', 'start,hold,finish', ['magic2_00', 'magic2_01', 'magic2_02']);
  add('item', 'start,hold,finish', ['item_00', 'item_01', 'item_02_1']);
  add('victory', 'pose,hold', ['win_00', 'win_01']);
  return usable(out, names);
}

/** One monster action: the clip, whether it is a blow (it lands at its strike) or a cast (the effect lands at its strike), and how fast it may be played to put the strike on the beat. */
export interface MonsterRow {
  readonly clip: string;
  readonly kind: 'blow' | 'cast';
  /** The clip to play when the file has none by that name (a Guardian's potion plays its cast when the file has no `item`; a Guardian's forced Attack plays its cast, its bank having no attack motion). */
  readonly alt?: string;
}

/** The ability ids of the Wendigo's rows (`../../data/ffx/wendigo-ids.ts` `WENDIGO_ABILITY`; a test pins that the copies agree). */
export const WENDIGO_ROWS = {
  attack: 'attack',
  punch: 'wendigo-punch',
  haymaker: 'wendigo-haymaker',
  counterPunch: 'wendigo-counter-punch',
  raiseArms: 'wendigo-raise-arms',
  lowerArms: 'wendigo-lower-arms',
} as const;

/** The Guardians' two item moves (their caster animation is the game's item motion, byte 2 of the command row: Auto-Potion 0x4010 and the Eye Drops item 0x200C; their other moves are spells, byte 3). */
const GUARDIAN_ITEM_MOVES: readonly string[] = ['lake-auto-potion', 'lake-eye-drops'];

/** What a Wendigo or Guardian action plays: by the ability when one is named, else by the painted pose the presenter picked (`attack`, `cast`, `item`). Null for an action with no clip (a defend, an Overdrive). */
export function monsterRowFor(id: string, abilityId: string | undefined, kind: string | undefined): MonsterRow | null {
  if (id === 'wendigo') {
    if (abilityId === WENDIGO_ROWS.haymaker) return { clip: 'combo', kind: 'blow' };
    if (abilityId === WENDIGO_ROWS.punch || abilityId === WENDIGO_ROWS.counterPunch || abilityId === WENDIGO_ROWS.attack) return { clip: 'attack', kind: 'blow' };
    if (abilityId === WENDIGO_ROWS.raiseArms || abilityId === WENDIGO_ROWS.lowerArms) return null; // the stance has its own state (`./monsterRig.ts`)
  }
  if (abilityId !== undefined && GUARDIAN_ITEM_MOVES.includes(abilityId) && id.startsWith('lake-guardian')) return { clip: 'item', kind: 'cast', alt: 'cast' };
  // A Guardian's bank has no attack motion (all four attack slots point at its idle), and a Provoked Guardian's forced action in the game is its Thundara (the forced-action word 0x3047, `docs/handoff/ch-wendigo.md` section 4, gaps):
  // the cast stands in for it (a blow that lands at the cast's own mark), rather than a model that stands in its idle while the actor lunges.
  if (kind === 'attack') return id.startsWith('lake-guardian') ? { clip: 'attack', kind: 'blow', alt: 'cast' } : { clip: 'attack', kind: 'blow' };
  if (kind === 'item') return { clip: 'item', kind: 'cast', alt: 'cast' };
  if (kind === 'cast') return { clip: 'cast', kind: 'cast' };
  return abilityId === undefined ? null : { clip: 'cast', kind: 'cast' };
}

/** True when the ability raises the Wendigo's arms or lowers them (`true` raises). */
export function stanceChange(id: string, abilityId: string | undefined): boolean | null {
  if (id !== 'wendigo') return null;
  if (abilityId === WENDIGO_ROWS.raiseArms) return true;
  if (abilityId === WENDIGO_ROWS.lowerArms) return false;
  return null;
}

/** The clips a monster needs to stand and move at all: its idle. */
export const MONSTER_IDLE = 'idle';
