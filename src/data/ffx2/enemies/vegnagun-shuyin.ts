/**
 * Chapter 5 enemy groups — the four-part Vegnagun chain, then Shuyin.
 *
 * Source: `research/ffx2-vegnagun-shuyin.md`.
 *
 * Battle order [§2]: Tail -> Leg + Nodes -> Body/Core + Bulwarks ->
 * Head + Redoubts -> Shuyin, linked by {@link EnemyGroupDef.nextGroupId} with
 * no menu between. Vegnagun battles open with a **black-hole suck-in**, not the
 * normal shattering-glass wipe — that is `BattleStartStep.transition`.
 *
 * > **Implementation rule [§3]: the stat blocks here are SinirothX's values and
 * > are correct as written. Do NOT "fix" them against the Final Fantasy Wiki**,
 * > whose Mag/Def columns are transposed on the Leg, Body/Core, Bulwarks and
 * > Head. The regression test to protect is Memento Mori: ~1 000–1 130
 * > party-wide is correct; ~1 440–1 630 means the wiki's Mag 98 is wired in.
 *
 * TODO(data-agent): transcribe the full records.
 *   - §3.1–3.5 per-battle stat blocks, elements, immunities, abilities.
 *   - §4 the two "charging" mechanics, including the Head battle's **real-time
 *     fail timer**: if the cannon charge completes, Spira is destroyed and the
 *     player loses. Model the timer with `AbilityDef.extra` + a
 *     `MidBattleTrigger` on `charge-started`.
 *   - §5 AI scripts. The Farplane-voice system (Braska, Auron, Jecht and
 *     Shuyin speaking mid-fight) fires from the AI as **no-action flavour
 *     turns** that consume an ATB slot and display a subtitle — give them
 *     `formula: 'none'`, `category: 'enemy'` abilities.
 *   - §3.2 the Leg's three Nodes cycle colour: **Red = offensive magic,
 *     Yellow = buffs/status, Green = recovery magic**, and change colour when
 *     hit with offensive magic or gun attacks.
 *   - §3.3 the Body's two Bulwarks regenerate unless destroyed together; every
 *     offensive move they own is `fractional`, so their Level/Str/Mag are dead
 *     stats for damage.
 *   - §3.5 Shuyin is biased toward targeting Yuna [ffx-combat-core §0 V19].
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';

/** TODO(data-agent): §3.2 — the three colour-cycling Nodes. Lv 52, Def 244. */
function todoNode(id: string, slot: number): EnemyDef {
  return {
    id,
    name: 'Node',
    spriteKey: 'vegnagun-node',
    slot,
    stats: {
      hp: 1,
      mp: 0,
      str: 1,
      def: 244,
      mag: 16,
      mdef: 1,
      agi: 1,
      luck: 1,
      eva: 0,
      acc: 0,
      maxHp: 1,
      maxMp: 0,
    }, // TODO(data-agent): §3.2 — HP/MP/Agi still needed.
    hp: 1,
    mp: 0,
    level: 52,
    affinities: {}, // TODO(data-agent): §3.2
    immunities: {}, // TODO(data-agent): §3.2
    immunityFlags: [],
    forms: [{ name: 'Node', spriteKey: 'vegnagun-node', hp: 1 }],
    aiScriptId: 'vegnagun-node', // TODO(data-agent): §5
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] },
    abilityIds: [], // TODO(data-agent): §3.2
    flags: { isPart: true, partOf: 'vegnagun-leg' },
  };
}

/** TODO(data-agent): §3.3 — the two regenerating casting arms. Lv 39, Mag 48 / Def 58. */
function todoBulwark(id: string, name: string, slot: number): EnemyDef {
  return {
    id,
    name,
    spriteKey: 'vegnagun-bulwark',
    slot,
    stats: {
      hp: 3000,
      mp: 0,
      str: 1,
      def: 58,
      mag: 48,
      mdef: 1,
      agi: 1,
      luck: 1,
      eva: 0,
      acc: 0,
      maxHp: 3000,
      maxMp: 0,
    }, // TODO(data-agent): §3.3
    hp: 3000,
    mp: 0,
    level: 39,
    affinities: {}, // TODO(data-agent): §3.3
    immunities: {}, // TODO(data-agent): §3.3
    immunityFlags: [],
    forms: [{ name, spriteKey: 'vegnagun-bulwark', hp: 3000 }],
    aiScriptId: 'vegnagun-bulwark', // TODO(data-agent): §5
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] },
    abilityIds: [], // TODO(data-agent): every move is `fractional`.
    flags: { isPart: true, partOf: 'vegnagun-body' },
  };
}

