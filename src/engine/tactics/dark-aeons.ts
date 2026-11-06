/**
 * The hidden Dark Aeons chapter (Dark Valefor, Dark Ifrit, Dark Ixion twice, Dark Shiva, Dark Anima and Dark Bahamut; **FFX only** [AGENTS.md rule 14]): the line the fights are played with. Registered under the FFX game in
 * `./lookup.ts`, so an FFX-2 board never reaches it; it returns `null` (the generic ladder) when no Dark Aeon is on the field.
 *
 * ## The line, and where each rule comes from
 *
 * It is the **intended** line of `tests/unit/chapters/dark-aeons-bench.test.ts` and `tools/dark-aeons-bench.mjs`, which measure it on the real engine (the six scripts are `battle/ffx/ai/dark-aeons-six.ts`, the party is the
 * `[estimate]` preset `data/ffx/builds/dark-aeons.ts`). Nothing in the fight is tuned: the enemy numbers are the game's (`research/re-ffx-dark-aeons-six.md`), and each constant below is a lever of the line, set by what the bench
 * measured and recorded in the handoff. In the order the rules are asked:
 *
 * 1. **An aeon on the field is a shield, not an attacker** (`aeonTurn`). Every Overdrive of the six KOs a person (9,999 HP) and all but Thor's Hammer KO every aeon of the preset (RE six 5.3); the game's own answer, and every
 *    guide's, is an aeon sent in as fodder. While the foe's gauge is near full the aeon stays and answers its turn (an Overdrive or a special when it has one, else a blow: its hits fill the gauge sooner, which is what fodder
 *    wants); once the Overdrive has gone off (the gauge is back near 0) it goes home at once.
 * 2. **Yuna sends an aeon in when the Overdrive is next** (`shieldAt`, per link). The gauge counts **hit events** (one per action that reaches the aeon, however many blows it has: RE six 3), so a party round of three actions adds
 *    three hits' worth before the foe's turn; the shield goes in when the gauge is within `SHIELD_MARGIN_HITS` hits and one foe turn of full. The fodder is the cheapest aeon first, Anima and Bahamut (whose Overdrives hit for 99,999)
 *    last.
 * 3. **Revive the fallen, then heal under `HEAL_UNDER`** (Yuna's Curaga; the bag only in an emergency). 4. **Auto-Life on whoever lacks it** (Yuna): every Overdrive but Aerospark and Dark Shiva's Attack leaves it standing.
 * 5. **An Overdrive when the gauge is ready** (the strongest first; Grand Summon is held): one hit event for many blows, the sourced answer to Dark Ifrit's counter and to Dark Bahamut's Impulse count.
 * 6. **Quick Hit or the plain Attack** at the foe. No spells on Dark Anima (the party has none to cast: Lulu is on the bench).
 *
 * The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { type Tactic, aim, has, hpFraction, revive, row } from './common.ts';

/** The six Dark Aeons' ids (`src/data/ffx/dark-aeons-six-ids.ts`); Dark Ixion's two fights are two ids (`dark-ixion`, `dark-ixion-2`) and one painting. */
export const DARK_AEONS_BOSS_IDS: readonly CombatantId[] = ['dark-valefor', 'dark-ifrit', 'dark-ixion', 'dark-ixion-2', 'dark-shiva', 'dark-bahamut', 'dark-anima'];

/** Gauge gained per own turn and per allowed hit event, per script id (`battle/ffx/ai/dark-aeons-six-rules.ts#SIX_GAINS`, restated: the tactics stay out of the battle layer's graph; `tests/unit/chapters/dark-aeons-six-review.test.ts` pins it equal). */
export const DARK_AEONS_GAINS: Readonly<Record<string, { perTurn: number; perHit: number }>> = {
  'dark6-valefor': { perTurn: 5, perHit: 15 },
  'dark6-ifrit': { perTurn: 10, perHit: 5 },
  'dark6-ixion-1': { perTurn: 5, perHit: 10 },
  'dark6-ixion-2': { perTurn: 10, perHit: 10 },
  'dark6-shiva': { perTurn: 10, perHit: 10 },
  'dark6-bahamut': { perTurn: 10, perHit: 10 },
  'dark6-anima': { perTurn: 10, perHit: 5 },
};

/** The gil Yojimbo is paid each time he acts: the game's motivation from it is `4 x (floor(log2) - 2)`, so this is `4 x 14 = 56` (`battle/ffx/kernel/yojimbo.ts#gilMotivation`); the Mirror Aeons chapter's line pays the same. */
export const PAY_GIL = 100_000;
/** The engine's own Pay row (`battle/ffx/aeon-commands.ts`). */
const PAY_ABILITY_ID = 'yojimbo-pay';

