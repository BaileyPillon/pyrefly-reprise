/**
 * The hidden Gauntlet chapter (the Monster Arena's nine creations; **FFX only** [AGENTS.md rule 14]): the line the fights are played with, and the line the bench measures
 * (`tools/gauntlet-bench.mjs`, `tests/unit/helpers/gauntletBench.ts`). It returns `null` (the generic ladder) when no creature of the chapter is on the field. **Not registered yet**: the integration stage adds it
 * to `./lookup.ts` and `./index.ts` with the chapter (the tactic registry is a shared table); until then only the bench imports it.
 *
 * ## The line, and where each rule comes from
 *
 * Nothing in the fight is tuned: the creatures' numbers are the game's (`research/re-ffx-monster-arena-creations.md`), and each constant below is a lever of the line, set by what the bench measured and recorded in the
 * handoff (`docs/handoff/ch-gauntlet.md`). Tier 1 (the area three) asks:
 *
 * 1. **Cactuar King (act 1): an aeon is a shield** (`fodder`). 5/6 of its turns are a Needle that kills a 9,999-HP member (RE n 3.8) and every hit event it takes draws another; with an aeon in the front line the
 *    front line is the aeon alone (the script's targets are `FrontlineChars`), so the Needles fall on the aeon and the members live. Yuna sends the cheapest aeon in first; the aeon strikes (an Overdrive when its
 *    gauge is ready: one hit event for many blows, one counter).
 * 2. **Don Tonberry (act 2): no hit before it has arrived** (`tonberryWait`). While it walks in over four Waddles every hit but the first after each Waddle draws Karma, the attacker's kills x 100 (RE n 3.9: 50,000
 *    on this party, a certain KO); once it has arrived it counters nothing. The party waits (Defend) until the fourth Waddle is on the log, then strikes. An aeon out is the other answer (it casts Voodoo instead),
 *    and the line does not use it.
 * 3. **Jormungand (act 3)**: no rule; the plain strike (a capped Attack empties it in 6 hits, before its first turn on this party).
 * 4. **Yojimbo's Zanmato** (`zanmato`, `zanmatoAt`): Yuna calls him in at the start of the act and pays on every turn of his while the purse lasts; a Zanmato that lands kills the creature (RE n 0: Slice is not
 *    blocked). The shipped line calls him in against **none** of tier 1 (the bench: every act is won every time without him, and his route is slower than a plain strike); the bench runs the line with him against
 *    all three (`zanmato-all`) and without (preflight GA6), and the later tiers' long fights list theirs.
 * 5. **Revive the fallen, then heal under `healUnder`** (Yuna's Curaga/Cura; the bag only in an emergency). 6. **An Overdrive when the gauge is ready** (the strongest first): one hit event for many blows.
 * 7. **Quick Hit (Tidus) or the plain Attack** at the creature. The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { type Tactic, aim, hpFraction, revive, row } from './common.ts';

/** The creatures' ids (`src/data/ffx/gauntlet-ids.ts`; later tiers add theirs). */
export const GAUNTLET_BOSS_IDS: readonly CombatantId[] = ['cactuar-king', 'don-tonberry', 'jormungand'];

/** The row of Don Tonberry's walk-in and the Waddles it takes to arrive (RE n 3.9; restated here, the tactics keep out of the battle layer's graph; pinned by `tests/unit/chapters/gauntlet-chain.test.ts`). */
export const TONBERRY_WADDLE_ROW = 'gauntlet-waddle';
export const TONBERRY_WADDLES_TO_ARRIVE = 4;
/** The engine's own Pay row (`battle/ffx/aeon-commands.ts`). */
const PAY_ABILITY_ID = 'yojimbo-pay';
/** The gil Yojimbo is paid each time he acts (as the Dark Aeons chapter's line pays: `4 x (floor(log2) - 2) = 56` motivation). */
export const PAY_GIL = 100_000;
/** A party member is healed under this share of his HP. */
export const HEAL_UNDER = 0.6;
/** A member who is not Yuna uses an item only under this share of his HP, or when Yuna cannot heal. */
export const ITEM_HEAL_UNDER = 0.25;
/** The aeons sent in as fodder, the cheapest first. */
export const FODDER_ORDER: readonly string[] = ['Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Bahamut', 'Anima'];

/** The line's rules as numbers and switches, so the bench can take one away at a time and print what each is worth. The shipped line is {@link SHIPPED_LINE}. */
export interface LineOptions {
  /** Yuna calls Yojimbo in against `zanmatoAt` and pays him each turn while the purse lasts (rule 4). */
  readonly zanmato: boolean;
  /** The creatures (ids) Yojimbo is called in against. */
  readonly zanmatoAt: readonly CombatantId[];
  /** The gil one payment is. */
  readonly payGil: number;
  /** Yuna sends an aeon in first against the Cactuar King (rule 1). */
  readonly fodder: boolean;
  /** The party strikes Don Tonberry only after its fourth Waddle (rule 2). */
  readonly tonberryWait: boolean;
  /** A member is healed under this share of his HP (rule 5). */
  readonly healUnder: number;
  readonly itemHealUnder: number;
  /** A member spends an Overdrive when the gauge is ready (rule 6). */
  readonly useOverdrives: boolean;
  /** Quick Hit before the plain Attack for Tidus (rule 7). */
  readonly quickHit: boolean;
}

export const SHIPPED_LINE: LineOptions = {
  zanmato: true,
  zanmatoAt: [], // none of the area three needs him (the bench: 100 of 100 wins without, and a Zanmato route is slower than a plain strike); the long fights of the later tiers list theirs
  payGil: PAY_GIL,
  fodder: true,
  tonberryWait: true,
  healUnder: HEAL_UNDER,
  itemHealUnder: ITEM_HEAL_UNDER,
  useOverdrives: true,
  quickHit: true,
};

