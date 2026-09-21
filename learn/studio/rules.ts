/**
 * Pyrefly Studio (site B): the rule inventory behind the "How it works" tab
 * and the inventory tiles, ported from the mockup round's
 * `docs/concepts/atlas/b-battle-studio/inventory.mjs` (137 rules, verified
 * against the target frames in that folder) as typed data.
 *
 * Every entry is a named row, formula or list item in `research/*.md`, with
 * its own section cite (AGENTS.md hard rule 6: nothing unsourced). Text is
 * copied or tightly paraphrased from the research doc, or from the matching
 * jsdoc block in `src/battle/common/types.ts` where that block is itself a
 * direct paraphrase of the same research with its own citation (the
 * `FFXStatusId`, `OverdriveModeId` and `FormulaKey` doc comments).
 *
 * FFX only (chapters 1 to 3, `AGENTS.md` hard rule 14): component 8 is the
 * chapter-1 boss's own script (`research/ffx-seymour-flux.md`), and the FFX-2
 * ATB engine has no CTB queue, no rank table and none of these statuses under
 * the FFX rules — nothing here applies there. Component and count layout
 * matches `inventory.mjs`'s `COMPONENTS` exactly, matching the target frames
 * in docs/concepts/atlas/b-battle-studio/ (awaiting Bailey's verdict) —
 * `b1-assembled.png`, `b3-inventory.png`.
 */

/** The eight systems a turn is taken apart into, in display order. */
export type StudioComponentId =
  | 'turn'
  | 'command'
  | 'hit'
  | 'damage'
  | 'element'
  | 'status'
  | 'overdrive'
  | 'boss';

/** Relative size tier a rule was authored at: a mechanism with a formula (L), a named rule (M), or a single value (S). */
export type StudioRuleSize = 'L' | 'M' | 'S';

/** One of the eight systems the panel lists, with its own piece count computed by the caller. */
export interface StudioComponent {
  readonly id: StudioComponentId;
  readonly name: string;
  readonly plain: string;
  readonly cite: string;
}

/** One rule, formula or named value from the research docs. */
export interface StudioRule {
  readonly id: string;
  readonly component: StudioComponentId;
  readonly size: StudioRuleSize;
  readonly name: string;
  /** One plain-words line: copied or tightly paraphrased from the cited source. */
  readonly line: string;
  readonly cite: string;
}

const CC = 'ffx-combat-core';
const SF = 'ffx-seymour-flux';
const cc = (section: string): string => `${CC} ${section}`;
const sf = (section: string): string => `${SF} ${section}`;

/** The eight systems, matching `inventory.mjs`'s `COMPONENTS` (names, plain lines and counts verified in the mockup). */
export const STUDIO_COMPONENTS: readonly StudioComponent[] = [
  { id: 'turn', name: 'Turn order', plain: 'Who goes next, and why', cite: cc('§1') },
  { id: 'command', name: 'Command', plain: 'What you pick, what it costs', cite: cc('§1.3, §1.7, §1.8') },
  { id: 'hit', name: 'Hit roll', plain: 'Does it land? Is it critical?', cite: cc('§2.11, §2.12') },
  { id: 'damage', name: 'Damage', plain: 'How the number is worked out', cite: cc('§2.1 to §2.4') },
  { id: 'element', name: 'Element and affinity', plain: 'Weak, resist, immune, absorb', cite: cc('§3') },
  { id: 'status', name: 'Status', plain: 'Zombie, Poison, Haste and more', cite: cc('§4, §2.10') },
  { id: 'overdrive', name: 'Overdrive gauge', plain: 'What fills the big attack', cite: cc('§5.1, §5.2') },
  { id: 'boss', name: "The boss's next move", plain: 'His script, read ahead', cite: sf('§3, §4') },
] as const;

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[×'’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function rule(component: StudioComponentId, size: StudioRuleSize, name: string, line: string, cite: string): StudioRule {
  return { id: `${component}-${slug(name)}`, component, size, name, line, cite };
}

const L = (c: StudioComponentId, name: string, line: string, cite: string): StudioRule => rule(c, 'L', name, line, cite);
const M = (c: StudioComponentId, name: string, line: string, cite: string): StudioRule => rule(c, 'M', name, line, cite);
const S = (c: StudioComponentId, name: string, line: string, cite: string): StudioRule => rule(c, 'S', name, line, cite);