/** TODO(data-agent): §3.4 — the two turret pods. Lv 40; Redoubt L has Def 0. */
function todoRedoubt(id: string, name: string, slot: number, def: number): EnemyDef {
  return {
    id,
    name,
    spriteKey: 'vegnagun-redoubt',
    slot,
    stats: {
      hp: 2000,
      mp: 0,
      str: 1,
      def,
      mag: 41,
      mdef: 1,
      agi: 1,
      luck: 1,
      eva: 0,
      acc: 0,
      maxHp: 2000,
      maxMp: 0,
    }, // TODO(data-agent): §3.4
    hp: 2000,
    mp: 0,
    level: 40,
    affinities: {}, // TODO(data-agent): §3.4
    immunities: {}, // TODO(data-agent): §3.4
    immunityFlags: [],
    forms: [{ name, spriteKey: 'vegnagun-redoubt', hp: 2000 }],
    aiScriptId: 'vegnagun-redoubt', // TODO(data-agent): §5
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] },
    abilityIds: [], // TODO(data-agent): §3.4
    flags: { isPart: true, partOf: 'vegnagun-head' },
  };
}

/** Battle 1 — the Tail. Lv 41, HP 34 200. Gravity immune; Armor/Mental Break DO work. */
export const vegnagunTailGroup: EnemyGroupDef = {
  id: 'vegnagun-tail',
  game: 'ffx2',
  canEscape: false,
  nextGroupId: 'vegnagun-leg',
  enemies: [
    {
      id: 'vegnagun-tail',
      name: 'Vegnagun',
      spriteKey: 'vegnagun-tail',
      slot: 0,
      // §3.1 — verified.
      stats: {
        hp: 34200,
        mp: 9999,
        str: 77,
        def: 82,
        mag: 72,
        mdef: 76,
        agi: 115,
        luck: 3,
        eva: 0,
        acc: 0,
        maxHp: 34200,
        maxMp: 9999,
      },
      hp: 34200,
      mp: 9999,
      level: 41,
      affinities: { gravity: 'immune' },
      immunities: {}, // TODO(data-agent): §3.1 — a long list; Def/MDef Up-Down are NOT immune.
      immunityFlags: ['boss'],
      forms: [{ name: 'Vegnagun', spriteKey: 'vegnagun-tail', hp: 34200 }],
      aiScriptId: 'vegnagun-tail', // TODO(data-agent): §5
      rewards: {
        ap: 5,
        apOverkill: 5,
        gil: 3000,
        overkillThreshold: 0,
        exp: 5000,
        drops: [{ itemId: 'megalixir', count: 1 }],
      },
      abilityIds: [], // TODO(data-agent): §3.1
      flags: { isBoss: true },
      sensorText: 'Kill the arms before you look it in the face.',
      scanText:
        'Ancient machina. Its bulwarks regenerate unless destroyed together. Its magic strikes everything at once.',
      thinkingPeriod: 0,
    },
  ],
  musicCues: [{ at: 'start', track: 'boss-dread', fadeMs: 600 }], // TODO(data-agent): "Crash"
};

/** Battle 2 — the Leg plus three Nodes. */
export const vegnagunLegGroup: EnemyGroupDef = {
  id: 'vegnagun-leg',
  game: 'ffx2',
  canEscape: false,
  nextGroupId: 'vegnagun-body',
  enemies: [
    {
      id: 'vegnagun-leg',
      name: 'Vegnagun',
      spriteKey: 'vegnagun-leg',
      slot: 0,
      // §3.2 — SinirothX: Mag 18 / Def 13 (the wiki transposes these).
      stats: {
        hp: 1,
        mp: 0,
        str: 1,
        def: 13,
        mag: 18,
        mdef: 1,
        agi: 1,
        luck: 1,
        eva: 0,
        acc: 0,
        maxHp: 1,
        maxMp: 0,
      }, // TODO(data-agent): §3.2 — HP/MP/Str/MDef/Agi/Luck still needed.
      hp: 1,
      mp: 0,
      level: 38,
      affinities: {}, // TODO(data-agent): §3.2
      immunities: {}, // TODO(data-agent): §3.2
      immunityFlags: ['boss'],
      forms: [{ name: 'Vegnagun', spriteKey: 'vegnagun-leg', hp: 1 }],
      aiScriptId: 'vegnagun-leg', // TODO(data-agent): §5
      rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] },
      abilityIds: [], // TODO(data-agent): §3.2
      flags: { isBoss: true },
    },
  ],
  parts: [todoNode('node-a', 1), todoNode('node-b', 2), todoNode('node-c', 3)],
  musicCues: [{ at: 'start', track: 'boss-dread', fadeMs: 600 }], // TODO(data-agent): "Crash"
};

