/**
 * FFX status definitions — incapacitating statuses, control statuses, and
 * defensive/support statuses that are not part of the 0-5 stacking family or
 * the battle-long mix/tonic flags (those live in `stacks-and-flags.ts`).
 *
 * There is no `StatusDef`-shaped catalog type in `src/battle/common/types.ts`
 * — that contract only ships the closed `FFXStatusId` union (with its own
 * doc-comment summary table), the per-application `StatusApplication` shape,
 * and the runtime `StatusInstance`. This file adds the descriptive catalog
 * the task asks for ("duration semantics, tick effects, what cures them") as
 * a project-local, additive type. It is not a contract change: nothing in
 * `types.ts` is edited, and nothing outside `src/data/ffx/statuses/**`
 * depends on this shape existing.
 *
 * Every row cites `research/ffx-combat-core.md` (mostly §4.2, plus §4.3 for
 * Regen and §4.4 for Threaten) and the `FFXStatusId` doc comment in
 * `types.ts`, which is itself sourced from the same research. Confidence
 * tags are copied verbatim from the research.
 */

import type { FFXStatusId } from '../../../battle/common/types.ts';

/** How a status's duration/removal is modelled. */
export type StatusDurationModel =
  /** Ticks down by 1 at the end of the victim's own action. Only five statuses do this: sleep, silence, darkness, slow, regen. */
  | 'turns'
  /** Stack byte 254: lasts until cured or until the end of the battle, whichever comes first. */
  | 'battle-254'
  /** Stack byte 255: permanent, undispellable (Auto-Haste's Haste, Ribbon-granted immunities are separate — this is for statuses themselves shipped permanent). */
  | 'permanent-255'
  /** Consumes a charge on use (the four Nul statuses). */
  | 'charges'
  /** A live countdown carried on the combatant, decremented on the victim's own turn (Doom). */
  | 'counter'
  /** Computed live from current state every frame, not a stored duration (Critical/SOS). */
  | 'dynamic'
  /** Lasts until the effect is consumed once (Auto-Life). */
  | 'until-consumed'
  /** Lasts only until the carrier's next turn (Guard, Sentinel, Defend, Shield, Boost). */
  | 'until-next-turn'
  /** No duration at all — a terminal/instantaneous state (KO, Eject). */
  | 'instant'
  /** Special-cased infliction/decay model that does not use the shared chance/resistance path (Threaten only, §4.4). */
  | 'special-model';

export interface FFXStatusDef {
  id: FFXStatusId;
  name: string;
  durationModel: StatusDurationModel;
  /** Typical/default duration in the victim's own turns, when the model is 'turns' or 'battle-254'/'permanent-255' (254/255 respectively). Omitted when the duration is entirely ability-specific (e.g. Sleep's 1/3/5/8/10-turn variants depending on which ability applied it). */
  defaultTurns?: number;
  /** Plain-English description of what happens each tick, or on application, or on the triggering event. */
  tickEffect: string;
  /** Items/spells/effects that cure it, by display name (not a strict AbilityId/ItemId reference — this is documentation, cross-referenced loosely with the abilities/items catalogs). */
  curedBy: string[];
  /** Explicit call-outs for things that do NOT cure it, when the research flags a common misconception. */
  notCuredBy?: string[];
  /** Whether a KO on the carrier clears the status. */
  clearedByKo: boolean;
  /** Whether the status is wiped by Petrification (most are; the six stacking buffs are the documented exception). */
  clearedByPetrify?: boolean;
  /** Whether the status persists after the battle ends (none of FFX's statuses do, per §4.2 — HP is restored between chapters instead). */
  survivesBattle: boolean;
  /** Research citation with confidence tag, copied verbatim. */
  citation: string;
}