/** A party member is healed under this share of his HP (rule 3). */
export const HEAL_UNDER = 0.6;
/** A member who is not Yuna uses an item only under this share of his HP, or when Yuna cannot heal (rule 3). */
export const ITEM_HEAL_UNDER = 0.25;
/** The shield goes in when the foe's gauge is within this many hit events (and one foe turn's step) of full (rule 2). */
export const SHIELD_MARGIN_HITS = 3;
/** The aeons sent in as fodder, the cheapest first: the story aeons' own Overdrives are capped at 9,999, Bahamut's and Anima's are worth 99,999 as attackers, so they go last (rule 2). */
export const FODDER_ORDER: readonly string[] = ['Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Yojimbo', 'Bahamut', 'Anima'];

/** The line's rules as numbers and switches, so the bench can take one away at a time and print what each is worth. The shipped line is {@link SHIPPED_LINE}; nothing in the game reads anything else. */
export interface LineOptions {
  /** Hit events of margin before the Overdrive at which the shield goes in (rule 2). */
  readonly shieldMarginHits: number;
  /** Yojimbo is called in at the start of the link and paid on every turn of his (rule 2b): a landed Zanmato kills every legal foe of the group it picked, whatever its Death resistance (RE's afda2d451; the Mirror Aeons chapter's note). */
  readonly zanmato: boolean;
  /** The foes (script ids) Yojimbo is called in against: the purse is one for the whole chain (1,500,000 gil is fifteen payments), so the line keeps it for the two long fights (rule 2b). */
  readonly zanmatoAt: readonly string[];
  /** The gil one payment is (rule 2b); more buys better odds per Pay and empties the purse sooner. */
  readonly payGil: number;
  /** A member is healed under this share of his HP (rule 3). */
  readonly healUnder: number;
  readonly itemHealUnder: number;
  /** Yuna puts Auto-Life on whoever lacks it (rule 4). */
  readonly lifeUpkeep: boolean;
  /** Yuna sends the shield in at all (rule 2); off is the "no aeon fodder" line. */
  readonly useFodder: boolean;
  /** A member spends an Overdrive when the gauge is ready (rule 5). */
  readonly useOverdrives: boolean;
  /** Quick Hit before the plain Attack for Tidus (rule 6). */
  readonly quickHit: boolean;
  /** Yuna dispels the Breaks off a member who wears Armor Break (Dark Bahamut's Impulse puts them on; a broken member takes 99,999 from the next one) (rule 3b). */
  readonly dispelBreaks: boolean;
  /** Auto-Life is put up before any heal that is not urgent (rule 4 above rule 3's soft heal). */
  readonly lifeFirst: boolean;
  /** A member under this share of his HP is healed before Auto-Life is put up (rule 3). */
  readonly urgentHeal: number;
}

export const SHIPPED_LINE: LineOptions = {
  shieldMarginHits: SHIELD_MARGIN_HITS,
  zanmato: true,
  zanmatoAt: ['dark6-anima', 'dark6-bahamut'],
  payGil: PAY_GIL,
  healUnder: HEAL_UNDER,
  itemHealUnder: ITEM_HEAL_UNDER,
  lifeUpkeep: true,
  useFodder: true,
  useOverdrives: true,
  quickHit: true,
  dispelBreaks: true,
  lifeFirst: true,
  urgentHeal: 0.35,
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

/** The gauge at which the foe's Overdrive is next in the line's reading (rule 2): `100 - perTurn - margin x perHit`. */
export function shieldGauge(scriptId: string, marginHits: number): number {
  const g = DARK_AEONS_GAINS[scriptId] ?? { perTurn: 10, perHit: 10 };
  return 100 - g.perTurn - marginHits * g.perHit;
}

/** An aeon's turn (rule 1): the shield answers its own turn while the danger stands and leaves once it has passed. */
function aeonTurn(commands: readonly AvailableCommand[], afraid: boolean, bossId: CombatantId, pays: boolean, payGil: number, purse: number): Command | null {
  const home = pickKind(commands, 'dismiss');
  // Yojimbo: his menu is Pay and Dismiss. Paid on every turn while the gil lasts (rule 2b), else sent home.
  const pay = commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === PAY_ABILITY_ID);
  if (pay) return pays && purse >= payGil ? ({ ...pay.command, targets: [], gilSpent: payGil } as Command) : home ? aim(home) : null;
  if (!afraid && home) return aim(home);
  const od = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(bossId));
  if (od) return aim(od, bossId);
  const swing = pickKind(commands, 'attack', bossId);
  return swing ? aim(swing, bossId) : home ? aim(home) : null;
}