/** Battle 3 — the Body/Core plus two Bulwarks. The point of no return. */
export const vegnagunBodyGroup: EnemyGroupDef = {
  id: 'vegnagun-body',
  game: 'ffx2',
  canEscape: false,
  nextGroupId: 'vegnagun-head',
  enemies: [
    {
      id: 'vegnagun-body',
      name: 'Vegnagun',
      spriteKey: 'vegnagun-body',
      slot: 0,
      // §3.3 — SinirothX: **Mag 42 / Def 98**. The wiki has these swapped and
      // the difference is large; see the Memento Mori regression note above.
      stats: {
        hp: 1,
        mp: 0,
        str: 1,
        def: 98,
        mag: 42,
        mdef: 1,
        agi: 1,
        luck: 1,
        eva: 0,
        acc: 0,
        maxHp: 1,
        maxMp: 0,
      }, // TODO(data-agent): §3.3
      hp: 1,
      mp: 0,
      level: 43,
      affinities: {}, // TODO(data-agent): §3.3
      immunities: {}, // TODO(data-agent): §3.3
      immunityFlags: ['boss'],
      forms: [{ name: 'Vegnagun', spriteKey: 'vegnagun-body', hp: 1 }],
      aiScriptId: 'vegnagun-body', // TODO(data-agent): §5
      rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] },
      abilityIds: [], // TODO(data-agent): §3.3
      flags: { isBoss: true },
    },
  ],
  parts: [todoBulwark('bulwark-r', 'Bulwark', 1), todoBulwark('bulwark-l', 'Bulwark', 2)],
  musicCues: [{ at: 'start', track: 'boss-dread', fadeMs: 600 }], // TODO(data-agent): "Clash"
};

/** Battle 4 — the Head plus two Redoubts. Carries the real-time fail timer. */
export const vegnagunHeadGroup: EnemyGroupDef = {
  id: 'vegnagun-head',
  game: 'ffx2',
  canEscape: false,
  nextGroupId: 'shuyin',
  enemies: [
    {
      id: 'vegnagun-head',
      name: 'Vegnagun',
      spriteKey: 'vegnagun-head',
      slot: 0,
      // §3.4 — SinirothX: Mag 52 / Def 71 (the wiki transposes these).
      stats: {
        hp: 1,
        mp: 0,
        str: 1,
        def: 71,
        mag: 52,
        mdef: 1,
        agi: 1,
        luck: 1,
        eva: 0,
        acc: 0,
        maxHp: 1,
        maxMp: 0,
      }, // TODO(data-agent): §3.4
      hp: 1,
      mp: 0,
      level: 57,
      affinities: {}, // TODO(data-agent): §3.4
      immunities: {}, // TODO(data-agent): §3.4
      immunityFlags: ['boss'],
      forms: [{ name: 'Vegnagun', spriteKey: 'vegnagun-head', hp: 1 }],
      aiScriptId: 'vegnagun-head', // TODO(data-agent): §4, §5 — includes the fail timer.
      rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] },
      abilityIds: [], // TODO(data-agent): §3.4
      flags: { isBoss: true },
    },
  ],
  parts: [todoRedoubt('redoubt-r', 'Redoubt', 1, 133), todoRedoubt('redoubt-l', 'Redoubt', 2, 0)],
  musicCues: [{ at: 'start', track: 'boss-dread', fadeMs: 600 }], // TODO(data-agent): "Ruin"
};

/** Battle 5 — Shuyin. Biased toward targeting Yuna. */
export const shuyinGroup: EnemyGroupDef = {
  id: 'shuyin',
  game: 'ffx2',
  canEscape: false,
  enemies: [
    {
      id: 'shuyin',
      name: 'Shuyin',
      spriteKey: 'shuyin',
      slot: 0,
      // §3.5 — Str 47 / Def 132 / Mag 42 / MDef 92, triangulated three ways.
      stats: {
        hp: 1,
        mp: 0,
        str: 47,
        def: 132,
        mag: 42,
        mdef: 92,
        agi: 1,
        luck: 1,
        eva: 0,
        acc: 0,
        maxHp: 1,
        maxMp: 0,
      }, // TODO(data-agent): §3.5 — HP/MP/Agi/Luck/Eva still needed.
      hp: 1,
      mp: 0,
      level: 55, // TODO(data-agent): §3.5
      affinities: {}, // TODO(data-agent): §3.5
      immunities: {}, // TODO(data-agent): §3.5
      immunityFlags: ['boss'],
      forms: [{ name: 'Shuyin', spriteKey: 'shuyin', hp: 1 }],
      aiScriptId: 'shuyin', // TODO(data-agent): §5
      rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] },
      abilityIds: [], // TODO(data-agent): §3.5
      flags: { isBoss: true },
      sensorText: 'Fights like someone you loved. He is not.',
      scanText:
        'A thousand-year shadow. His techniques mirror a stranger’s, learned by grief rather than practice. Nine strikes come at once and armour means nothing to them.',
    },
  ],
  musicCues: [{ at: 'start', track: 'boss-dread', fadeMs: 600 }], // TODO(data-agent): "Their Resting Place"
};

export default vegnagunTailGroup;