const living = (engine: BattleEngine, id: CombatantId): FFXCombatant | undefined => {
  const c = engine.state().combatants[id] as FFXCombatant | undefined;
  return c !== undefined && c.alive && c.hp > 0 && !c.removed ? c : undefined;
};

/** The party's gil (Yojimbo's purse; it rides in the battle's flags as `yojimbo:gil` once Yojimbo has been called, `battle/ffx/adapt/yojimbo.ts`). */
function gilOf(engine: BattleEngine): number {
  const gil = (engine.state().flags as Record<string, unknown>)['yojimbo:gil'];
  return typeof gil === 'number' ? gil : 0;
}

const pickKind = (commands: readonly AvailableCommand[], kind: Command['kind'], target?: CombatantId): AvailableCommand | undefined =>
  commands.find((c) => c.enabled && c.command.kind === kind && (target === undefined || c.validTargets.includes(target)));

/** Don Tonberry has walked in when its fourth Waddle is on the log. */
export function tonberryArrived(engine: BattleEngine): boolean {
  let waddles = 0;
  for (const e of engine.state().log) if (e.type === 'action-start' && e.actorId === 'don-tonberry' && e.abilityId === TONBERRY_WADDLE_ROW) waddles++;
  return waddles >= TONBERRY_WADDLES_TO_ARRIVE;
}

/** An aeon's turn: Yojimbo pays or goes home; any other aeon strikes with an Overdrive when it has one, else the plain blow, else goes home. */
function aeonTurn(commands: readonly AvailableCommand[], bossId: CombatantId, pays: boolean, payGil: number, purse: number): Command | null {
  const home = pickKind(commands, 'dismiss');
  const pay = commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === PAY_ABILITY_ID);
  if (pay) return pays && purse >= payGil ? ({ ...pay.command, targets: [], gilSpent: payGil } as Command) : home ? aim(home) : null;
  const od = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(bossId));
  if (od) return aim(od, bossId);
  const swing = pickKind(commands, 'attack', bossId);
  return swing ? aim(swing, bossId) : home ? aim(home) : null;
}

/** The line with `line`'s rules (the shipped one is {@link gauntlet}). */
export const lineWith = (line: LineOptions): Tactic => (actorId, commands, engine) => {
  const state = engine.state();
  const boss = GAUNTLET_BOSS_IDS.map((id) => living(engine, id)).find((c) => c !== undefined);
  if (boss === undefined) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (!me) return null;
  const aeonOut = state.aeonId !== null;
  const wantsZanmato = line.zanmato && line.zanmatoAt.includes(boss.id);

  // An aeon on the field strikes (or pays).
  if (me.side === 'aeon') return aeonTurn(commands, boss.id, wantsZanmato, line.payGil, gilOf(engine));

  // Yuna calls Yojimbo in (rule 4), or, against the King, the cheapest aeon as a shield (rule 1).
  if (me.id === 'yuna' && !aeonOut) {
    if (wantsZanmato && gilOf(engine) >= line.payGil) {
      const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Yojimbo');
      if (summon) return aim(summon);
    }
    if (line.fodder && boss.id === 'cactuar-king') {
      for (const name of FODDER_ORDER) {
        const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === name);
        if (summon) return aim(summon);
      }
    }
  }

  // The fallen first; then Yuna's heals; the others use an item only in an emergency (rule 5).
  const party = state.activeIds.map((id) => state.combatants[id]).filter((c): c is FFXCombatant => c !== undefined && c.side === 'party');
  const rescue = revive(commands, party);
  if (rescue) return rescue;
  const hurt = party.filter((c) => c.alive && hpFraction(c) < line.healUnder).sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  const yunaStands = party.some((c) => c.id === 'yuna' && c.alive);
  if (!aeonOut && me.id === 'yuna' && hurt) {
    const spell = row(commands, hpFraction(hurt) < 0.5 ? ['Curaga', 'Cura', 'Cure'] : ['Cura', 'Cure', 'Curaga'], hurt.id);
    if (spell) return aim(spell, hurt.id);
  } else if (hurt && !aeonOut && (hpFraction(hurt) < line.itemHealUnder || !yunaStands)) {
    const potion = row(commands, ['X-Potion', 'Hi-Potion', 'Potion'], hurt.id);
    if (potion) return aim(potion, hurt.id);
  }

  // Rule 2: against Don Tonberry nobody strikes until it has walked in (an aeon out is the aeons' own turn above).
  if (boss.id === 'don-tonberry' && line.tonberryWait && !tonberryArrived(engine)) {
    const defend = pickKind(commands, 'defend');
    return defend ? aim(defend) : null;
  }

  // Rule 6: an Overdrive when the gauge is ready: the strongest first.
  if (line.useOverdrives && me.id !== 'yuna') {
    for (const label of ['Slice & Dice', 'Shooting Star', 'Spiral Cut', 'Dragon Fang']) {
      const od = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.label === label && c.validTargets.includes(boss.id));
      if (od) return aim(od, boss.id);
    }
  }

  // Rule 7: Quick Hit (Tidus) or the plain Attack at the creature.
  if (line.quickHit && me.id === 'tidus') {
    const quick = row(commands, ['Quick Hit'], boss.id);
    if (quick) return aim(quick, boss.id);
  }
  const swing = pickKind(commands, 'attack', boss.id);
  return swing ? aim(swing, boss.id) : null;
};

/** The shipped line, for the registry the integration stage adds. */
export const gauntlet: Tactic = lineWith(SHIPPED_LINE);

export default gauntlet;
