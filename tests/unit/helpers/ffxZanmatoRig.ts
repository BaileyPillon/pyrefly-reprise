/**
 * The shared rig of the Zanmato tests (re-parity lane FFX-K, the Zanmato fix of 2026-10-15; **FFX only**): the foes' fixtures, the oracle's view of them, and one real Pay of
 * the player's Yojimbo that buys a certain Zanmato, with every draw of the game's generator tapped. Used by `parity-ffx-engine-k-zanmato.test.ts` (the hand-made cases) and
 * `parity-ffx-zanmato-vectors.test.ts` (the replay of the game's own runs).
 */

import type { BattleEvent, EnemyDef, ImmunityFlag, StatusId, StatusImmunities } from '../../../src/battle/common/types.ts';
import { PAY, Rig, SUMMON, build, yojimbo } from './ffxKRig.ts';
import type { OracleFoe } from './ffxZanmatoOracle.ts';
import { enemy, stats } from '../ffx-fixtures.test.ts';

/** 2^22 gil is a motivation of exactly 80: with no Zanmato byte on the field the first roll is Zanmato whatever the draw (the lane's note, table 4.2). */
export const PAY_FOR_ZANMATO = 4_194_304;
export const GIL = 5_000_000;
/** The status draws of an aeon user: the shared aeon stream 27, mode 2 (+32). */
export const STATUS_STREAM = 59;

/** A foe's fixture: what the engine is given, and what the oracle is told. */
export interface Spec {
  id: string;
  hp?: number;
  /** Death resistance byte (`immunities.ko`); default 255, the bosses' value. */
  res?: number;
  distance?: number;
  untargetable?: boolean;
  hidden?: boolean;
  /** Already dead when the Pay comes. */
  dead?: boolean;
  /** Statuses on the foe when the Zanmato lands. */
  has?: readonly StatusId[];
  /** A cast (consumable) Auto-Life, which is what a foe could hold. */
  autoLife?: boolean;
  /** The whole immunity set of a Dark Aeon (the dark-aeons note, status bytes and flags), on top of the Death resistance. */
  darkAeon?: boolean;
  /** Further immunity flags (the replay maps the game's monster flag word onto them). */
  flags?: readonly ImmunityFlag[];
  zanmatoLevel?: number;
}

/** The status bytes a Dark Aeon carries (`research/re-ffx-dark-aeons.md`: 255 for Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow; Doom, Eject, Scan and Auto-Life immune). */
export const DARK_STATUS_BYTES: StatusImmunities = {
  ko: 255, zombie: 255, petrify: 255, poison: 255, 'power-break': 255, 'magic-break': 255, 'armor-break': 255, 'mental-break': 255,
  confuse: 255, berserk: 255, provoke: 255, sleep: 255, silence: 255, darkness: 255, slow: 255, doom: 255, eject: 255, scan: 255, 'auto-life': 255,
};
/** And its flags: Life, Sensor, Scan, CTB, Bribe, percentage damage and Threaten (Slice has no field in this engine). */
export const DARK_FLAGS: readonly ImmunityFlag[] = ['immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe', 'immune-to-threaten', 'boss'];

export function defOf(s: Spec, order: number): EnemyDef {
  const hp = s.hp ?? 99_999;
  const flags = new Set<ImmunityFlag>([...(s.darkAeon ? DARK_FLAGS : []), ...(s.flags ?? [])]);
  return enemy({
    id: s.id,
    slot: order,
    stats: stats({ hp, maxHp: hp, str: 1, agi: 1 }),
    immunities: s.darkAeon ? { ...DARK_STATUS_BYTES, ko: s.res ?? 255 } : { ko: s.res ?? 255 },
    immunityFlags: [...flags],
    flags: {
      ...(s.distance !== undefined ? { battleDistance: s.distance } : {}),
      ...(s.untargetable ? { untargetable: true } : {}),
      ...(s.hidden ? { hidden: true } : {}),
    },
    ...(s.zanmatoLevel !== undefined ? { zanmatoLevel: s.zanmatoLevel } : {}),
  });
}

export function oracleOf(s: Spec, order: number): OracleFoe {
  return {
    id: s.id,
    order,
    group: 0, // the engine has no group numbers: every monster is group 0, as in chapters 27 and 28
    inBattle: true,
    targetable: !s.untargetable && !s.hidden,
    dead: s.dead === true,
    distance: s.distance ?? 0,
    autoLife: s.autoLife === true,
    maxHp: s.hp ?? 99_999,
  };
}

export interface Run {
  rig: Rig;
  events: BattleEvent[];
  /** Every draw from the moment the payment was submitted. */
  streams: number[];
  taps: Array<{ stream: number; value: number }>;
  oracle: OracleFoe[];
}

/** Summon Yojimbo, reach his turn, put the foes in the state the spec says, pay 2^22 gil. */
export function payForZanmato(specs: readonly Spec[], over: { seed?: number; compat?: number; amount?: number } = {}): Run {
  const rig = new Rig(
    build({ aeons: [yojimbo()], yojimbo: { compatibility: over.compat ?? 0, hireAnswer: 1 }, gil: GIL }),
    specs.map((s, i) => defOf(s, i)),
    over.seed ?? 1,
  );
  rig.until('yuna');
  rig.submit(SUMMON('yojimbo'));
  rig.until('yojimbo');
  specs.forEach((s) => {
    if (s.dead) rig.knockOut(s.id);
    for (const st of s.has ?? []) rig.inflict(s.id, st);
    if (s.autoLife) rig.fighter(s.id).statuses['auto-life'] = { id: 'auto-life', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
  });
  const from = rig.taps.length;
  const before = rig.events.length;
  rig.submit(PAY(over.amount ?? PAY_FOR_ZANMATO));
  const taps = rig.taps.slice(from);
  return { rig, events: rig.events.slice(before), streams: taps.map((t) => t.stream), taps, oracle: specs.map((s, i) => oracleOf(s, i)) };
}

export const kos = (events: readonly BattleEvent[]): string[] => events.flatMap((e) => (e.type === 'ko' ? [e.targetId] : []));
export const types = (events: readonly BattleEvent[], ...t: string[]): BattleEvent[] => events.filter((e) => t.includes(e.type));

/** The raw value of the one stream-5 draw (`undefined` when none was made). */
export const groupDraw = (run: Run): number | undefined => run.taps.find((t) => t.stream === 5)?.value;

/** The Zanmato action's own target list (the `action-start` of the Zanmato). */
export function zanmatoTargets(events: readonly BattleEvent[]): string[] {
  const e = events.find((x) => x.type === 'action-start' && x.abilityId === 'zanmato');
  return e && e.type === 'action-start' ? [...e.targets] : [];
}
