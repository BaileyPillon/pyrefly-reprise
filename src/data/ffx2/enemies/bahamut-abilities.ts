/**
 * Bahamut's ability set [ffx2-bahamut.md §2]. Numbers only — the FFX-2 engine
 * owns the AI rotation logic (`aiScriptId: 'ffx2-bahamut'`); this file exists
 * so it has the exact researched script and every constant in one place.
 *
 * **The fixed 12-action loop, verbatim** [§2.1, verified: 2 sources —
 * decompile-derived AI transcription, corroborated by the prose battle
 * description]. No RNG branches, no HP thresholds — purely turn-counted:
 *
 * ```
 * Turn 1      Curse on a random target
 * Turn 2      Normal Attack on a random target
 * Turn 3      Normal Attack on a random target
 * Turn 4      Normal Attack on a random target
 * Turn 5      Impulse
 * Turn 6      Impulse
 * Turns 7-11  Countdown: displays 5, 4, 3, 2, 1 — no damage, no status, no effect at all
 * Turn 12     Mega Flare
 * Turn 13     Repeat from turn 1
 * ```
 *
 * Turns 7-11 are the party's designated free-damage window — this is the
 * reason the fight is winnable at Lv 20 [§2.1]. The loop never resets on
 * damage; if the party survives Mega Flare it wraps back to Curse.
 *
 * Every enemy action carries its own `accuracy` byte — **enemy Accuracy
 * stats are never read** [`types.ts` `AbilityDef.accuracy` doc comment].
 * Bahamut's stat block has Accuracy 0 [§1.1], so `x2-bahamut-attack` carries
 * `accuracy: 0` explicitly rather than relying on the stat.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const bahamutAbilities: AbilityDef[] = [
  {
    id: 'x2-bahamut-curse',
    name: 'Curse',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    // Curse in X-2 = cannot spherechange; not the FFX Curse. Wears off on its own; blocked by Gris-Gris Bag,
    // Ribbon, Shmooth Shailing or Curseproof [§2.3]. No duration value published; modelled as battle-long.
    statusEffects: [{ status: 'curse', chance: 254, duration: 255 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    messageTemplate: 'Bahamut uses Curse',
  },
  {
    id: 'x2-bahamut-attack',
    name: 'Attack',
    game: 'ffx2',
    category: 'attack',
    mpCost: 0,
    power: 16, // [estimate] — series-standard "plain Attack" constant; see §2.3 derivation
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    accuracy: 0, // §1.1 [verified: 2 sources] — his stat-block Accuracy; must be repeated here per the doc-comment rule above
    messageTemplate: 'Bahamut attacks {target}',
  },
  {
    id: 'x2-bahamut-impulse',
    name: 'Impulse',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 6, // 6/16 = 37.5% of current HP [§2.3]
    formula: 'percent-current',
    damageType: 'magical', // Shell-reducible, and Magic Break scales it via step 4 [§2.3]
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    messageTemplate: 'Bahamut uses Impulse',
  },
  {
    id: 'x2-bahamut-countdown',
    name: 'Countdown',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    // Five uses in a row, turns 7-11, counting 5-4-3-2-1. No damage, no status, no effect — a scripted flavour
    // turn the engine emits as a `charge` event; see the ability's own doc comment above for the full loop.
    messageTemplate: 'Bahamut counts down',
    extra: { countdownFrom: 5 },
  },
  {
    id: 'x2-bahamut-mega-flare',
    name: 'Mega Flare',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 14, // the game's own row (0x409c), Bailey 2026-10-09 "Use 14 from the files"; replaced the authored 24 (§2.3, [estimate, reasoned])
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['always-break-damage-limit'],
    canMiss: false,
    messageTemplate: 'Bahamut casts Mega Flare',
    // (§2.3's structural uncertainty, whether party-wide enemy magic is halved by multi-target, is answered by the game's own
    // damage chain now: the kernels never halve it, and nothing reads this key. Kept as it was.)
    extra: { enemyMultiTargetMagicIsHalved: false },
  },
];

export default bahamutAbilities;