export const STATUSES_CORE: Record<string, FFXStatusDef> = {
  ko: {
    id: 'ko',
    name: 'KO',
    durationModel: 'instant',
    tickEffect: 'HP = 0, cannot act. If the whole active party is KO\'d/petrified/ejected at once, it is Game Over.',
    curedBy: ['Life', 'Full-Life', 'Phoenix Down', 'Mega Phoenix', 'Auto-Life', 'Super Elixir', 'Final Elixir', 'Final Phoenix'],
    clearedByKo: false,
    survivesBattle: false,
    // ffx-combat-core §4.2 [verified: 2 sources]
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  zombie: {
    id: 'zombie',
    name: 'Zombie',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect:
      'All HP-restoring effects damage instead. Life/Full-Life/Phoenix Down/Mega Phoenix instantly kill a living Zombie. Drain/Osmose/Lancet reverse sign. Greatly raises resistance to ordinary instant death (but not chance-255 Death, nor Doom).',
    curedBy: ['Holy Water', 'Remedy', 'Panacea', 'Ultra Cure', 'Super Elixir', 'Final Elixir'],
    notCuredBy: ['Esuna — Esuna explicitly does NOT cure Zombie; this is the classic Moonpetal-audit correction'],
    clearedByKo: true,
    clearedByPetrify: false,
    survivesBattle: false,
    // ffx-combat-core §4.2 [verified: 2 sources] — confirmed by both the decompiled item/command records and the official HD manual.
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  petrify: {
    id: 'petrify',
    name: 'Petrify',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect:
      'Cannot act. All OTHER statuses are wiped on application (the six stacking buffs are the documented exception — they survive). CTB counter is NOT reset. A physical hit afterwards can shatter it (chance = the attacking action\'s own shatterChance, 0-100) into Eject. Enemies and any underwater unit shatter immediately.',
    curedBy: ['Soft', 'Remedy', 'Esuna', 'Panacea'],
    clearedByKo: false,
    clearedByPetrify: false,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  poison: {
    id: 'poison',
    name: 'Poison',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect:
      'At the end of the victim\'s own turn, loses maxHP // 4 (25%) for characters; enemies use a per-monster percentage (EnemyFields.poisonTickPercent). Applies even while asleep or otherwise skipping a turn.',
    curedBy: ['Antidote', 'Esuna', 'Remedy', 'Panacea'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  silence: {
    id: 'silence',
    name: 'Silence',
    durationModel: 'turns',
    tickEffect:
      'Blocks White Magic, Black Magic and Summon. Does NOT block Overdrives (Fury, Grand Summon, or any other character Overdrive) or Doublecast\'s wrapper. Ticks down by 1 at the end of the victim\'s own action.',
    curedBy: ['Echo Screen', 'Esuna', 'Remedy'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    // Duration is ability-specific: Silence Attack = 3 turns, Silence Buster = 1 turn (chance 254). See the applying ability's own statusEffects for the exact duration.
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  sleep: {
    id: 'sleep',
    name: 'Sleep',
    durationModel: 'turns',
    tickEffect:
      'Cannot act. Attacks against a sleeper always hit (bypasses the normal hit-chance table). Physical damage wakes the sleeper; magic damage does not. Poison and Doom still tick while asleep.',
    curedBy: ['Esuna', 'Remedy', 'any physical hit (wakes, does not "cure" in the item sense)'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    // Duration is ability-specific: Sleep Attack=3, Sleep Buster=1, Sleeping Powder=5, Dream Powder=8, Bad Breath=10.
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  darkness: {
    id: 'darkness',
    name: 'Darkness',
    durationModel: 'turns',
    tickEffect:
      'Overrides Accuracy/Evasion for physical attacks: hit chance becomes base/10 (~10%) before Luck is applied. A Darkness-blinded attacker whose Luck exceeds the target\'s by 90 or more fully cancels the penalty.',
    curedBy: ['Eye Drops', 'Esuna', 'Remedy'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    // Duration is ability-specific: Dark Attack=3, Dark Buster=1, Smoke Bomb=8, Bad Breath=10.
    citation: 'ffx-combat-core §4.2, §2.11 [verified: 2 sources]',
  },

  slow: {
    id: 'slow',
    name: 'Slow',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect:
      'Recovery x2. On APPLICATION also adds 100% of the target\'s current CTB counter (a one-time push, separate from the ongoing recovery penalty). Mutually exclusive with Haste — applying one while the other is present at stack 255 is skipped entirely.',
    curedBy: ['Haste', 'Esuna', 'Remedy', 'Dispel'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  haste: {
    id: 'haste',
    name: 'Haste',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect:
      'Recovery floor(/2). On APPLICATION halves the target\'s current CTB counter. 255 (permanent, from Auto-Haste) also grants immunity to Slow. Mutually exclusive with Slow.',
    curedBy: ['Dispel', 'Slow', 'Aerospark (aeon-inflicted removal)', 'Purifying Salt'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  berserk: {
    id: 'berserk',
    name: 'Berserk',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect: 'Auto-attacks only (no command menu). All damage DEALT by the carrier is x1.5.',
    curedBy: ['Esuna', 'Remedy', 'Panacea', 'Provoke (clears it on an enemy as a side effect)', 'Threaten (clears it on an enemy as a side effect)'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  confuse: {
    id: 'confuse',
    name: 'Confuse',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect:
      'Acts automatically against a random target, ally or enemy. Physical damage cures it. Cancels Provoke on application. Not player-inflictable except by a reflected Confuse.',
    curedBy: ['Esuna', 'Remedy', 'Panacea', 'any physical hit'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  doom: {
    id: 'doom',
    name: 'Doom',
    durationModel: 'counter',
    tickEffect:
      'A countdown shown over the carrier\'s head; decrements on the CARRIER\'s own turn (even while asleep or otherwise skipping). At 0, instant KO. Nothing removes the countdown once applied — only Ribbon prevents application in the first place. Party members always get a 5-turn countdown; enemies vary (EnemyFields.doomTurns, up to 255).',
    curedBy: [],
    notCuredBy: ['Everything — Doom has no cure once applied. Esuna, Remedy, Dispel, Holy Water all fail against it.'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  curse: {
    id: 'curse',
    name: 'Curse',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect:
      'Cannot use Overdrive and the Overdrive gauge cannot fill. One of the few statuses aeons are NOT innately immune to — this is the load-bearing mechanic behind why a partially-filled aeon gauge is effectively dead once Curse lands (see aeons/index.ts §6.1/§6.5 notes).',
    curedBy: ['Dispel', 'Holy Water', 'Panacea', 'Ultra Cure', 'Super Elixir', 'Final Elixir'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  provoke: {
    id: 'provoke',
    name: 'Provoke',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect:
      'Forces the afflicted ENEMY to target the provoker. Clears Berserk and Confuse on that enemy as an application side effect. Cancelled by later Confusion or Threaten on the same enemy.',
    curedBy: ['Dispel is NOT listed for Provoke in the §4.2 table — it appears to have no player-facing cure beyond being overwritten by Confuse/Threaten [estimate — the table lists no "Cured by" entry for Provoke]'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  threaten: {
    id: 'threaten',
    name: 'Threaten',
    durationModel: 'special-model',
    defaultTurns: 1,
    tickEffect:
      'Target cannot act or counterattack (can still evade). Lasts until the USER\'s next turn, and the target\'s own next turn is then rescheduled to immediately after the user\'s. Clears Berserk, Provoke, Haste, Slow, Confuse on application; blocks Haste/Slow/Delay on BOTH the user and target while active. Infliction does not use the shared chance/resistance path at all — see §4.4\'s own per-enemy, per-battle threatenChance model (starts at the enemy\'s initial value, e.g. 100% default, 25% for Yunalesca; only a SUCCESS decays it by x0.7 floored, minimum 1%; failure changes nothing).',
    curedBy: [],
    notCuredBy: ['Party members and aeons are innately immune (resistance 255) — Threaten is enemy-only in practice.'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2, §4.4 [verified: 2 sources]',
  },

  guard: {
    id: 'guard',
    name: 'Guard',
    durationModel: 'until-next-turn',
    tickEffect: 'The carrier intercepts ALL single-target physical attacks aimed at the other two active party members.',
    curedBy: [],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    durationModel: 'until-next-turn',
    tickEffect: 'Guard\'s interception PLUS Defend\'s physical-damage halving, combined on one status.',
    curedBy: [],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  defend: {
    id: 'defend',
    name: 'Defend',
    durationModel: 'until-next-turn',
    tickEffect: 'Halves physical damage taken. Stacks multiplicatively with Protect (both can be active at once).',
    curedBy: [],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  protect: {
    id: 'protect',
    name: 'Protect',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect: 'Physical damage received is floor-divided by 2.',
    curedBy: ['Dispel', 'Purifying Salt', 'Aerospark'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  shell: {
    id: 'shell',
    name: 'Shell',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect: 'Magical damage AND magical healing received are both floor-divided by 2.',
    curedBy: ['Dispel', 'Purifying Salt', 'Aerospark'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  reflect: {
    id: 'reflect',
    name: 'Reflect',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect:
      'Bounces one incoming targeted Black/White Magic spell back at the caster\'s side. Does NOT bounce party-wide spells (Demi, Ultima), Dispel, Auto-Life, items, Overdrives, or Mixes.',
    curedBy: ['Dispel', 'Purifying Salt', 'Aerospark'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  regen: {
    id: 'regen',
    name: 'Regen',
    durationModel: 'turns',
    defaultTurns: 10,
    tickEffect:
      'At the START of ANY unit\'s turn (not only the carrier\'s), the carrier gains floor(elapsedTicks * maxHP / 256) + 100 HP. The +100 is an unconditional addend, not a clamp or minimum-only floor — it is paid at every boundary regardless of the tick term, which is why Regen is disproportionately strong on fast, low-HP actors. A carrier that is also Zombie takes this as DAMAGE instead (sign flips). The cast turn itself does not tick — the first payout lands at the very next turn boundary after casting.',
    curedBy: ['Dispel', 'Aerospark', 'Purifying Salt', 'Condemn (enemy removal effect)', 'Desperado (enemy removal effect)', "Dark Bahamut's Mega Flare (enemy removal effect)", "Dark Anima's Oblivion (enemy removal effect)"],
    notCuredBy: ['Auto-Regen cannot be removed by anything, including Dispel.'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    // Duration is ability-specific: Regen spell/Healing Spring = 10 turns, Super/Hyper Mighty G = 20 turns, Auto-Regen/SOS Regen = infinite (permanent-255).
    citation: 'ffx-combat-core §4.2, §4.3 [verified: 2 sources]',
  },

  scan: {
    id: 'scan',
    name: 'Scan',
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect: 'Reveals HP/affinities/immunities in the Scan panel. No combat effect. Not cleared by KO (persists on a revived combatant).',
    curedBy: [],
    clearedByKo: false,
    clearedByPetrify: false,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  eject: {
    id: 'eject',
    name: 'Eject',
    durationModel: 'instant',
    tickEffect: 'Removed from battle entirely, counts as defeated. A bench member cannot fill the vacated slot. Aeons are normally immune, EXCEPT Seymour\'s Banish, which overrides that immunity outright.',
    curedBy: [],
    clearedByKo: false,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2, §6.1 [verified: 2 sources]',
  },
};

export default STATUSES_CORE;