// ---- 01 Turn order (8) -----------------------------------------------------
const TURN: readonly StudioRule[] = [
  L('turn', 'The core clock', 'The actor with the lowest CTB counter acts next.', cc('§1.1')),
  L('turn', 'Agility to base ticks', 'Agility 30 gives 8 base ticks (recovery = base ticks × rank).', cc('§1.2')),
  L('turn', 'Turn-list forecast', 'The upcoming-turns list assumes every other actor takes a rank-3 action.', cc('§1.6')),
  S('turn', 'Preemptive', '12.5% base chance (25.4% with Initiative); the party opens the fight, CTB 0.', cc('§1.9')),
  S('turn', 'Normal', '74.6% chance; the common case — nobody gets a head start.', cc('§1.9')),
  S('turn', 'Ambush', '12.5% base chance (0% with Initiative); the enemies open the fight, CTB 0.', cc('§1.9')),
  S('turn', 'Weak delay', "Adds floor(target's base ticks × 3/2) to the target's CTB counter.", cc('§1.5')),
  S('turn', 'Strong delay', "Adds the target's base ticks × 3 to the target's CTB counter.", cc('§1.5')),
];

// ---- 02 Command (13) --------------------------------------------------------
const RANKS: readonly [string, string][] = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return [`Rank ${n}`, `Recovery costs the actor's base ticks × ${n}.`];
});
const COMMAND: readonly StudioRule[] = [
  ...RANKS.map(([name, line]) => S('command', name, line, cc('§1.3'))),
  M('command', 'Switch', 'Swaps in a reserve member, who takes this very turn instead of losing it.', cc('§1.7')),
  M('command', 'Escape', 'One character tries to flee alone; succeeds about 74.6% of the time.', cc('§1.8')),
  M('command', 'Flee', "Tidus's skill: the whole party flees, and it always succeeds.", cc('§1.8')),
];

// ---- 03 Hit roll (6) --------------------------------------------------------
const HIT: readonly StudioRule[] = [
  L('hit', 'Hit chance', 'Reads 40% of the attacker’s Accuracy minus the target’s Evasion.', cc('§2.11')),
  L('hit', 'Critical chance', "Reads the attacker's Luck minus the target's Luck, plus the weapon's bonus.", cc('§2.12')),
  S('hit', 'Aim', '+10 to hit chance per stack, up to 5 stacks.', cc('§2.9')),
  S('hit', 'Reflex', "-10 to the attacker's hit chance per stack, up to 5 stacks.", cc('§2.9')),
  S('hit', 'Luck', '+1 hit chance and +10 crit chance per stack.', cc('§2.9')),
  S('hit', 'Jinx', "+1 to attackers' hit chance and +10 crit chance against this target, per stack.", cc('§2.9')),
];