/** The line with `line`'s rules (the shipped one is {@link darkAeons}). */
export const lineWith = (line: LineOptions): Tactic => (actorId, commands, engine) => {
  const state = engine.state();
  const boss = DARK_AEONS_BOSS_IDS.map((id) => living(engine, id)).find((c) => c !== undefined);
  if (boss === undefined) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (!me) return null;
  const script = boss.enemy?.aiScriptId ?? '';
  const gauge = boss.overdrive?.gauge ?? 0;
  const afraid = gauge >= shieldGauge(script, line.shieldMarginHits);
  const aeonOut = state.aeonId !== null;

  // 1. An aeon on the field is a shield.
  if (me.side === 'aeon') return aeonTurn(commands, afraid, boss.id, line.zanmato, line.payGil, gilOf(engine));

  // 2b. Yuna calls Yojimbo in and pays him on every turn of his while the purse lasts (the Zanmato is the sourced answer to the two long fights).
  if (line.zanmato && line.zanmatoAt.includes(script) && me.id === 'yuna' && !aeonOut) {
    const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Yojimbo');
    if (summon && gilOf(engine) >= line.payGil) return aim(summon);
  }

  // 2. Yuna sends an aeon in when the Overdrive is next.
  if (line.useFodder && me.id === 'yuna' && !aeonOut && afraid) {
    for (const name of FODDER_ORDER) {
      const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === name);
      if (summon) return aim(summon);
    }
  }

  // 3. The fallen first; then Yuna's order: the urgent heal, the Breaks off a broken member, Auto-Life on whoever lacks it, the soft heal; the others use an item only in an emergency.
  const party = state.activeIds.map((id) => state.combatants[id]).filter((c): c is FFXCombatant => c !== undefined && c.side === 'party');
  const rescue = revive(commands, party);
  if (rescue) return rescue;
  const hurt = party.filter((c) => c.alive && hpFraction(c) < line.healUnder).sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  const yunaStands = party.some((c) => c.id === 'yuna' && c.alive);
  const healYuna = (target: FFXCombatant): Command | null => {
    const spell = row(commands, hpFraction(target) < 0.5 ? ['Curaga', 'Cura', 'Cure'] : ['Cura', 'Cure', 'Curaga'], target.id);
    return spell ? aim(spell, target.id) : null;
  };
  if (!aeonOut && me.id === 'yuna') {
    if (hurt && hpFraction(hurt) < line.urgentHeal) {
      const heal = healYuna(hurt);
      if (heal) return heal;
    }
    if (line.dispelBreaks) {
      const broken = party.find((c) => c.alive && has(c, 'armor-break'));
      const dispel = broken ? row(commands, ['Dispel'], broken.id) : undefined;
      if (broken && dispel) return aim(dispel, broken.id);
    }
    if (line.lifeFirst && line.lifeUpkeep) {
      const bare = party.find((c) => c.alive && !has(c, 'auto-life'));
      const life = bare ? row(commands, ['Auto-Life'], bare.id) : undefined;
      if (bare && life) return aim(life, bare.id);
    }
    if (hurt) {
      const heal = healYuna(hurt);
      if (heal) return heal;
    }
    if (!line.lifeFirst && line.lifeUpkeep) {
      const bare = party.find((c) => c.alive && !has(c, 'auto-life'));
      const life = bare ? row(commands, ['Auto-Life'], bare.id) : undefined;
      if (bare && life) return aim(life, bare.id);
    }
  } else if (hurt && !aeonOut && (hpFraction(hurt) < line.itemHealUnder || !yunaStands)) {
    const potion = row(commands, ['X-Potion', 'Hi-Potion', 'Potion'], hurt.id);
    if (potion) return aim(potion, hurt.id);
  }

  // 5. An Overdrive when the gauge is ready: the strongest first (Tidus's Slice & Dice, Auron's Shooting Star); Yuna's Grand Summon is held.
  if (line.useOverdrives && me.id !== 'yuna') {
    for (const label of ['Slice & Dice', 'Shooting Star', 'Spiral Cut', 'Dragon Fang']) {
      const od = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.label === label && c.validTargets.includes(boss.id));
      if (od) return aim(od, boss.id);
    }
  }

  // 6. Quick Hit (Tidus) or the plain Attack at the foe.
  if (line.quickHit && me.id === 'tidus') {
    const quick = row(commands, ['Quick Hit'], boss.id);
    if (quick) return aim(quick, boss.id);
  }
  const swing = pickKind(commands, 'attack', boss.id);
  return swing ? aim(swing, boss.id) : null;
};

/** The shipped line, registered for the chapter (`./index.ts`). */
export const darkAeons: Tactic = lineWith(SHIPPED_LINE);

export default darkAeons;