// ---- 04 Damage (34) ----------------------------------------------------------
const DAMAGE_L: readonly StudioRule[] = [
  L('damage', 'Shared skeleton', 'power × mitigation ÷ 730, then the variance roll.', cc('§2.1')),
  L('damage', 'Mitigation', 'From Defense/Magic Defense: Defense 0 gives 730, Defense 255 gives 21.', cc('§2.3')),
  L('damage', 'Strength', 'POWER = STR³ ÷ 32 + 30 (STR includes Cheer stacks).', cc('§2.2')),
  L('damage', 'Piercing Strength', 'Same as Strength, but the target’s Defense counts as 0.', cc('§2.2')),
  L('damage', 'Magic', 'POWER = (MAG² ÷ 6 + power) × power ÷ 4 (MAG includes Focus stacks).', cc('§2.2')),
  L('damage', 'Piercing Magic', 'Same as Magic, but the target’s Magic Defense counts as 0.', cc('§2.2')),
  L('damage', 'Special Magic', 'POWER = MAG³ ÷ 32 + 30; Magic Defense is always 0.', cc('§2.2')),
  L('damage', 'Healing', 'POWER = (MAG + power) ÷ 2 × power; target Focus stacks reduce healing received.', cc('§2.2')),
];
const DAMAGE_M_FORMULAS: readonly [string, string][] = [
  ['Fixed', 'DmgCon × 50 × (rng + 240) ÷ 256.'],
  ['Fixed (no variance)', 'DmgCon × 50, flat. Most healing items.'],
  ['Percentage Total', "targetMaxHP × DmgCon ÷ 16 (or max MP for the MP pool)."],
  ['Percentage Current', 'targetCurrentHP × DmgCon ÷ 16. Demi, Nega Burst, Black Hole.'],
  ['HP formula', "userMaxHP × DmgCon ÷ 10. Kimahri's Self-Destruct: DmgCon 30 → 3× his max HP."],
  ['CTB formula', 'targetCTB × DmgCon ÷ 16, applied to the CTB pool. Haste (base 8, heals) or Slow (base 16).'],
  ['Gil formula', 'gilSpent ÷ 10. Spare Change.'],
  ['Deal 9999', '9999 × DmgCon, a flat non-scaling hit. Sunburst: DmgCon 2 → 19,998.'],
];
const DAMAGE_STEPS: readonly [string, string][] = [
  ['Immunity', 'A target immune to this damage class takes 0.'],
  ['Critical ×2', 'A critical hit doubles the damage.'],
  ['Boost ×1.5', "The target's aeon Boost stance multiplies incoming damage by 1.5."],
  ['Shield ÷4', "The target's aeon Shield stance divides incoming damage by 4."],
  ['Affinity', 'The elemental affinity multiplier is applied (see Element and affinity).'],
  ['Physical only', 'Target Protect ÷2; user Berserk ×1.5; user Power Break ÷2; target Defend ÷2.'],
  ['Magical only', 'User Magic Booster ×1.5; target Shell ÷2; user Magic Break ÷2.'],
  ['Alchemy ×2', "Alchemy doubles a healing item's effect."],
  ['Offense +%', 'Strength+% (physical) or Magic+% (magical) auto-abilities add their percentage.'],
  ['Defense +%', 'Defense+% (physical) or Magic Def+% (magical) auto-abilities subtract their percentage.'],
  ['Armored ÷3', 'An Armored target divides physical damage by 3, unless the user has Piercing, the action ignores Armored, or the target has Armor Break.'],
  ['Drain sign', 'Zombie on the user or the target flips the sign; both Zombie cancels back to normal.'],
  ['OD timing', "The Overdrive's timed-input bonus adds up to 50% more."],
  ['Damage limit', 'Clamped to 9,999 normally, 99,999 with a damage-limit break, or forced to 9,999 for an action that never breaks the limit.'],
  ['Heal sign', 'A healing action against a non-Zombie target flips the sign to negative (healing).'],
  ['Damage 9999', 'Trio of 9999 / Quartet of 9 clamps any value in range to exactly 9,999 or -9,999.'],
];
const DAMAGE: readonly StudioRule[] = [
  ...DAMAGE_L,
  ...DAMAGE_M_FORMULAS.map(([name, line]) => M('damage', name, line, cc('§2.2'))),
  ...DAMAGE_STEPS.map(([name, line], i) => M('damage', `Step ${i} · ${name}`, line, cc('§2.4'))),
  S('damage', 'Cheer', '+1 Strength per stack; reduces physical damage taken by the same fraction.', cc('§2.9')),
  S('damage', 'Focus', '+1 Magic per stack; reduces magical damage AND healing received by the same fraction.', cc('§2.9')),
];

// ---- 05 Element and affinity (10) -------------------------------------------
const ELEMENTS: readonly string[] = ['Fire', 'Ice', 'Thunder', 'Water', 'Holy'];
const AFFINITIES: readonly [string, string][] = [
  ['Weak ×1.5', 'Damage of that element is multiplied by 1.5.'],
  ['Neutral ×1.0', 'No change — the default reading for every element not listed.'],
  ['Resists ×0.5', 'Damage of that element is halved.'],
  ['Immune ×0', 'Damage of that element becomes 0.'],
  ['Absorbs ×−1', 'Damage of that element heals the target instead, before the Zombie sign flip.'],
];
const ELEMENT: readonly StudioRule[] = [
  ...ELEMENTS.map((name) =>
    S('element', name, "One of FFX's five real elements (this project spells Thunder as lightning).", cc('§3')),
  ),
  ...AFFINITIES.map(([name, line]) => S('element', name, line, cc('§3'))),
];

// ---- 06 Status (37) -----------------------------------------------------------
const STATUS_L: readonly StudioRule[] = [
  L('status', 'Landing a status', 'Applied when (chance − resistance) beats a 0–100 roll.', cc('§4.1')),
  L('status', 'Regen tick', 'HP += floor(elapsedTicks × maxHP ÷ 256) + 100, at the start of any turn.', cc('§4.3')),
  L('status', 'Threaten decay', 'Only a success decays it: chance × 0.7, floored, with a floor of 1%.', cc('§4.4')),
];
const STATUS_NAMES: readonly [string, string][] = [
  ['Death / KO', "HP = 0, cannot act. The whole active party KO'd, petrified or ejected ends the battle."],
  ['Zombie', 'All HP restoration damages instead; revival effects instantly kill a living Zombie.'],
  ['Petrify', 'Cannot act; wipes other statuses on application; a physical hit can shatter it into Eject.'],
  ['Poison', "Loses 25% of max HP at the end of the victim's own turn (enemies use their own percentage)."],
  ['Silence', 'Blocks Black and White Magic and Summon, but never blocks an Overdrive.'],
  ['Sleep', 'Cannot act; attacks against a sleeper always hit; physical damage wakes them, magic does not.'],
  ['Darkness', 'Physical hit chance drops to about a tenth, before Luck.'],
  ['Slow', "Recovery doubles; applying it also adds 100% to the target's current CTB counter."],
  ['Haste', "Recovery halves; applying it also halves the target's current CTB counter."],
  ['Berserk', 'Auto-attacks only; all damage dealt is multiplied by 1.5.'],
  ['Confuse', 'Acts automatically against a random target, ally or enemy; a physical hit cures it.'],
  ['Doom', "A countdown on the victim's own turns; reaching 0 is an instant KO. Only Ribbon prevents it."],
  ['Curse', 'Cannot use Overdrive and the gauge cannot fill.'],
  ['Provoke', 'Forces the enemy to target the provoker; clears Berserk and Confuse on that enemy.'],
  ['Threaten', 'Cannot act or counterattack (can still evade); lasts until the user’s next turn.'],
  ['Guard', 'The user intercepts single-target physical attacks aimed at the other two party members.'],
  ['Sentinel', 'Guard plus Defend: intercepts attacks and halves the physical damage taken.'],
  ['Defend', "Halves physical damage taken until the user's next turn."],
  ['Protect', 'Halves physical damage taken.'],
  ['Shell', 'Halves magical damage taken and magical healing received.'],
  ['Reflect', 'Bounces one single-target Black or White spell back at the opposite party.'],
  ['Regen', 'Restores HP at the start of every turn in the field, from elapsed CTB ticks.'],
  ['Nul statuses ×4', 'Nullifies one attack of its element (Fire/Ice/Lightning/Water) — one charge, normally.'],
  ['Auto-Life', 'Auto-revives at 0 HP; consumed on use.'],
  ['Critical (SOS)', 'Automatic while HP is under 50% of max; drives every SOS auto-ability.'],
  ['Shield (aeon)', 'Aeon stance: damage and healing received are quartered; Overdrive gain is negated.'],
  ['Boost (aeon)', 'Aeon stance: damage and healing received are ×1.5; Overdrive gauge fills ×1.5 too.'],
  ['Eject', 'Removed from the battle entirely, counted as defeated.'],
  ['Scan', 'Reveals HP, affinities and immunities for the rest of the battle.'],
  ['Mix flags ×7', 'Battle-long effects from a Rikku Mix — doubled HP/MP, free MP, guaranteed crits and more — cleared by KO, not by Petrify.'],
];
const BREAKS: readonly [string, string][] = [
  ['Power Break', "The user's physical damage is halved."],
  ['Magic Break', "The user's magical damage is halved."],
  ['Armor Break', "The target's Defense is treated as 0, and Armored's ÷3 is cancelled."],
  ['Mental Break', "The target's Magic Defense is treated as 0."],
];
const STATUS: readonly StudioRule[] = [
  ...STATUS_L,
  ...STATUS_NAMES.map(([name, line]) => M('status', name, line, cc('§4.2'))),
  ...BREAKS.map(([name, line]) => M('status', name, line, cc('§2.10'))),
];

// ---- 07 Overdrive gauge (18) --------------------------------------------------
const MODES: readonly [string, string][] = [
  ['Stoic mode', 'Default. Taking damage fills the gauge by damageReceived × 30 ÷ maxHP percent.'],
  ['Warrior mode', 'Damaging an enemy fills it by min(16, damageInflicted × 10 ÷ estimatedDamage) percent.'],
  ['Comrade mode', "An ally taking damage fills it by damageReceived × 20 ÷ that ally's maxHP percent."],
  ['Healer mode', "Restoring an ally's HP fills it by healedAmount × 16 ÷ target's maxHP percent, even at full HP."],
  ['Tactician mode', 'Inflicting a status ailment on an enemy fills it by 16%.'],
  ['Victim mode', 'An enemy inflicting a status ailment on the user fills it by 16%.'],
  ['Dancer mode', 'Evading an enemy attack fills it by 16%.'],
  ['Avenger mode', "An enemy KO'ing an ally fills it by 30%."],
  ['Slayer mode', 'Killing an enemy fills it by 20%.'],
  ['Hero mode', 'Killing an enemy with 10,000+ HP, or 20x the estimated damage, fills it by 20%.'],
  ['Rook mode', 'Reducing or nullifying enemy damage via a Nul, Protect, Shell or Reflect fills it by 10%.'],
  ['Victor mode', 'Being in the active party when the battle is won fills it by 20%.'],
  ['Coward mode', "Escaping (or anyone's Flee) fills it by 10%."],
  ['Ally mode', "The start of the user's turn fills it by 3%."],
  ['Sufferer mode', "The start of the user's turn while afflicted fills it by 16%."],
  ['Daredevil mode', "The start of the user's turn while in Critical fills it by 5%."],
  ['Loner mode', "The start of the user's turn while the sole surviving or active member fills it by 16%."],
];
const OVERDRIVE: readonly StudioRule[] = [
  L('overdrive', 'Timed-input bonus', 'A fast, well-placed input adds up to +50% more damage.', cc('§5.2')),
  ...MODES.map(([name, line]) => M('overdrive', name, line, cc('§5.1'))),
];

// ---- 08 The boss's next move (11) — research/ffx-seymour-flux.md §3, §4 ------
const BOSS_MOVES: readonly [string, string, string][] = [
  ['Lance of Atrophy', 'Physical hit on a random character; always lands Zombie at 100%.', '§3.1'],
  ['Full-Life', "Instant kill on a Zombied ally, or a full revive on a KO'd one; whiffs harmlessly otherwise.", '§3.1, §3.3'],
  ['Cross Cleave', 'Party-wide physical hit plus a strong Delay on everyone.', '§3.1'],
  ['Total Annihilation', 'Five non-elemental magic hits across the whole party.', '§3.1, §4.4.2'],
  ['Flare', "Always cast on himself; bounces onto the party while he holds Reflect, or burns him for ~1,700 once it's dispelled.", '§3.1, §3.3, §4.4.1'],
  ['Banish', "Ejects a summoned aeon after its one free turn, ignoring the aeon's Ribbon immunity.", '§3.1, §4.5'],
  ['Slowga', 'Counters a Delay attempt with party-wide Slow and doubled CTB.', '§3.1, §4.6'],
  ['Protect', 'Counters his own HP falling below 75% by casting Protect on himself.', '§4.3'],
  ['Reflect', 'Counters his own HP falling below 50% by casting Reflect on himself and opening phase 2.', '§4.3'],
  ['Dispel', 'Strips Haste, Protect, Shell, Reflect, Regen, the four Nuls and the four Breaks from the party.', '§3.1, §4.2'],
  ['Mortibsorption', "Drains Mortiorchis's own max HP from Seymour on death, then decays its max-HP floor.", '§2.2'],
];
const BOSS: readonly StudioRule[] = BOSS_MOVES.map(([name, line, section]) => M('boss', name, line, sf(section)));

/** All 137 rules, in component order. Matches `inventory.mjs`'s `TOTAL`. */
export const STUDIO_RULES: readonly StudioRule[] = [
  ...TURN,
  ...COMMAND,
  ...HIT,
  ...DAMAGE,
  ...ELEMENT,
  ...STATUS,
  ...OVERDRIVE,
  ...BOSS,
];

/** Rules belonging to one component, in the order they were authored above. */
export function rulesForComponent(component: StudioComponentId): readonly StudioRule[] {
  return STUDIO_RULES.filter((r) => r.component === component);
}

export const TOTAL_RULE_COUNT = STUDIO_RULES.length;
