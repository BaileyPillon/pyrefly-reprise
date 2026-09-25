/**
 * Shared battle contracts for both engines (FFX CTB and FFX-2 ATB).
 *
 * **This file is a contract.** ~30 implementation agents import it. It is pure
 * data and type declarations: no DOM, no Three.js, no imports at all. Changing
 * anything here requires a note in `docs/CONTRACT-CHANGES.md` (see
 * `docs/ARCHITECTURE.md` "Layering rule" and `docs/CONTRACTS.md` for how each
 * kind of agent consumes it).
 *
 * Conventions used throughout:
 * - Every id is a **string-literal union**, never a TS `enum` (`isolatedModules`
 *   is on and unions tree-shake and serialise cleanly).
 * - Ids are `kebab-case`.
 * - Every numeric field documents its **unit and range**.
 * - Research citations are of the form `[ffx-combat-core §2.2]` and point at
 *   `research/*.md`. Data files MUST cite their section; see `docs/CONTRACTS.md`.
 * - `chance` bytes are kept **raw (0–255)** exactly as the decompile stores
 *   them, and are converted only at the point of rolling
 *   [ffx-combat-core §4.1, §12.1].
 *
 * Integer arithmetic: the FFX engine's damage chain floors toward negative
 * infinity (Python `//`). Use a shared `ifloor()` helper in `battle/ffx`,
 * not `Math.floor`, wherever the research prints `//` on a possibly-negative
 * value [ffx-combat-core §2.1].
 */

// ---------------------------------------------------------------------------
// 0. Primitives
// ---------------------------------------------------------------------------

/** Which game a piece of content belongs to. */
export type GameId = 'ffx' | 'ffx2';

/** Stable identifier for a combatant instance inside one battle. */
export type CombatantId = string;

/** Stable identifier for an ability record in `data/ffx/abilities` or `data/ffx2/abilities`. */
export type AbilityId = string;

/** Stable identifier for an item record in `data/ffx/items` or `data/ffx2/items`. */
export type ItemId = string;

/** Key into the sprite registry (`src/sprites/`). */
export type SpriteKey = string;

/** Key into the portrait registry (32x32 faces used by the CTB list and dialogue). */
export type PortraitKey = string;

/** Key into the VFX registry owned by `src/engine/`. Presentation only. */
export type VfxKey = string;

/** Key into the SFX bank (`src/audio/sfx`). Presentation only. */
export type SfxKey = string;

/** Key into the music registry (`src/audio/tracks`). Presentation only. */
export type MusicKey = string;

/** Name of a camera rig registered by a scene builder (`src/scenes/`). */
export type CameraRigId = string;

/**
 * Which team a combatant fights for.
 *
 * `aeon` is its own side because an aeon *replaces* the party on the field:
 * party members are removed and their CTB counters and status durations freeze
 * until the aeon leaves [ffx-combat-core §6.1]. Targeting code must treat
 * `aeon` as friendly to `party` but as the only present friendly actor.
 */
export type Side = 'party' | 'enemy' | 'aeon';

/** Who chooses this combatant's commands. */
export type Controller = 'player' | 'ai';

// ---------------------------------------------------------------------------
// 1. Elements and affinities
// ---------------------------------------------------------------------------

/**
 * Damage elements.
 *
 * FFX has five real elements — Fire, Ice, Thunder, Water, Holy
 * [ffx-combat-core §3]. **We spell Thunder as `'lightning'`** because FFX-2 and
 * the visual bible both use "Lightning"; the two are the same element and data
 * files for FFX should write `'lightning'` where the research says "Thunder".
 *
 * `'gravity'` is an FFX-2 element [ffx2-combat-core §2.7]. In FFX there is no
 * gravity element — Demi is non-elemental `percent-current` damage — but the
 * FFX Sensor panel still shows a gravity chip [visual-bible §3.5], so the id
 * exists in both games and is simply always neutral for FFX enemies.
 *
 * `'none'` means non-elemental: affinities are ignored entirely.
 */
export type ElementId = 'fire' | 'ice' | 'lightning' | 'water' | 'holy' | 'gravity' | 'none';

/** Every element id, in HUD display order. */
export const ELEMENT_IDS: readonly ElementId[] = [
  'fire',
  'ice',
  'lightning',
  'water',
  'holy',
  'gravity',
  'none',
] as const;

/** How a target reacts to an element. */
export type Affinity = 'weak' | 'normal' | 'resist' | 'immune' | 'absorb';

/**
 * FFX element multipliers [ffx-combat-core §3, decompile
 * `constants.py::ELEMENTAL_AFFINITY_MODIFIERS`].
 *
 * `absorb` is **-1.0**: the sign flip at step 4 of the modifier order turns the
 * damage into healing, and because the Zombie flip happens later at step 14, a
 * Zombie character *is* healed by an absorbed hit [ffx-combat-core §2.4, §3].
 *
 * Multi-element resolution: take the single strongest affinity among the
 * attack's elements, except that multiple *weaknesses* multiply
 * (double-weak = x2.25).
 */
export const AFFINITY_MULTIPLIER_FFX: Readonly<Record<Affinity, number>> = {
  weak: 1.5,
  normal: 1.0,
  resist: 0.5,
  immune: 0.0,
  absorb: -1.0,
} as const;

/**
 * FFX-2 element multipliers [ffx2-combat-core §2.7].
 *
 * Note **weak is x2.0 in X-2, not x1.5** — "no weakness" is a much bigger deal
 * in X-2 than in FFX. Weaknesses stack across elements; resistance does not
 * (halved only once).
 */
export const AFFINITY_MULTIPLIER_FFX2: Readonly<Record<Affinity, number>> = {
  weak: 2.0,
  normal: 1.0,
  resist: 0.5,
  immune: 0.0,
  absorb: -1.0,
} as const;

/**
 * Per-element affinity map. A missing key means `'normal'` — data files only
 * list the non-neutral entries, which is also how the source bestiaries behave.
 */
export type ElementalAffinities = Partial<Record<ElementId, Affinity>>;

// ---------------------------------------------------------------------------
// 2. Statuses
// ---------------------------------------------------------------------------

/**
 * FFX statuses [ffx-combat-core §4.2].
 *
 * Per-status semantics (D = how the duration is counted, KO = whether KO clears
 * it, BATTLE = whether it survives the battle):
 *
 * | id | D | cleared by KO | after battle |
 * |---|---|---|---|
 * | `ko` | until revived | — | HP is restored between our chapters |
 * | `zombie` | 254 = whole battle | yes | no |
 * | `petrify` | 254 | n/a (petrify is not KO) | no |
 * | `poison` | 254 | yes | no |
 * | `silence` | turns (ticks down on the victim's own action) | yes | no |
 * | `sleep` | turns | yes | no |
 * | `darkness` | turns | yes | no |
 * | `slow` | 254 | yes | no |
 * | `haste` | 254 (255 = permanent from Auto-Haste) | yes | no |
 * | `berserk` | 254 | yes | no |
 * | `confuse` | 254 | yes | no |
 * | `doom` | counter in the victim's own turns; party = 5 | yes | no |
 * | `curse` | 254 | yes | no |
 * | `provoke` | 254 | yes | no |
 * | `threaten` | 1 **user**-turn (enemies only) | yes | no |
 * | `guard` / `sentinel` / `defend` | until the user's next turn | yes | no |
 * | `protect` / `shell` / `reflect` | 254 | yes | no |
 * | `regen` | 10 turns (20 from Mighty G mixes; infinite from Auto-Regen) | yes | no |
 * | `nulblaze`/`nulfrost`/`nulshock`/`nultide` | **charges**, normally 1 | yes | no |
 * | `auto-life` | until consumed | consumed on KO | no |
 * | `critical` | dynamic: HP < 50% of max | n/a | n/a |
 * | `shield` / `boost` | until the aeon's next turn | yes | no |
 * | `eject` | permanent for the battle | n/a | no |
 * | `scan` | 254 | no | no |
 * | four breaks | 254, removable only by Dispel; Ribbon does NOT block them | yes | no |
 * | `cheer`/`focus`/`aim`/`reflex`/`luck`/`jinx` | **stacks 0–5**, no expiry | yes (cleared by KO) — but they **survive Petrify** | no |
 * | mix/tonic flags | whole battle; **removed by KO**, not by Petrify | yes | no |
 *
 * Deliberately **not** statuses:
 * - **Delay** is a one-off push to the target's CTB counter, carried by the
 *   `'weak-delay'` / `'strong-delay'` {@link ActionFlag}s [ffx-combat-core §1.5].
 * - There is **no separate "death-pending"** state. `doom` is the countdown and
 *   `ko` is the result.
 * - **Sensor** is an {@link AutoAbilityId}, not a status; `scan` is the status.
 */
export type FFXStatusId =
  // --- incapacitating -----------------------------------------------------
  /** HP = 0, cannot act. Whole active party KO'd/petrified/ejected = Game Over. */
  | 'ko'
  /** All HP restoration damages instead; revival effects instantly kill a living Zombie. Cured by Holy Water/Remedy, **not Esuna**. */
  | 'zombie'
  /** Cannot act; wipes other statuses on application (buff stacks survive); CTB counter is not reset; a physical hit can shatter -> `eject`. */
  | 'petrify'
  /** Loses `maxHP // 4` (25%) at the end of the victim's own turn; enemies use a per-monster percentage. */
  | 'poison'
  /** Blocks Wht/Blk Magic and Summon. Does NOT block Overdrives (Fury, Grand Summon). */
  | 'silence'
  /** Cannot act; attacks against a sleeper always hit; physical damage wakes, magic does not. */
  | 'sleep'
  /** Physical hit chance becomes base/10 (~10%) before Luck. */
  | 'darkness'
  /** Recovery x2; on application also adds 100% of current CTB. Mutually exclusive with `haste`. */
  | 'slow'
  /** Recovery floor(/2); on application halves current CTB. Mutually exclusive with `slow`. */
  | 'haste'
  /** Auto-attacks only; all damage dealt x1.5. */
  | 'berserk'
  /** Acts automatically against a random target, ally or enemy. Physical damage cures it. */
  | 'confuse'
  /** Countdown on the victim's own turn; at 0 -> instant KO. Nothing removes it; only Ribbon prevents it. */
  | 'doom'
  /** Cannot use Overdrive and the gauge cannot fill. One of the few things aeons are NOT immune to. */
  | 'curse'
  // --- taunt / control ----------------------------------------------------
  /** Forces the enemy to target the provoker. Clears Berserk and Confuse on that enemy. */
  | 'provoke'
  /** Enemy cannot act or counterattack; blocks delay and Haste/Slow on both sides. Party and aeons are innately immune (resistance 255). See §4.4 for its own chance model. */
  | 'threaten'
  /** The user intercepts all single-target physical attacks aimed at the other two members. */
  | 'guard'
  /** Guard plus Defend: intercepts AND halves physical damage. */
  | 'sentinel'
  /** Halves physical damage taken. Stacks with Protect. */
  | 'defend'
  // --- buffs --------------------------------------------------------------
  /** Physical damage `//2`. */
  | 'protect'
  /** Magical damage **and magical healing** `//2`. */
  | 'shell'
  /** Bounces one single-target Blk/Wht spell. Not party-wide spells, Dispel, items, Overdrives or Mixes. */
  | 'reflect'
  /** At the start of ANY unit's turn: `HP += floor(elapsedTicks * maxHP / 256) + 100` [ffx-combat-core §4.3]. Sign flips on a Zombie. */
  | 'regen'
  /** Nullifies one Fire attack (one charge). Beats Absorb. */
  | 'nulblaze'
  /** Nullifies one Ice attack (one charge). */
  | 'nulfrost'
  /** Nullifies one Thunder/Lightning attack (one charge). */
  | 'nulshock'
  /** Nullifies one Water attack (one charge). */
  | 'nultide'
  /** On reaching 0 HP, auto-revive at 25% max HP. Consumed on use. Dispel does not remove it. */
  | 'auto-life'
  /** SOS / "Critical": automatic while HP < 50% of max. Drives SOS auto-abilities and Daredevil charging. */
  | 'critical'
  /** Aeon stance: all damage AND healing received `//4`; Overdrive gain is negated entirely. */
  | 'shield'
  /** Aeon stance: all damage AND healing received x1.5; Overdrive gauge fills x1.5 too. */
  | 'boost'
  /** Removed from battle, counts as defeated; a bench member cannot fill the slot. */
  | 'eject'
  /** Reveals HP / affinities / immunities. */
  | 'scan'
  // --- breaks (all permanent for the battle, removable only by Dispel) -----
  /** The **user's** physical damage is halved. */
  | 'power-break'
  /** The user's magical damage is halved. */
  | 'magic-break'
  /** Target's Defense treated as 0 AND the Armored `//3` is cancelled. */
  | 'armor-break'
  /** Target's Magic Defense treated as 0. */
  | 'mental-break'
  // --- stacking buffs, 0-5 stacks [ffx-combat-core §2.9] ------------------
  /** +1 Strength per stack; physical damage received x(15-stacks)/15. */
  | 'cheer'
  /** +1 Magic per stack; magical damage received x(15-stacks)/15 — **also reduces healing received**. */
  | 'focus'
  /** +10 to hit chance per stack. */
  | 'aim'
  /** -10 to the attacker's hit chance per stack. */
  | 'reflex'
  /** +1 hit chance and +10 crit chance per stack. */
  | 'luck'
  /** +1 to attackers' hit chance and +10 crit chance against the target per stack. */
  | 'jinx'
  // --- mix / tonic flags: battle-long, removed by KO but NOT by Petrify ----
  /** Max HP doubled (no immediate healing). */
  | 'max-hp-x2'
  /** Max MP doubled. */
  | 'max-mp-x2'
  /** Every MP cost becomes 0. */
  | 'mp-cost-zero'
  /** Trio of 9999 / Quartet of 9: clamps any damage in [0,9999] to 9999 and any heal in [-9999,-1] to -9999. */
  | 'damage-9999'
  /** Hero Drink / Miracle Drink: every crit-eligible action always crits. */
  | 'guaranteed-critical'
  /** Hot Spurs: Overdrive gauge gain x1.5. */
  | 'overdrive-x1_5'
  /** Eccentrick: Overdrive gauge gain x2 (stacks with Hot Spurs). */
  | 'overdrive-x2';

/**
 * FFX-2 statuses [ffx2-combat-core §2.8].
 *
 * Ids shared with {@link FFXStatusId} (`ko`, `petrify`, `poison`, `silence`,
 * `sleep`, `darkness`, `slow`, `haste`, `berserk`, `confuse`, `doom`, `curse`,
 * `eject`, `protect`, `shell`, `reflect`, `regen`, `auto-life`) mean the same
 * *thing* but obey **X-2's** rules, which differ in several places — Berserk is
 * x1.25 not x1.5, Regen is ~3% max HP per tick, Auto-Life revives at 25%.
 * Engines must never share status *logic* across games, only the ids.
 *
 * Duration model: X-2 stores an integer `durationValue`; wall-clock seconds are
 * `durationValue * 0.53` at the default Normal ATB speed, scaled x2.0 while
 * Slow and x0.95 while Haste [ffx2-combat-core §2.8]. Store that as
 * {@link StatusInstance.ticksRemaining}. Statuses flagged `Infinite` in the
 * source tables (Poison, Darkness, Silence, Petrify, Curse, Pointless, Itchy,
 * Auto-Life, Spellspring, every Up/Down stack) have no expiry at all.
 *
 * Persists after battle (the only four): `darkness`, `ko`, `petrify`, `poison`,
 * `pointless`, `silence`. Everything else is cleared on victory.
 */
export type FFX2StatusId =
  // --- shared ids, X-2 rules ---------------------------------------------
  | 'ko'
  | 'petrify'
  | 'poison'
  | 'silence'
  | 'sleep'
  | 'darkness'
  | 'slow'
  | 'haste'
  | 'berserk'
  | 'confuse'
  | 'doom'
  | 'curse'
  | 'eject'
  | 'protect'
  | 'shell'
  | 'reflect'
  | 'regen'
  | 'auto-life'
  // --- X-2 only, positive -------------------------------------------------
  /** All damage nullified; **status effects still land**. */
  | 'invincible'
  /** Immune to all magic ("IMMUNE"). */
  | 'null-magic'
  /** Immune to all physical ("IMMUNE"). */
  | 'null-physical'
  /** All MP costs become 0; also removes Darkness's HP cost for Dark Knight. This is X-2's "no MP" state. */
  | 'spellspring'
  /** Physical damage dealt x(12+level)/12. `stacks` = level, 0-10. */
  | 'str-up'
  /** Magic damage dealt x(12+level)/12. `stacks` = level, 0-10. */
  | 'mag-up'
  /** Physical damage taken x(12-level)/12. `stacks` = level, 0-10. */
  | 'def-up'
  /** Magic damage taken x(12-level)/12. `stacks` = level, 0-10. */
  | 'mdef-up'
  /** +10 accuracy points per level inside the hit check. `stacks` 0-10. */
  | 'accu-up'
  /** +10 evasion points per level inside the hit check. `stacks` 0-10. */
  | 'eva-up'
  /** +5 luck points per level inside the hit check (raises crit rate). `stacks` 0-10. */
  | 'luck-up'
  // --- X-2 only, negative -------------------------------------------------
  /** Agility treated as 0, ATB frozen white, no commands. Also removes Sleep/Confuse/Berserk and freezes Doom, Poison and Regen ticks. */
  | 'stop'
  /** The girl MUST spherechange (L1) before she can use any command; only L1 and Escape remain. Cleared by spherechanging or by becoming Confused. */
  | 'itchy'
  /** Earns no EXP at end of battle and no AP during battle. Icon reads "EXP=0". Cured by Holy Water. */
  | 'pointless'
  /** Hidden, instantaneous: empties a % of the target's ATB or CTIM bar. CTIM cannot be *cancelled* by it, only shortened. */
  | 'delay-effect'
  /** Hidden, instantaneous: a mid-CTIM action is cancelled outright and the ATB restarts from empty (Dismissal, Bully Ghiki). */
  | 'action-cancel'
  /** Hidden consequence of Petrification: any connecting physical attack shatters the character permanently. */
  | 'shattering'
  | 'str-down'
  | 'mag-down'
  | 'def-down'
  | 'mdef-down'
  | 'accu-down'
  | 'eva-down'
  | 'luck-down';

/** Any status in either game. */
export type StatusId = FFXStatusId | FFX2StatusId;

/**
 * One status currently on a combatant.
 *
 * Only one instance per {@link StatusId} exists at a time; FFX explicitly does
 * **not** refresh or stack a status that is already present
 * [ffx-combat-core §4.1]. `stacks` is the exception — the stacking buffs and
 * the X-2 Up/Down levels carry their level here.
 */
export interface StatusInstance {
  id: StatusId;
  /**
   * FFX: remaining duration in the **victim's own turns**, for the five
   * ticking statuses (Sleep, Silence, Darkness, Slow, Regen) and for Doom's
   * countdown. `254` = until the end of battle. `255` = permanent /
   * undispellable. `null` when the status has no turn duration.
   * [ffx-combat-core §4.1]
   */
  turnsRemaining: number | null;
  /**
   * FFX-2: remaining duration in ATB ticks (3000 ticks = 1 s at the default
   * Normal speed). `null` = infinite. Unused by the FFX engine.
   * [ffx2-combat-core §1.2, §2.8]
   */
  ticksRemaining: number | null;
  /**
   * Remaining charges, for the four Nul statuses. 1 by default; the SOS-Nul
   * auto-abilities are modelled as `permanent: true` instead of a high charge
   * count. `null` for everything else. Range 0–255.
   */
  charges: number | null;
  /**
   * Stack level. FFX Cheer/Focus/Aim/Reflex/Luck/Jinx: **0–5**.
   * FFX-2 Up/Down statuses: **0–10**. `0` for everything else.
   */
  stacks: number;
  /** True for stack byte 255 — permanent and undispellable (e.g. Auto-Haste). */
  permanent: boolean;
  /** Combatant that applied it, for Threaten's "until the *user's* next turn" rule and for logging. */
  sourceId?: CombatantId;
  /** Ability or item that applied it, for message templates. */
  sourceAbilityId?: AbilityId;
}

/**
 * Per-status resistance, as the raw 0–255 byte the decompile stores.
 *
 * **Resistance subtracts, it does not multiply** [ffx-combat-core §4.1]:
 * ```
 * if chance === 255            -> applied (ignores immunity entirely)
 * else if resistance === 255   -> blocked
 * else if chance === 254       -> applied (guaranteed, immunity still blocks)
 * else if chance - resistance > (rng % 101) -> applied
 * ```
 * `0` (or a missing key) = no resistance. `50` = a Ward. `255` = a Proof /
 * innate immunity.
 */
export type StatusImmunities = Partial<Record<StatusId, number>>;

/**
 * Coarse damage-class immunity flags, the closed `ImmunityFlag` set
 * [ffx-combat-core §12.3] plus the three `immune_to_*_damage` bytes from §2.4.
 */
export type ImmunityFlag =
  /** §1.5 weak/strong delays do nothing. */
  | 'immune-to-delay'
  /** §7.8.2 Bribe always fails regardless of gil. */
  | 'immune-to-bribe'
  /** Revival effects fail. Relevant to the Zombie/Death branch. */
  | 'immune-to-life'
  /** §4.4 Threaten's initial chance is 0. */
  | 'immune-to-threaten'
  /** Regen cannot be applied (Braska's Final Aeon and the Yu Pagodas are on this list). */
  | 'immune-to-regen'
  /** `percent-total` / `percent-current` formulas deal 0 (Yunalesca is flagged this). */
  | 'immune-to-percentage-damage'
  /** Sensor returns "- - -". */
  | 'immune-to-sensor'
  /** Scan fails. */
  | 'immune-to-scan'
  /** All physical damage is 0. */
  | 'immune-to-physical-damage'
  /** All magical damage is 0. */
  | 'immune-to-magical-damage'
  /** All damage is 0. */
  | 'immune-to-damage'
  /** Physical damage `//3` unless the user has Piercing or the action has `ignores-armored`, or the target has Armor Break. */
  | 'armored'
  /** Disables Escape and Flee. */
  | 'boss';

// ---------------------------------------------------------------------------
// 3. Stats
// ---------------------------------------------------------------------------

/**
 * The ten combat stats, in the project's canonical order.
 *
 * FFX caps: HP 9 999 (99 999 with Break HP Limit), MP 999 (9 999 with Break MP
 * Limit), every other stat **255** [ffx-combat-core §10.1]. Agility above 170
 * changes nothing except first-turn placement [ffx-combat-core §1.2].
 *
 * FFX-2 has no hard stat cap in this range; observed boss values run to 255+
 * on Agility.
 */
export interface Stats {
  /** Base HP pool before HP+% auto-abilities. Range 1–99 999. */
  hp: number;
  /** Base MP pool before MP+% auto-abilities. Range 0–9 999. */
  mp: number;
  /** Strength. Drives the `strength` POWER term `(str^3 // 32) + 30`. Range 1–255. */
  str: number;
  /** Defense. Drives MITIGATION. Floored at 1 for the strength formula; 0 under Armor Break. Range 0–255. */
  def: number;
  /** Magic. Drives `magic`, `special-magic` and `healing` POWER. Range 1–255. */
  mag: number;
  /** Magic Defense. Floored at 1; 0 under Mental Break and always 0 for `special-magic`. Range 0–255. */
  mdef: number;
  /** Agility. FFX: indexes `ICV_BASE` -> base ticks. FFX-2: `ticks = 10000 * value / (agi + 1)`. Range 0–255. */
  agi: number;
  /** Luck. Hit chance and critical chance. Range 0–255 (targets use `max(luck, 1)`). */
  luck: number;
  /** Evasion. Subtracted from the attacker's scaled accuracy. Range 0–255. */
  eva: number;
  /** Accuracy. Only 40% of it counts in the FFX hit table. Enemy Accuracy is never used in FFX (actions carry their own byte). Range 0–255. */
  acc: number;
}

/**
 * {@link Stats} plus the *effective* maxima after equipment / mix flags.
 *
 * `hp`/`mp` in the base block are the **unmodified pool sizes**; `maxHp`/`maxMp`
 * are what the HUD draws and what `percent-total` formulas read. A build with
 * HP +20% has `hp: 2000, maxHp: 2400`. `max-hp-x2` doubles `maxHp` only.
 */
export interface StatBlock extends Stats {
  /** Effective maximum HP after HP+% and `max-hp-x2`. Clamped to 9 999, or 99 999 with Break HP Limit. */
  maxHp: number;
  /** Effective maximum MP after MP+% and `max-mp-x2`. Clamped to 999, or 9 999 with Break MP Limit. */
  maxMp: number;
}

// ---------------------------------------------------------------------------
// 4. Combatants
// ---------------------------------------------------------------------------

/** Free-form boolean markers on a combatant. Absent = false. */
export interface CombatantFlags {
  /** Boss formation: Escape and Flee are disabled and the HP bar gets boss chrome. */
  isBoss?: boolean;
  /** A destructible/limb part of a larger enemy (Yu Pagoda, Bulwark, Node, Redoubt). */
  isPart?: boolean;
  /** Owning enemy for a part, e.g. `'vegnagun-body'` for `'bulwark-r'`. */
  partOf?: CombatantId;
  /** Cannot be selected as a target at all (used between forms and for scripted lulls). */
  untargetable?: boolean;
  /** Not drawn and not targetable — a form waiting off-stage, or a destroyed part that can be restored. */
  hidden?: boolean;
  /** Do not draw an HP bar or Sensor HP for this combatant (parts whose HP is a secret). */
  hideHpBar?: boolean;
  /** Survives to the next battle in a chain without a menu (Yunalesca's forms, the Vegnagun chain). */
  carriesStateForward?: boolean;
  /** Cannot be revived by anything (possessed aeons, Yu Yevon's shell). */
  noRevive?: boolean;
}

/**
 * Everything both engines need about a fighter.
 *
 * Engines own instances of this; UI and presentation read it through
 * `BattleEngine.state()` and must treat it as **deeply read-only**.
 */
export interface Combatant {
  id: CombatantId;
  /** Display name as it appears in the CTB list, targeting plate and battle text. */
  name: string;
  side: Side;
  /** Sprite registry key. Bosses with forms swap this on `form-change`. */
  spriteKey: SpriteKey;
  /** 32x32 face for the CTB list and dialogue boxes. Enemies usually have none. */
  portraitKey?: PortraitKey;
  /** Effective stats *including* equipment/dressphere/accessory modifiers. */
  stats: StatBlock;
  /** Current HP. 0 means KO'd (or destroyed, for a part). Range 0–`stats.maxHp`. */
  hp: number;
  /** Current MP. Range 0–`stats.maxMp`. */
  mp: number;
  /** Active statuses, keyed by id. Use `Partial<Record<...>>` semantics: a missing key means "not afflicted". */
  statuses: Partial<Record<StatusId, StatusInstance>>;
  affinities: ElementalAffinities;
  /** Raw 0–255 resistance bytes. Missing key = 0 = no resistance. */
  immunities: StatusImmunities;
  /** Coarse damage-class and behaviour flags. */
  immunityFlags: ImmunityFlag[];
  controller: Controller;
  /** False once HP hits 0, or on `eject` / shatter. A KO'd party member is `alive: false` but still on the field. */
  alive: boolean;
  /** True when the combatant has left the field entirely (Eject, shatter, dismissed aeon, destroyed part). */
  removed: boolean;
  /**
   * Field slot index used by the scene builder to place the sprite.
   * Party/aeon: 0..2 left-to-right. Enemies: 0..n in the formation's own order.
   */
  slot: number;
  flags: CombatantFlags;
  /** Short targeting-bar hint. May deliberately mislead (see `misleadingSensor`). [writing-bible §5.3] */
  sensorText?: string;
  /** Longer Scan panel copy. */
  scanText?: string;
  /** Set when the sensor text is in-world advice that the fight does not honour (Yunalesca's Holy "weakness"). QA must not "fix" it. */
  misleadingSensor?: boolean;
  /**
   * True once Sensor / Scan has revealed this combatant **for the rest of the
   * battle**. The FFX-2 boss strip prints a `SCAN` hint instead of HP numerals
   * until this flips, so the engine sets it alongside the `'sensor'` event and
   * never clears it — reveal survives KO, form changes and a chained link.
   */
  revealed?: boolean;
}

// ---------------------------------------------------------------------------
// 5. FFX equipment auto-abilities
// ---------------------------------------------------------------------------

/**
 * Every FFX equipment auto-ability [ffx-combat-core §9].
 *
 * Equipment in FFX **does not change stats**; it grants auto-abilities only.
 * Numeric semantics are noted per group below; the engine applies the
 * percentage families at steps 8/9 of the modifier order [ffx-combat-core §2.4].
 */
export type AutoAbilityId =
  // --- information / turn order -------------------------------------------
  /** Reveals the target's current/max HP, affinities and statuses. No combat effect. */
  | 'sensor'
  /** The wearer's initial CTB is 0 in every encounter condition, including Ambush. */
  | 'first-strike'
  /** Subtracts 33 from the 0–255 encounter roll: preemptive 12.5% -> 25.4%, ambush eliminated. One wearer in the active party is enough. */
  | 'initiative'
  /** Skips the `//3` Armored reduction (step 10). Nothing else — it does NOT ignore Defense. */
  | 'piercing'
  // --- offence: `dmg += dmg * N // 100` on PHYSICAL damage only ------------
  | 'strength-3'
  | 'strength-5'
  | 'strength-10'
  | 'strength-20'
  // --- offence: same, on MAGICAL damage only (incl. magical healing) -------
  | 'magic-3'
  | 'magic-5'
  | 'magic-10'
  | 'magic-20'
  // --- defence: `dmg -= dmg * N // 100` on incoming PHYSICAL ---------------
  | 'defense-3'
  | 'defense-5'
  | 'defense-10'
  | 'defense-20'
  // --- defence: same, on incoming MAGICAL ---------------------------------
  | 'magic-def-3'
  | 'magic-def-5'
  | 'magic-def-10'
  | 'magic-def-20'
  // --- pools: `maxHP = baseHP * (100+N) // 100`, clamped 9 999 ------------
  | 'hp-5'
  | 'hp-10'
  | 'hp-20'
  | 'hp-30'
  /** `maxMP = baseMP * (100+N) // 100`, clamped 999. */
  | 'mp-5'
  | 'mp-10'
  | 'mp-20'
  | 'mp-30'
  /** Raises the HP cap to 99 999. */
  | 'break-hp-limit'
  /** Raises the MP cap to 9 999. */
  | 'break-mp-limit'
  /** The wearer's damage AND healing cap becomes 99 999. Does not override an action's `never-break-damage-limit`. */
  | 'break-damage-limit'
  // --- MP economy ---------------------------------------------------------
  /** Every MP-costing ability costs exactly 1. */
  | 'one-mp-cost'
  /** `cost // 2`. Applied **after** Magic Booster's doubling. */
  | 'half-mp-cost'
  /** Magical damage x1.5; Blk/Wht Magic MP cost x2. */
  | 'magic-booster'
  /** Recovery **items** restore x2. Does not extend to Mixes. */
  | 'alchemy'
  // --- counters (all fire with `ctb = 0`, i.e. cost no turn) --------------
  /** Automatic Attack against the aggressor after any physical attack. */
  | 'counterattack'
  /** Evades a standard physical attack AND counters; the counter fires even when the evade fails. */
  | 'evade-and-counter'
  /** Counters magical attacks the same way. */
  | 'magic-counter'
  /** When damage leaves the wearer below 50% max HP, consumes the weakest available potion (Potion -> Hi-Potion -> X-Potion). */
  | 'auto-potion'
  /** Automatically consumes a status cure on Darkness, Silence, Poison or Zombie. */
  | 'auto-med'
  /** Automatically uses a Phoenix Down on a KO'd ally, unless the wearer died to the same attack. */
  | 'auto-phoenix'
  // --- permanent statuses (applied at stack 255 at battle start) ----------
  /** Permanent Haste -> the wearer is also immune to Slow. */
  | 'auto-haste'
  | 'auto-protect'
  | 'auto-shell'
  /** Infinite Regen, and **not** dispellable. */
  | 'auto-regen'
  | 'auto-reflect'
  // --- SOS statuses: applied at stack 255 while HP < 50% of max -----------
  | 'sos-haste'
  | 'sos-protect'
  | 'sos-shell'
  | 'sos-regen'
  | 'sos-reflect'
  /** SOS Nul-versions nullify **all** attacks of that element, not one charge. */
  | 'sos-nulblaze'
  | 'sos-nulfrost'
  | 'sos-nulshock'
  | 'sos-nultide'
  /** The gauge charges only while in Critical, at a boosted rate. */
  | 'sos-overdrive'
  // --- weapon status strikes: chance 100, stack 254 ----------------------
  | 'stonestrike'
  | 'deathstrike'
  | 'zombiestrike'
  | 'poisonstrike'
  | 'sleepstrike'
  | 'silencestrike'
  | 'darkstrike'
  | 'slowstrike'
  // --- ...touch variants: chance 50. Touch + Strike on one weapon = 150 ---
  | 'stonetouch'
  | 'deathtouch'
  | 'zombietouch'
  | 'poisontouch'
  | 'sleeptouch'
  | 'silencetouch'
  | 'darktouch'
  | 'slowtouch'
  // --- proofs: set that status's resistance byte to 255 -------------------
  | 'stoneproof'
  | 'deathproof'
  | 'zombieproof'
  | 'poisonproof'
  | 'sleepproof'
  | 'silenceproof'
  | 'darkproof'
  | 'slowproof'
  | 'confuseproof'
  | 'berserkproof'
  | 'curseproof'
  // --- wards: set that status's resistance byte to 50 (subtractive) -------
  | 'stone-ward'
  | 'death-ward'
  | 'zombie-ward'
  | 'poison-ward'
  | 'sleep-ward'
  | 'silence-ward'
  | 'dark-ward'
  | 'slow-ward'
  | 'confuse-ward'
  | 'berserk-ward'
  | 'curse-ward'
  /** Resistance 255 for Zombie, Petrify, Poison, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow, Doom. NOT Death, the four Breaks, Curse, Delay or Eject. */
  | 'ribbon'
  /** Ribbon's list plus Death, all four Breaks, Scan and the four Distillers. */
  | 'aeon-ribbon'
  // --- elemental weapon/armour --------------------------------------------
  /** Adds that element to every weapon-property attack (so it can be Nul'd, resisted or absorbed). */
  | 'firestrike'
  | 'icestrike'
  | 'lightningstrike'
  | 'waterstrike'
  /** Affinity for that element becomes `resist` (x0.5). */
  | 'fire-ward'
  | 'ice-ward'
  | 'lightning-ward'
  | 'water-ward'
  /** Affinity becomes `immune` (x0). */
  | 'fireproof'
  | 'iceproof'
  | 'lightningproof'
  | 'waterproof'
  /** Affinity becomes `absorb` (x-1) — but an active Nul of that element overrides and nullifies instead. */
  | 'fire-eater'
  | 'ice-eater'
  | 'lightning-eater'
  | 'water-eater'
  // --- overdrive / reward -------------------------------------------------
  /** Gauge gain x2. */
  | 'double-overdrive'
  /** Gauge gain x3. */
  | 'triple-overdrive'
  /** Gauge gain is converted to AP instead of filling the gauge; multiplies with Double/Triple Overdrive. */
  | 'overdrive-to-ap'
  | 'double-ap'
  | 'triple-ap'
  | 'no-ap'
  /** Fiends reduced to 0 HP are captured instead of killed. Inert in our five encounters. */
  | 'capture'
  /** Suppresses random encounters. Inert here — kept so equipment data can be transcribed verbatim. */
  | 'no-encounters'
  /** Doubles gil rewards. */
  | 'gillionaire'
  /** Field-only regeneration. Inert here. */
  | 'hp-stroll'
  | 'mp-stroll'
  /** Steal always gets the rare item. */
  | 'master-thief'
  /** Raises the rare-steal chance. */
  | 'pickpocket';

/**
 * A weapon or armour piece. FFX equipment grants **only** auto-abilities;
 * it never changes a stat [ffx-combat-core §9].
 */
export interface EquipmentDef {
  /** Display name, e.g. "Longsword of the Ronso". */
  name: string;
  /** Total ability slots, 1–4. `autoAbilities.length <= slots`. */
  slots: number;
  /** Filled slots, in display order. */
  autoAbilities: AutoAbilityId[];
  /** Weapon only: bonus critical rate added when the action has `adds-equipment-crit`. 0–100 percentage points. */
  bonusCrit?: number;
}

// ---------------------------------------------------------------------------
// 6. FFX combatant extension
// ---------------------------------------------------------------------------

/**
 * FFX Overdrive modes [ffx-combat-core §5.1]. All 17. Everyone starts on
 * `stoic`; switching modes does not disturb the current gauge value.
 * The increment column is documented per member.
 */
export type OverdriveModeId =
  /** Default. User takes damage from an enemy -> `damageReceived * 30 / maxHP` percent. */
  | 'stoic'
  /** User damages an enemy (not via items or Overdrives) -> `min(16, damageInflicted * 10 / estimatedDamage)` percent. */
  | 'warrior'
  /** An ally takes damage -> `damageReceived * 20 / target.maxHP` percent. Strongest mode against multi-target bosses. */
  | 'comrade'
  /** User restores an ally's HP (counts even at full HP) -> `healedAmount * 16 / target.maxHP` percent. */
  | 'healer'
  /** User inflicts a status ailment on an enemy -> 16%. */
  | 'tactician'
  /** An enemy inflicts a status ailment on the user -> 16%. */
  | 'victim'
  /** User evades an enemy attack -> 16%. */
  | 'dancer'
  /** An enemy KOs an ally -> 30%. */
  | 'avenger'
  /** User kills an enemy -> 20%. */
  | 'slayer'
  /** User kills an enemy with >= 10 000 HP, or >= 20x the estimated damage -> 20%. */
  | 'hero'
  /** User reduces or nullifies enemy damage via a Nul / Protect / Shell / Reflect -> 10%. */
  | 'rook'
  /** User is in the active party when the battle is won -> 20%. */
  | 'victor'
  /** User Escapes (a Flee by anyone also counts) -> 10%. */
  | 'coward'
  /** Start of the user's turn -> 3% (baseline; 4% in the original JP PS2). A field-grinding mode, not a boss mode. */
  | 'ally'
  /** Start of the user's turn while afflicted -> 16%. */
  | 'sufferer'
  /** Start of the user's turn while in Critical -> 5% (baseline; 16% in the original JP PS2). */
  | 'daredevil'
  /** Start of the user's turn while the sole surviving/active member -> 16%. */
  | 'loner';

/** Sphere Grid node state, per character [ffx-combat-core §10.1]. */
export interface SphereGridState {
  /** Node id in `src/data/ffx/sphere-grid/standard-grid.json` the character currently stands on. */
  position: string;
  /** Nodes this character has activated. Activation is per-character; lock removal is global. */
  activatedNodeIds: string[];
  /**
   * Current Sphere Level (movement currency). One S.Lv = one node onto an
   * unconnected node; backtracking along an already-travelled path costs one
   * S.Lv per four nodes. Range 0–255 in practice.
   */
  sLv: number;
  /** Accumulated AP toward the next S.Lv. `apForLevel(sLv) = min(5*(sLv+1) + floor(sLv^3/50), 22000)`. */
  ap: number;
  /** Owned spheres by id (`power-sphere`, `lv-1-key-sphere`, ...) -> count, 0–99. */
  spheres: Record<string, number>;
}

/** Steal / bribe / drop entry. */
export interface ItemDrop {
  itemId: ItemId;
  /** How many of the item. Range 1–99. */
  count: number;
  /** Drop chance as a percentage, 0–100. Omit for a guaranteed entry. */
  chance?: number;
}

/** What an enemy yields when it dies [ffx-combat-core §12.2]. */
export interface EnemyRewards {
  /** AP on a normal kill. Range 0–15 000. */
  ap: number;
  /** AP on an overkill (damage in the killing blow >= `overkillThreshold`). */
  apOverkill: number;
  /** Gil. Range 0–99 999. Doubled by `gillionaire`. */
  gil: number;
  /** Damage in a single killing blow that counts as an overkill. */
  overkillThreshold: number;
  drops: ItemDrop[];
  /**
   * Steal table: `baseChance` is a percentage 0–100 that halves per successful steal (FFX).
   * `stealRate` (FFX-2 only, optional) is the published steal byte out of 255
   * (192 = 75.3 %); the FFX-2 engine rolls against it, or against `baseChance`
   * on the /255 scale when absent [ffx2-bahamut §1.6].
   */
  steal?: { baseChance: number; stealRate?: number; common: ItemDrop; rare: ItemDrop };
  /** FFX-2 only: the gil Pilfer Gil takes, once per enemy ("Stolen Gil"). Range 0–99 999. */
  stolenGil?: number;
  /** Bribe: gil >= `maxHP * 25` is a guaranteed success [ffx-combat-core §0 V12]. */
  bribe?: { item: ItemDrop; immune: boolean };
  /** EXP (FFX-2 only; FFX has no EXP). Range 0–99 999. */
  exp?: number;
}

/** One boss form. `formIndex` 0 is the starting form. */
export interface EnemyForm {
  /** Display name for this form, e.g. "Yunalesca" / "Yunalesca (serpent)". */
  name: string;
  spriteKey: SpriteKey;
  /** HP pool for this form. Yunalesca: 24 000 / 48 000 / 60 000 [ffx-yunalesca §2.2]. */
  hp: number;
  /** Per-form stat overrides. Yunalesca shares one record; BFA changes Strength 45 -> 50. */
  statOverrides?: Partial<StatBlock>;
  /** AI script id for this form; falls back to the enemy's own `aiScriptId`. */
  aiScriptId?: string;
  /** Music cue to swap to when this form is entered. */
  musicKey?: MusicKey;
  /**
   * Whether damage past this form's remaining HP carries into the next form.
   * Yunalesca ships `false` behind the `yunalesca.overflowCarries` flag
   * [ffx-yunalesca §2.2].
   */
  overflowCarries?: boolean;
}

/** Everything specific to an enemy combatant. */
export interface EnemyFields {
  /** Key into the AI script registry (`battle/ffx/ai` or `battle/ffx2/ai`). */
  aiScriptId: string;
  /** Index into {@link forms}. 0 when the enemy has a single form. */
  formIndex: number;
  /** All forms in order. Single-form enemies carry exactly one entry. */
  forms: EnemyForm[];
  rewards: EnemyRewards;
  /**
   * Threaten's own per-enemy, per-battle chance, a **percent that may exceed
   * 100** [ffx-combat-core §4.4]. Only a *success* decays it, by `x0.7` floored,
   * with a floor of 1. Default 100; Yunalesca is 25. `0` = immune.
   */
  threatenChance?: number;
  /** Poison tick as a percentage of the enemy's max HP, 0–100. Party members always use 25. */
  poisonTickPercent?: number;
  /**
   * Doom countdown, in the victim's own turns. Party default is 5.
   *
   * Read in **both** directions: the countdown this enemy's Doom puts on a
   * party member, and — when Doom is inflicted *on* this enemy — the countdown
   * it runs on, which overrides the ability's own `duration`. Yu Yevon's `3` is
   * the second reading: "a Candle of Life kills him in exactly 3 turns"
   * [ffx-bfa-yu-yevon §3.1, verified: 2 sources].
   */
  doomTurns?: number;
  /** Zanmato level 1–7; Yojimbo's Zanmato succeeds at or below the party's compatibility tier. */
  zanmatoLevel?: number;
  /** A part that revives on a CTB-tick timer instead of staying dead. See {@link EnemyDef.reviveRule}. */
  reviveRule?: PartReviveRule;
  /** FFX-2 only: enemy level, feeding step 1 of the X-2 damage flowchart. Range 1–99. */
  level?: number;
  /** FFX-2 only: ATB ticks the enemy waits after its gauge fills before choosing. 0 = acts immediately. */
  thinkingPeriod?: number;
}

/** See {@link EnemyDef.reviveRule}. */
export interface PartReviveRule {
  /** CTB ticks between the part reaching 0 HP and it standing again. */
  delayTicks: number;
  /** The floor its new maximum is built from; the killing blow's excess is added. */
  baseMaxHp: number;
}

/** Aeon-only fields, present when `side === 'aeon'`. */
export interface AeonFields {
  /** The summoner. Always Yuna in our chapters. */
  ownerId: CombatantId;
  /** Whether the Dismiss sub-command is offered. Grand-Summoned aeons still dismiss normally. */
  dismissable: boolean;
  /**
   * Temporary Grand Summon gauge, 0–100. **Kept separate from the stored
   * gauge** and consumed first, so that an aeon already at 100 can fire two
   * Overdrives back to back and dismissing before spending it restores the
   * stored value [ffx-combat-core §5.4]. `null` when not Grand Summoned.
   */
  temporaryOverdrive: number | null;
  /** Battles remaining before a KO'd aeon can be summoned again. `AEON_REVIVE_BATTLES` ships as 3 [ffx-combat-core §6.1]. */
  reviveCountdown?: number;
}

/**
 * An FFX fighter: party member, aeon or enemy. Fields not relevant to a side
 * are simply absent (a Malboro has no `equipment`, Yuna has no `enemy`).
 */
export interface FFXCombatant extends Combatant {
  /** Overdrive gauge state. Absent for enemies that never Overdrive. */
  overdrive?: {
    /** Current charge, **0–100 where one point = one percent** [ffx-combat-core §5.1]. Character Overdrives all cost 100. */
    gauge: number;
    mode: OverdriveModeId;
    /** Modes the player has unlocked and may pick in the prep menu. Everyone always has `stoic`. */
    unlockedModes?: OverdriveModeId[];
    /** Overdrive abilities this character may fire (Swordplay tiers, Bushido tiers, reel sets, Rages...). */
    unlockedOverdriveIds: AbilityId[];
    /**
     * Enemy gauges use the same 0–100 scale but fill from scripted events, not
     * modes: e.g. Braska's Final Aeon gains +20% per Yu Pagoda Power Wave and
     * +0–10% per turn [ffx-bfa-yu-yevon §1.6].
     */
    enemyGaugeRules?: string;
  };
  /** Ability ids this character may use, gated by the Sphere Grid. */
  learnedAbilityIds: AbilityId[];
  /** Equipped gear. Absent for aeons and enemies. */
  equipment?: {
    weapon: EquipmentDef;
    armor: EquipmentDef;
  };
  /** Sphere Grid position and inventory. Absent for aeons and enemies. */
  sphereGrid?: SphereGridState;
  /** Present only when `side === 'aeon'`. */
  aeon?: AeonFields;
  /** Present only when `side === 'enemy'`. */
  enemy?: EnemyFields;
}

// ---------------------------------------------------------------------------
// 7. FFX-2 combatant extension
// ---------------------------------------------------------------------------

/**
 * ATB gauge state [ffx2-combat-core §1.1–1.4].
 *
 * The decoded model: `ticks = floor(10000 * value / (agility + 1))`, consumed at
 * a fixed **3000 ticks/second** (x0.5 under Slow, x1.05 under Haste). We ship
 * the **bar-LENGTH reading**: Agility shortens the runway, the fill rate is
 * global. One drawn bar is `TICKS_PER_BAR` = 24 000 ticks = 8.00 s.
 */
export interface AtbState {
  /**
   * Accumulated ticks toward the current gauge. A command may only be issued
   * when `ticks >= required`. Range 0–99 840 (the internal 416% ceiling).
   */
  ticks: number;
  /** Ticks needed for this gauge entry: `floor(10000 * value / (agi + 1))`. */
  required: number;
  /** Convenience mirror of `min(1, ticks / required)` scaled to 0–100 for the HUD. */
  gauge: number;
  /** Set while the purple charge bar is running. */
  charging: {
    /** The command that is charging. Re-submitted verbatim when the charge completes. */
    commandRef: Command;
    /** CTIM ticks left. Delay shortens it; **CTIM cannot be cancelled by Delay**, only by `action-cancel`. */
    remainingTicks: number;
    /** Total CTIM ticks, for drawing the bar. */
    totalTicks: number;
  } | null;
  /**
   * Recovery ticks owed after execution before the ATB starts refilling again.
   * `recoveryValue` 70 is the untagged baseline, 140 for `2xRT`.
   */
  recovery: number;
}

/** Garment Grid gate colours [ffx2-combat-core §4.1]. */
export type GateColour = 'red' | 'green' | 'blue' | 'yellow';

/** A girl's live Garment Grid state. */
export interface GarmentGridState {
  /** Grid id from `data/ffx2/garment-grids`. */
  id: string;
  /** Index of the node she currently occupies, 0-based into the grid's node list (2–6 nodes). */
  nodePosition: number;
  /** Gates passed through **this battle**. Gate effects are lost at the end of battle but survive KO and revival. */
  passedGates: GateColour[];
  /** Dressphere ids she has worn this battle — the Special Dress Up unlock requires all of them. */
  wornThisBattle: string[];
}

/** AP progress toward one dressphere's abilities. */
export interface DressphereProgress {
  /** Ability ids already learned in this dressphere. */
  learned: AbilityId[];
  /** AP banked toward the next ability. Range 0–2 249 (Alchemist's full mastery cost). */
  ap: number;
}

/** Special dressphere (SDSP) three-part state [ffx2-combat-core §3.15]. */
export interface SpecialDressphereState {
  /** Which SDSP is active. */
  id: 'floral-fallal' | 'machina-maw' | 'full-throttle';
  /**
   * The three independently-commanded parts. `main` is the body; the two pods
   * are the satellites. Only `main`'s stats scale with the Garment Grid's node
   * count (2–6 nodes: more nodes = stronger main unit).
   */
  parts: { main: CombatantId; podLeft: CombatantId; podRight: CombatantId };
  /** Node count of the Garment Grid she transformed from, 2–6. Drives main-part stat scaling. */
  gridNodeCount: number;
}

/** An FFX-2 fighter: Yuna, Rikku, Paine, an SDSP part, or an enemy/part. */
export interface FFX2Combatant extends Combatant {
  /** Character level. Stats are a function of (dressphere x level) only. Range 1–99. */
  level: number;
  /** Dressphere state. Absent for enemies. */
  dresspheres?: {
    /** Dressphere id currently worn. */
    current: string;
    /** Every dressphere she owns (selectable in the prep menu). */
    owned: string[];
    garmentGrid: GarmentGridState;
    /** Per-dressphere ability + AP progress. */
    abilitiesLearned: Record<string, DressphereProgress>;
    /** Set while transformed into a special dressphere. */
    special?: SpecialDressphereState;
  };
  atb: AtbState;
  /** Two accessory slots, hard limit. **All accessories stop working while in an SDSP.** */
  accessories: string[];
  /** Current chain count on this combatant as a *target*, 0–99. Multiplier is `1.40 + 0.05 * chain`. */
  chainCount: number;
  /** Ticks until the chain window on this target expires. 2 s normally, 3 s after a critical hit. */
  chainWindowTicks: number;
  /** Present only when `side === 'enemy'`. */
  enemy?: EnemyFields;
}

/** Either engine's combatant. Presentation code accepts this. */
export type AnyCombatant = FFXCombatant | FFX2Combatant;

// ---------------------------------------------------------------------------
// 8. Abilities and items
// ---------------------------------------------------------------------------

/**
 * Damage families, the closed set of `DamageFormula` cases
 * [ffx-combat-core §2.2, §2.7, §12.1] plus X-2's two extra shapes
 * [ffx2-combat-core §2.3].
 *
 * These are **decompile-faithful names**, which is what the data agents are
 * transcribing. Informal names used in early planning map as:
 * `physical` -> `strength`, `magical` -> `magic`, `special-fixed` -> `fixed` or
 * `fixed-no-variance`, `percent-hp` -> `percent-total` / `percent-current`,
 * `heal` -> `healing`, `demi` -> `percent-current`,
 * `overdrive-multiplied` -> `strength` with `damageType: 'other'` plus the §5.2
 * timing bonus. `drain`, `osmose`, `absorb`, `lancet`, `death` and
 * `zombie-heal-inverse` are **not** formulas: they are {@link ActionFlag}s
 * (`drains`, `drains-mp`) and status applications layered on `magic`.
 */
export type FormulaKey =
  /** POWER = `(str^3 // 32) + 30`, then `x DmgCon / 16`. Offensive stat: STR + Cheer stacks. */
  | 'strength'
  /** As `strength` but Defense is treated as 0. */
  | 'piercing-strength'
  /** POWER = `(mag^2 // 6 + DmgCon) * DmgCon // 4`. Offensive stat: MAG + Focus stacks. */
  | 'magic'
  /** As `magic` but Magic Defense is treated as 0. */
  | 'piercing-magic'
  /** POWER = `(mag^3 // 32) + 30`, then `x DmgCon / 16`; MDef is **always** 0. All aeon Overdrives, Fire Breath, Aqua Breath, Nova, Anima's Pain. */
  | 'special-magic'
  /** POWER = `((mag + DmgCon) // 2) * DmgCon`, MITIGATION 730. Target Focus stacks REDUCE healing received. */
  | 'healing'
  /** `DmgCon * 50 * (rng + 240) // 256`. */
  | 'fixed'
  /** `DmgCon * 50`, no variance. Most healing items. */
  | 'fixed-no-variance'
  /** `targetMaxHP * DmgCon // 16` (or max MP for the MP pool). X-Potion, Phoenix Down, Absorb-type enemy moves. */
  | 'percent-total'
  /** `targetCurrentHP * DmgCon // 16`. Demi (DmgCon 4 = 25%), Nega Burst, Black Hole. */
  | 'percent-current'
  /** `userMaxHP * DmgCon // 10`. Kimahri's Self-Destruct (DmgCon 30 = 3x his max HP). */
  | 'user-max-hp'
  /** `targetCTB * DmgCon // 16`, applied to the CTB pool. Haste (base 8 + `heals`), Slow (base 16). */
  | 'ctb'
  /** `gilSpent // 10`. Spare Change. */
  | 'gil'
  /** `9999 * DmgCon`. Sunburst (DmgCon 2 -> 19 998). */
  | 'deal-9999'
  /** Lancet: drains **both** HP and MP pools, damage type `other`, ignores Armored. */
  | 'lancet'
  /** FFX-2: `n/16` of the target's max HP or MP, ignoring Level/Str/Mag entirely. Every Bulwark attack. */
  | 'fractional'
  /** FFX-2 "Multiple"-type abilities [ffx2-combat-core §2.3]. */
  | 'multiple'
  /** No damage at all: pure status, buff, cleanse, summon, spherechange or flavour. */
  | 'none';

/** Physical / magical / other. Step 5, 6, 8 and 9 modifiers key off this. */
export type DamageType =
  /** Halved by Protect and Defend; boosted by Berserk and Strength+%; halved by Power Break. */
  | 'physical'
  /** Halved by Shell; boosted by Magic Booster and Magic+%; halved by Magic Break. */
  | 'magical'
  /**
   * Neither. **Every character Overdrive and every Mix is `other`**, so they
   * ignore Protect, Shell, Strength+%, Magic+%, Power Break and Magic Break
   * entirely [ffx-combat-core §2.4].
   */
  | 'other';

/**
 * The closed `ActionFlag` set [ffx-combat-core §12.3].
 * **Any flag not on this list is not a flag** — add it here first, with a note
 * in `docs/CONTRACT-CHANGES.md`.
 */
export type ActionFlag =
  /** Bypasses the target's Armored property. Does NOT bypass Defense. */
  | 'ignores-armored'
  /** Damage cap is 99 999 regardless of equipment. Mega Flare, Oblivion, Sunburst, Final Elixir, Dark Matter. */
  | 'always-break-damage-limit'
  /** Damage cap forced to 9 999 even with Break Damage Limit. All items, Spare Change, Mega Phoenix/Elixir/Megalixir mixes. */
  | 'never-break-damage-limit'
  /** Fails on a living target. Note: a living **Zombie** is still processed and killed. */
  | 'misses-if-target-alive'
  /** May be selected on a KO'd actor. */
  | 'can-target-dead'
  /** Damage dealt is added to the user's HP. */
  | 'drains'
  /** As `drains`, against MP. */
  | 'drains-mp'
  /** Sign of the computed amount is inverted — it restores rather than damages. On `ctb` this *reduces* the target's counter. */
  | 'heals'
  /** Carries a removal list (`removesStatuses`) rather than an application list. */
  | 'removes-statuses'
  /** The user's weapon bonus crit is added to this action's crit chance. */
  | 'adds-equipment-crit'
  /** May roll a critical hit at all. Never true for Slots. */
  | 'crit-eligible'
  /** Picks up weapon elements and status-strikes. */
  | 'inherits-weapon-properties'
  /** Resolving as a counterattack: `ctb = 0`, costs no turn. */
  | 'is-counter'
  /** Bounces off Reflect. Most Blk/Wht Magic; **not** Fury, **not** Ultima, **not** party-wide spells. */
  | 'reflectable'
  /** Accuracy penalised by Darkness. */
  | 'affected-by-darkness'
  /** Uses Defense 0 against Armored targets. Aeon weapons except Valefor. */
  | 'piercing'
  /** `target.ctb += floor(target.baseCTB * 3 / 2)`. */
  | 'weak-delay'
  /** `target.ctb += target.baseCTB * 3`. */
  | 'strong-delay'
  /** Can shatter a Petrified target; carries its own `shatterChance`. */
  | 'shatter'
  /** The user is removed from battle after resolving (Self-Destruct). */
  | 'destroys-user'
  /** FFX-2: fires from the starting position with no run-in, so it never breaks a chain by approach time. */
  | 'long-range'
  /** FFX-2: charge time — the purple bar runs before the ability fires. */
  | 'ct'
  /** FFX-2: recovery window after execution. */
  | 'rt'
  /** FFX-2: double-length recovery. Trigger Happy, Sentinel, every Songstress Dance. */
  | '2xrt';

/** Who an ability can hit. */
export type Targeting =
  | 'single-enemy'
  | 'single-ally'
  /** Either side, one target (Lancet on an ally is not legal, but e.g. Scan is). */
  | 'single-any'
  | 'all-enemies'
  | 'all-allies'
  | 'self'
  /** Picks a fresh random enemy per hit (Slice & Dice, every Fury, Firestorm). */
  | 'random-enemy'
  /** Picks a fresh random ally per hit (Elixir mix, NulAll). */
  | 'random-ally'
  /** Everyone on the field, both sides. */
  | 'all';

/** The command category an ability lives under in the menu. */
export type AbilityCategory =
  | 'attack'
  /** FFX character Skills (Tidus/Auron/Wakka/Rikku "Special" lists) and X-2 skillsets. */
  | 'skill'
  /** FFX "Special" commands: Cheer, Focus, Aim, Reflex, Luck, Jinx, Pray, Guard, Sentinel, Steal, Use... */
  | 'special'
  | 'blackmagic'
  | 'whitemagic'
  | 'summon'
  /** A character Overdrive (Swordplay, Bushido, Slots, Fury, Ronso Rage, Mix, Grand Summon). */
  | 'overdrive'
  /** An aeon's own command: Attack, its special, Shield, Boost, Dismiss, its Overdrive. */
  | 'aeon'
  | 'item'
  /** An X-2 dressphere command set entry. */
  | 'dressphere'
  /** An enemy-only action, including scripted no-damage flavour turns. */
  | 'enemy';

/** One status this ability tries to apply. */
export interface StatusApplication {
  status: StatusId;
  /**
   * **Raw 0–255 byte, not a percentage** [ffx-combat-core §12.1].
   * `254` = always, unless the target is immune. `255` = ignores resistance
   * entirely. Otherwise the roll is `(chance - resistance) > (rng % 101)`.
   */
  chance: number;
  /**
   * Duration in the victim's own turns. `254` = until end of battle.
   * `255` = permanent / undispellable. FFX-2 abilities put their integer
   * `durationValue` here instead (seconds = `value * 0.53` at Normal speed).
   */
  duration: number;
  /** Stack level to apply, for the stacking buffs and X-2 Up/Down statuses. Range 0–10. */
  stacks?: number;
}

/**
 * One action record — the unit of everything a combatant can do.
 *
 * Numbers come from `research/*.md`; data files MUST cite the section in a
 * comment. `power` is the "DmgCon" / "base power" / "damage constant" column
 * that the research uses under three different names [ffx-combat-core §12.5].
 */
export interface AbilityDef {
  id: AbilityId;
  /** Display name exactly as the battle banner prints it. Title case, no punctuation. */
  name: string;
  game: GameId;
  category: AbilityCategory;
  /** MP cost before Half MP Cost / One MP Cost / Magic Booster. Range 0–999. */
  mpCost: number;
  /**
   * FFX CTB rank, **1–10** [ffx-combat-core §1.3]. Recovery is linear in rank:
   * `recovery = baseCTB(agility) * rank`. A raw rank byte of 0 falls back to 3.
   * Undefined for X-2 abilities.
   */
  rank?: number;
  /**
   * FFX-2 charge value. `chargeTicks = floor(10000 * chargeValue / (agi + 1))`.
   * Tiers: 0 instant, 16 short, 26 medium, 39 long [ffx2-combat-core §1.3].
   */
  chargeTicks?: number;
  /**
   * FFX-2 recovery value. 70 = untagged baseline, 140 = `2xRT`
   * [ffx2-combat-core §1.4].
   */
  recoveryTicks?: number;
  /**
   * DmgCon / base power / damage constant. Meaning depends on {@link formula}:
   * for `strength`/`special-magic` it is the `x DmgCon/16` multiplier
   * (Attack = 16); for `fixed` it is `x50` damage; for `percent-*` it is
   * sixteenths. Range 0–255.
   */
  power: number;
  formula: FormulaKey;
  damageType: DamageType;
  /** Elements carried. `[]` or `['none']` for non-elemental. */
  element: ElementId[];
  targeting: Targeting;
  /** Number of hits. 1 for single-hit. Anima's Oblivion is 16; Attack Reels is 0–12. Range 0–16. */
  hits: number;
  /** Statuses this action tries to apply. */
  statusEffects: StatusApplication[];
  /** Statuses this action removes. Requires the `removes-statuses` flag. */
  removesStatuses: StatusId[];
  flags: ActionFlag[];
  /** Shatter chance against a Petrified target, 0–100. Only meaningful with the `shatter` flag. */
  shatterChance?: number;
  /**
   * Action-owned accuracy byte, used by the `USE_ACTION_ACCURACY` branch.
   * **Every enemy action uses this**; enemy Accuracy stats are never read
   * [ffx-combat-core §2.11]. Range 0–255. Undefined means "use the hit table".
   */
  accuracy?: number;
  /** Bonus critical chance in percentage points, 0–100. Used when the action lacks `adds-equipment-crit`. */
  bonusCrit?: number;
  /** Convenience mirror of the `always-break-damage-limit` flag for UI copy. */
  breaksDamageLimit?: boolean;
  /** Convenience mirror of `piercing` / `piercing-strength` for tooltip copy. */
  ignoresDefense?: boolean;
  /** Convenience mirror of `reflectable`. */
  canReflect?: boolean;
  /** False for actions with the ALWAYS hit formula. Defaults to true. */
  canMiss?: boolean;
  /** Presentation: which animation the presenter plays. */
  animationKey?: string;
  sfxKey?: SfxKey;
  /**
   * Battle-banner template. `{user}`, `{target}`, `{ability}`, `{amount}` are
   * substituted. House style is `"<Enemy> uses <Ability>"` — no period, no
   * adverbs, no exclamation marks [writing-bible §5.1].
   */
  messageTemplate?: string;
  /** Which timed-input overlay this ability opens, if any. `null`/absent = no minigame. */
  minigame?: MinigameKind | null;
  /**
   * Escape hatch for one-off scripted rules that do not deserve a schema field:
   * Mega Death's "kills everything not Zombie", Jecht Beam's petrify-and-then
   * behaviour, Mortiorchis's Mortibsorption HP transfer, the Vegnagun head's
   * real-time fail timer. Keys are documented in the data file that sets them.
   */
  extra?: Record<string, unknown>;
}

/** A consumable. */
export interface ItemDef {
  id: ItemId;
  name: string;
  game: GameId;
  /**
   * What using the item does. Either the id of an {@link AbilityDef} in the
   * ability registry, or an inline definition for one-off item effects.
   */
  effect: AbilityId | AbilityDef;
  targeting: Targeting;
  /** Selectable from the battle Item / Use menu. */
  usableInBattle: boolean;
  /** Selectable from the prep-menu Item screen. */
  usableInMenu: boolean;
  /** Shop price in gil, 0–999 999. 0 for items that are never sold. */
  price: number;
  /** Icon key for the item list. */
  iconKey?: string;
  /** One-line description for the help window. */
  description?: string;
}

// ---------------------------------------------------------------------------
// 9. Commands
// ---------------------------------------------------------------------------

/** Every timed-input overlay in the project. */
export type MinigameKind =
  /** Tidus — Swordplay. Moving cursor, gold zone, count-down timer [ffx-combat-core §5.3]. */
  | 'tidus-timing'
  /** Auron — Bushido. Button sequence against a 4 000 ms budget [ffx-combat-core §5.5]. */
  | 'auron-sequence'
  /** Wakka — Slots. Three reels, 20 000 ms, player-controlled [ffx-combat-core §5.6]. */
  | 'wakka-reels'
  /** Lulu — Fury. Stick rotations; casts = `min(16, sweptDegrees / degreesPerCast)` [ffx-combat-core §5.7]. */
  | 'lulu-fury'
  /** Rikku — Mix. Two-ingredient picker [ffx-combat-core §5.9]. */
  | 'rikku-mix'
  /** Kimahri — Ronso Rage. No timed input; a picker only [ffx-combat-core §5.8]. */
  | 'kimahri-rage'
  /** Yuna — Grand Summon. Aeon picker. */
  | 'yuna-grand-summon'
  /** X-2 Gunner — Trigger Happy. Mash meter, one hit per press [ffx2-combat-core §3.1]. */
  | 'gunner-trigger'
  /** X-2 Lady Luck — the reels [ffx2-combat-core §3.12]. */
  | 'ladyluck-reels';

/** Result payload for `tidus-timing`. */
export interface TimingResult {
  /** True when the player stopped the marker inside the gold zone before the timer expired. */
  success: boolean;
  /**
   * Milliseconds left on the count-down timer when the input landed.
   * Feeds the §5.2 bonus: `damage += damage * timeRemaining // (timerMs * 2)`.
   * Range 0–`timerMs`.
   */
  timeRemainingMs: number;
  /** The timer length this Overdrive used, 2 200–3 000 ms. */
  timerMs: number;
}

/** Result payload for `auron-sequence`. */
export interface SequenceResult {
  /** True when the whole sequence was entered before the 4 000 ms budget expired. */
  success: boolean;
  /** How many of the sequence's inputs landed. Range 0–8. */
  correctInputs: number;
  /** `4000 - msElapsedWhenLastInputLanded`. Range 0–4 000. */
  timeRemainingMs: number;
  /** Set when the target is immune to the Overdrive's rider status, selecting the higher-DmgCon "immune" row. Tornado is always true (it has no rider). */
  targetImmuneToRider?: boolean;
}

/** Result payload for `wakka-reels` and `ladyluck-reels`. */
export interface ReelResult {
  /**
   * The three stopped symbols, left to right. Element Reels:
   * `'fire'|'ice'|'water'|'thunder'`. Attack Reels: `'1hit'|'2hit'|'miss'`.
   * Status Reels: `'skull'|'arrow'|'timer'`. Aurochs Reels adds `'aurochs'`.
   */
  symbols: [string, string, string];
  /** True when all three match — the effect hits every enemy instead of one random enemy. */
  threeOfAKind: boolean;
  /** Attack Reels only: `sum(symbols)`, doubled on a three-match. Range 0–12. */
  hits?: number;
  /** Milliseconds left on the 20 000 ms timer. */
  timeRemainingMs: number;
}

/** Result payload for `lulu-fury`. */
export interface FuryResult {
  /** Total angle swept by the stick, in degrees. Range 0–20 000. */
  sweptDegrees: number;
  /** `min(16, floor(sweptDegrees / degreesPerCast(spell, lulu.magic)))`. Range 0–16. */
  casts: number;
}

/** Result payload for `rikku-mix`. */
export interface MixResult {
  /** The two consumed item ids. Order never matters. */
  ingredients: [ItemId, ItemId];
  /** The resolved mix ability id, or `null` when the pair has no recipe ("Mix failed!"). */
  resultAbilityId: AbilityId | null;
}

/** Result payload for `kimahri-rage`. */
export interface RageResult {
  /** Which Ronso Rage was picked. */
  rageId: AbilityId;
}

/** Result payload for `gunner-trigger`. */
export interface TriggerHappyResult {
  /** One hit per R1 press within the window. Range 0–16. Each hit self-chains. */
  hits: number;
}

/** Result payload for `yuna-grand-summon`. */
export interface GrandSummonResult {
  /** Which owned aeon to summon with a temporary full gauge. */
  aeonId: string;
}

/** The typed `extra` payload for each minigame. */
export type MinigameResult =
  | { kind: 'tidus-timing'; timing: TimingResult }
  | { kind: 'auron-sequence'; sequence: SequenceResult }
  | { kind: 'wakka-reels'; reels: ReelResult }
  | { kind: 'ladyluck-reels'; reels: ReelResult }
  | { kind: 'lulu-fury'; fury: FuryResult }
  | { kind: 'rikku-mix'; mix: MixResult }
  | { kind: 'kimahri-rage'; rage: RageResult }
  | { kind: 'gunner-trigger'; trigger: TriggerHappyResult }
  | { kind: 'yuna-grand-summon'; grandSummon: GrandSummonResult };

/** Basic attack. Rank 3, uses weapon properties, affected by Darkness. */
export interface AttackCommand {
  kind: 'attack';
  targets: CombatantId[];
}

/** Any ability from any menu, including aeon sub-commands and enemy actions. */
export interface AbilityCommand {
  kind: 'ability';
  id: AbilityId;
  targets: CombatantId[];
  /** Doublecast / Copycat wrapper: the ability id this one is repeating. */
  wrappedId?: AbilityId;
}

/** Use an item from the Item (or Use) menu. */
export interface ItemCommand {
  kind: 'item';
  id: ItemId;
  targets: CombatantId[];
  /** Spare Change only: gil thrown. Damage is `gil // 10`, hard-capped at 9 999. */
  gilSpent?: number;
}

/**
 * Fire a full Overdrive. `extra` carries the minigame outcome; when the UI
 * cannot run a minigame (AI, auto-battle, deterministic tests) it is omitted
 * and the engine rolls a default outcome from the seeded RNG.
 */
export interface OverdriveCommand {
  kind: 'overdrive';
  id: AbilityId;
  targets: CombatantId[];
  extra?: MinigameResult;
}

/** Yuna summons an aeon. Rank 3. Replaces the whole active party. */
export interface SummonCommand {
  kind: 'summon';
  /** Aeon id from `data/ffx/ids`. */
  id: string;
  targets: [];
}

/** Return the party; the aeon leaves with its HP/MP/statuses intact. */
export interface DismissCommand {
  kind: 'dismiss';
  targets: [];
}

/**
 * Swap an active party member for a reserve one. Rank 3, but the incoming
 * member **takes the turn that is happening right now** — the turn is not
 * consumed by the swap [ffx-combat-core §1.7].
 */
export interface SwitchCommand {
  kind: 'switch';
  targets: [];
  extra: {
    /** Active member leaving the field. */
    outId: CombatantId;
    /** Reserve member coming in. */
    inId: CombatantId;
  };
}

/**
 * FFX-2 L1 spherechange. Consumes the whole turn; the ATB refills from empty.
 * Only to a dressphere **one link away** from the current node; gates on that
 * link are passed through, not stepped on.
 */
export interface SpherechangeCommand {
  kind: 'spherechange';
  targets: [];
  extra: {
    /** Dressphere id being changed into. */
    toDressphere: string;
    /** Target node index on the equipped Garment Grid, 0-based. */
    toNode: number;
    /** Gates crossed on the way, in order. Their effects apply for the rest of the battle. */
    gatesCrossed: GateColour[];
    /** True for R1 Special Dress Up (SDSP), which requires every node occupied and every dressphere worn this battle. */
    specialDressUp?: boolean;
  };
}

/** FFX Escape (one character, 74.6%) or Flee (Tidus's skill, whole party, always succeeds). */
export interface EscapeCommand {
  kind: 'escape';
  targets: [];
  /** `'single'` = Escape (row 3, rank 1). `'party'` = Flee (row 24, rank 2). */
  extra?: { mode: 'single' | 'party' };
}

/** Halve physical damage taken until the user's next turn. */
export interface DefendCommand {
  kind: 'defend';
  targets: [];
}

/**
 * The scripted **Talk** trigger command. Seymour Flux: pre-battle, Kimahri
 * +10 STR / Yuna +10 MDEF. Braska's Final Aeon: resets his Overdrive gauge on
 * his next turn, which he then loses; usable twice, offered a useless third
 * time [visual-bible §3.12].
 */
export interface TriggerCommand {
  kind: 'trigger';
  /** Trigger id, e.g. `'talk'`. */
  id: string;
  targets: CombatantId[];
}

/** Everything a combatant can submit on its turn. */
export type Command =
  | AttackCommand
  | AbilityCommand
  | ItemCommand
  | OverdriveCommand
  | SummonCommand
  | DismissCommand
  | SwitchCommand
  | SpherechangeCommand
  | EscapeCommand
  | DefendCommand
  | TriggerCommand;

/** Command kinds, for exhaustive switches. */
export type CommandKind = Command['kind'];

/** One row the command UI may offer, with its legal targets already resolved. */
export interface AvailableCommand {
  /** A partially-filled command; the UI fills `targets` from {@link validTargets}. */
  command: Command;
  /** Menu label, e.g. "Attack", "Firaga", "Mix". */
  label: string;
  /** Which submenu it lives in. */
  category: AbilityCategory;
  /** MP cost after Half MP Cost / One MP Cost / Magic Booster. */
  mpCost: number;
  /** FFX: the rank to preview in the CTB list when this row is highlighted. */
  rank?: number;
  /** Greyed out when false; `disabledReason` says why. */
  enabled: boolean;
  /** Short reason, e.g. "Silenced", "Not enough MP", "No Overdrive". */
  disabledReason?: string;
  /** Combatant ids this command may legally target. Empty for self/no-target commands. */
  validTargets: CombatantId[];
  /**
   * Who this command hits, as the ability itself declares it.
   *
   * Additive, and the UI is the only consumer: `validTargets` already carries
   * legality and nothing about resolution changes. It exists because the menu
   * could not otherwise tell "pick one of these three allies" from "this hits
   * all three" — both arrive as three `validTargets` and an empty
   * `command.targets` — so Hastega asked the player to choose one party member
   * and then (correctly, in the engine) buffed all three. That is the defect in
   * Bailey's Chapter 3 frame: the only cue was a hairline bracket over two of
   * the three, and nothing said the cast was party-wide.
   *
   * Optional (hand-built rows, fixtures): absent means "choose one", as before.
   */
  targeting?: Targeting;
  /** Where the single-target cursor opens: the subset of `validTargets` on the sensible side (enemy for attacks and debuffs, party for cures and buffs, KO'd first for revives; `battle/common/aim.ts`, both games). Set only when it narrows the list; absent = the leftmost valid target, as before. */
  preferredTargets?: CombatantId[];
  /** True when choosing this row opens a minigame overlay before the command resolves. */
  opensMinigame?: MinigameKind;
  /**
   * A **wrapper** row: choosing it opens the rows of this category as a second
   * step, and the command submitted is this row's own, with the chosen row's
   * id as `AbilityCommand.wrappedId` and the chosen row's target step supplying
   * `targets`. FFX's Doublecast is the one shipped case (`'blackmagic'`:
   * "Two Blk Magic casts", ffx-combat-core §7.4 row 41).
   *
   * Additive and optional; only the FFX engine sets it. Without it the menu
   * took the row's self-only `validTargets` as the aim and submitted
   * Doublecast at its own caster (critic round 09, PR-0125).
   */
  wrapsCategory?: AbilityCategory;
  /** Help-window copy. */
  help?: string;
}

// ---------------------------------------------------------------------------
// 10. Events
// ---------------------------------------------------------------------------

/** Classification for `message` events, so the presenter can style them. */
export type MessageKind =
  /** `"<Enemy> uses <Ability>"`. */
  | 'ability'
  /** `"<Target> is <Status>"` / `"<Status> wears off"`. */
  | 'status'
  /** `"Mortiorchis enters Auto-Attack Mode"` — the two-stage charge telegraph. */
  | 'telegraph'
  /** `"Stole Elixir!"`, `"Can't escape!"`, `"Mix failed!"`. */
  | 'system'
  /** A mid-battle story line, delivered by a script trigger. */
  | 'story';

/** Fields every event carries. */
interface BattleEventBase {
  /** Monotonic sequence number, unique and increasing for the whole battle. Never reused, never reordered. */
  seq: number;
}

/**
 * The ordered record of everything that happened.
 *
 * The engine returns these from {@link BattleEngine.submit} and from
 * `nextDecision()` in the `'resolved'` case; the presenter plays them with
 * timing and then asks for the next decision. Events are **pure data**: no
 * function values, no class instances, JSON-serialisable, so e2e tests can
 * snapshot them.
 */
export type BattleEvent =
  /** A combatant's turn begins. FFX also reports the tick clock so Regen can pay out. */
  | (BattleEventBase & {
      type: 'turn-start';
      actorId: CombatantId;
      /** Battle turn counter, 1-based. */
      turn: number;
      /** CTB ticks elapsed since the previous turn boundary. Feeds the Regen tick. */
      elapsedTicks: number;
    })
  /** A command has been chosen and is about to resolve. The presenter plays the wind-up here. */
  | (BattleEventBase & {
      type: 'action-start';
      actorId: CombatantId;
      command: Command;
      /** Resolved ability, for the banner. Absent for `switch` / `escape` / `defend`. */
      abilityId?: AbilityId;
      /** Display name for the banner. */
      abilityName?: string;
      targets: CombatantId[];
    })
  /** The command has finished resolving. */
  | (BattleEventBase & { type: 'action-end'; actorId: CombatantId })
  /**
   * HP change on a target. **There is no separate heal event for damage-formula
   * healing** — a `heals`-flagged action produces a `damage` event with a
   * negative `amount`; the dedicated `heal` event below exists for restoration
   * that never went through the damage chain (Regen ticks, Mortibsorption).
   */
  | (BattleEventBase & {
      type: 'damage';
      targetId: CombatantId;
      sourceId?: CombatantId;
      /** Signed HP delta applied to the target. Positive = damage, negative = healing. Range -99 999..99 999. */
      amount: number;
      element: ElementId;
      /** Affinity that was applied, so the presenter can print IMMUNE / ABSORBED. */
      affinity?: Affinity;
      crit: boolean;
      /** 0-based index within a multi-hit action; damage numbers stack on a rising diagonal. */
      hitIndex: number;
      /** Total hits in this action, for pacing. */
      hitCount: number;
      /** True when this blow killed the target and met the overkill threshold. */
      overkill?: boolean;
      /** True when the damage hit the 9 999 / 99 999 cap. */
      capped?: boolean;
    })
  /** Restoration that did not go through the damage chain. */
  | (BattleEventBase & {
      type: 'heal';
      targetId: CombatantId;
      sourceId?: CombatantId;
      /** HP restored, always positive. Range 0–99 999. */
      amount: number;
      /** What caused it, for the message bar: `'regen'`, `'auto-potion'`, `'mortibsorption'`, `'drain'`. */
      cause: string;
    })
  | (BattleEventBase & {
      type: 'miss';
      targetId: CombatantId;
      sourceId: CombatantId;
      /** `'evaded'` (hit roll failed), `'nullified'` (a Nul status consumed the attack), `'immune'`, `'wrong-state'` (e.g. Life on a living target). */
      reason: 'evaded' | 'nullified' | 'immune' | 'wrong-state';
    })
  | (BattleEventBase & {
      type: 'mp-damage';
      targetId: CombatantId;
      sourceId?: CombatantId;
      /** MP removed, positive. Range 0–9 999. */
      amount: number;
    })
  | (BattleEventBase & {
      type: 'mp-heal';
      targetId: CombatantId;
      sourceId?: CombatantId;
      /** MP restored, positive. Range 0–9 999. */
      amount: number;
    })
  | (BattleEventBase & {
      type: 'status-add';
      targetId: CombatantId;
      sourceId?: CombatantId;
      status: StatusId;
      instance: StatusInstance;
    })
  | (BattleEventBase & {
      type: 'status-remove';
      targetId: CombatantId;
      status: StatusId;
      /** `'expired'`, `'cured'`, `'dispelled'`, `'consumed'` (a Nul charge or Auto-Life), `'ko'`, `'overwritten'`. */
      reason: 'expired' | 'cured' | 'dispelled' | 'consumed' | 'ko' | 'overwritten';
    })
  /** A duration decremented, or a Doom counter ticked. The HUD updates the pip. */
  | (BattleEventBase & {
      type: 'status-tick';
      targetId: CombatantId;
      status: StatusId;
      /** Turns (FFX) or ticks (X-2) left after the decrement. */
      remaining: number;
    })
  | (BattleEventBase & { type: 'ko'; targetId: CombatantId; sourceId?: CombatantId })
  | (BattleEventBase & {
      type: 'revive';
      targetId: CombatantId;
      /** HP the target comes back with. Auto-Life = 25% of max. */
      hp: number;
      /** `'auto-life'`, `'phoenix-down'`, `'life'`, `'full-life'`, `'fayth'` (the permanent Auto-Life from the possessed-aeon fights onward). */
      cause: string;
    })
  | (BattleEventBase & {
      type: 'overdrive-gauge';
      who: CombatantId;
      /** Previous gauge value, 0–100. */
      from: number;
      /** New gauge value, 0–100. */
      to: number;
      /** Which mode or scripted rule paid out, for debugging. */
      cause?: string;
    })
  | (BattleEventBase & { type: 'message'; text: string; kind: MessageKind })
  /**
   * Sensor / Scan revealed an enemy. The HUD opens the info panel.
   *
   * The numeric payload is a **snapshot at reveal time** — it exists so the
   * panel can print numerals from the event alone, without reaching into
   * `state()`. Live values keep coming from `state().combatants[targetId]`,
   * which stays readable because the reveal also sets
   * {@link Combatant.revealed}. Every payload field is optional: an enemy the
   * fight keeps secret (`immune-to-sensor`, or `flags.hideHpBar`) is still
   * announced, just with no numbers — X-2's own "- - -" row.
   */
  | (BattleEventBase & {
      type: 'sensor';
      targetId: CombatantId;
      /** True for the fuller Scan panel, false for the one-line Sensor bar. */
      full: boolean;
      text: string;
      /** Current HP at reveal time. Omitted when the numerals stay secret. */
      hp?: number;
      /** Max HP at reveal time. Omitted when the numerals stay secret. */
      maxHp?: number;
      /** Current MP at reveal time. Omitted when the numerals stay secret. */
      mp?: number;
      /** Max MP at reveal time. Omitted when the numerals stay secret. */
      maxMp?: number;
      /** Elements the target takes extra damage from. Empty array = none, absent = not read. */
      weaknesses?: ElementId[];
    })
  | (BattleEventBase & { type: 'summon'; aeonId: string; combatantId: CombatantId; ownerId: CombatantId })
  | (BattleEventBase & {
      type: 'dismiss';
      combatantId: CombatantId;
      /** `'command'`, `'ko'`, `'banished'` (Seymour's Banish, which overrides Eject immunity and leaves the aeon KO'd). */
      reason: 'command' | 'ko' | 'banished';
    })
  | (BattleEventBase & { type: 'switch'; outId: CombatantId; inId: CombatantId })
  | (BattleEventBase & {
      type: 'form-change';
      enemyId: CombatantId;
      /** New {@link EnemyFields.formIndex}. */
      formIndex: number;
      /** New display name. */
      name: string;
      /** New sprite key, so the presenter can swap the actor. */
      spriteKey?: SpriteKey;
    })
  /** An auto-ability or enemy script fired a free action. */
  | (BattleEventBase & {
      type: 'counter';
      actorId: CombatantId;
      targetId: CombatantId;
      abilityId: AbilityId;
      /** `'counterattack'`, `'evade-and-counter'`, `'magic-counter'`, `'auto-potion'`, `'auto-phoenix'`, `'auto-med'`, `'script'`. */
      cause: string;
    })
  /** A boss telegraph. Drives the two-stage banner and the persistent CTB pip [visual-bible §3.13]. */
  | (BattleEventBase & {
      type: 'charge';
      enemyId: CombatantId;
      /** State text, e.g. `"Auto-Attack Mode"`, `"Ready to Annihilate"`. */
      name: string;
      /** Turns left before the payload lands. 0 = it fires now. */
      turnsLeft: number;
      /** 1 = charging (amber), 2 = imminent (red, screen border). */
      stage: 1 | 2;
    })
  | (BattleEventBase & {
      type: 'part-destroyed';
      partId: CombatantId;
      /** Parent enemy, e.g. `'vegnagun-body'` for a Bulwark. */
      ownerId?: CombatantId;
    })
  | (BattleEventBase & { type: 'part-restored'; partId: CombatantId; hp: number; ownerId?: CombatantId })
  /** A named hook the story runner listens for. Pauses playback while a mid-battle script plays. */
  | (BattleEventBase & { type: 'script-trigger'; name: string; payload?: Record<string, unknown> })
  | (BattleEventBase & {
      type: 'escape-attempt';
      actorId: CombatantId;
      success: boolean;
      /** True when the whole party left (Flee). */
      party: boolean;
    })
  | (BattleEventBase & { type: 'victory'; result: BattleResult })
  | (BattleEventBase & { type: 'defeat'; result: BattleResult })
  /** FFX-2 chain counter changed on one target. */
  | (BattleEventBase & {
      type: 'chain';
      targetId: CombatantId;
      /** Chain number, 0–99. 0 means the chain broke. */
      count: number;
      /** `1.40 + 0.05 * count`. Range 1.0–6.35. */
      multiplier: number;
    })
  /** FFX-2 gauge snapshot, emitted whenever the presenter should redraw the ATB bars. */
  | (BattleEventBase & { type: 'atb'; snapshot: AtbSnapshot })
  | (BattleEventBase & {
      type: 'spherechange';
      who: CombatantId;
      /** Dressphere id before the change. */
      from: string;
      /** Dressphere id after the change. */
      to: string;
      gatesCrossed: GateColour[];
      /** Set when this was a Special Dress Up. */
      special?: SpecialDressphereState['id'];
    })
  /**
   * Playback pauses here. The UI opens the named overlay, and the resolved
   * outcome comes back as {@link OverdriveCommand.extra} on the next
   * `submit()`. See "Minigame protocol" in `docs/CONTRACTS.md`.
   */
  | (BattleEventBase & {
      type: 'minigame-request';
      who: CombatantId;
      kind: MinigameKind;
      /** Overlay tuning: timer length, zone width, reel strip, available ingredients... */
      params: Record<string, unknown>;
    })
  /** Presentation cue: move the battle camera to a named rig. */
  | (BattleEventBase & { type: 'camera'; rig: CameraRigId; ms?: number })
  /** Presentation cue: play a VFX at a field position or on a combatant. */
  | (BattleEventBase & {
      type: 'vfx';
      key: VfxKey;
      /** Where to play it: a combatant id, or `'screen'` for a full-screen effect. */
      at: CombatantId | 'screen';
    })
  | (BattleEventBase & { type: 'sfx'; key: SfxKey })
  /** Presentation cue: hold for `ms` before playing the next event. */
  | (BattleEventBase & { type: 'wait'; ms: number });

/** Event type tags, for exhaustive switches. */
export type BattleEventType = BattleEvent['type'];

// ---------------------------------------------------------------------------
// 11. Turn order and ATB snapshots
// ---------------------------------------------------------------------------

/**
 * One row of the FFX CTB forecast [ffx-combat-core §1.6].
 *
 * The forecast **assumes every other actor will use a rank-3 action** — it is a
 * projection, not a promise. Hovering a command re-renders the list with that
 * command's rank applied to the current actor.
 */
export interface TurnPreview {
  actorId: CombatantId;
  /** Predicted CTB counter at that point. Lower acts sooner. */
  tickValue: number;
  /** Index in the forecast, 0 = acting now. */
  index: number;
  /** Convenience mirrors for the HUD [visual-bible §3.2]. */
  isParty: boolean;
  /** `A`, `B`, `C` for numbered/lettered enemy icons. */
  letterTag?: string;
  portraitKey?: PortraitKey;
  /** Statuses to draw as pips on the icon, at most 3. */
  statusIcons: StatusId[];
  /** Draw the gold Overdrive diamond. */
  overdriveReady: boolean;
  /** Draw the charge pip: 1 = amber, 2 = red. */
  chargeStage?: 1 | 2;
}

/** FFX-2 ATB bars, everything the HUD needs in one object [visual-bible §4.3]. */
export interface AtbSnapshot {
  /** Battle clock in milliseconds since battle start. */
  elapsedMs: number;
  bars: Array<{
    actorId: CombatantId;
    /** Fill fraction, 0–1. Values above 1 exist internally (up to 4.16) and are not drawn. */
    fill: number;
    /** Ticks required for a full bar, so the HUD can draw a shorter runway for a faster character. */
    required: number;
    /** True when a command may be issued. */
    ready: boolean;
    /** Charge (purple bar) fraction, 0–1, or `null` when not charging. */
    charge: number | null;
    /** Bar colour hint: green normal, red hasted, gold slowed, white stopped. */
    state: 'normal' | 'haste' | 'slow' | 'stop';
  }>;
}

// ---------------------------------------------------------------------------
// 12. Mid-battle triggers
// ---------------------------------------------------------------------------

/** Id of a script registered in `src/story/scripts/`. */
export type StoryScriptRef = string;

/** The condition that fires a {@link MidBattleTrigger}. */
export type TriggerCondition =
  /** `who`'s HP drops to or below `fraction` of max. `fraction` is 0–1. */
  | { type: 'hp-below'; who: CombatantId; fraction: number }
  /** `who` entered form index `form`. */
  | { type: 'form-change'; who: CombatantId; form: number }
  /** `status` landed on `who`. */
  | { type: 'status-applied'; who: CombatantId; status: StatusId }
  /** The battle turn counter reached `n` (1-based). */
  | { type: 'turn'; n: number }
  /** `who` used `ability`. */
  | { type: 'ability-used'; who: CombatantId; ability: AbilityId }
  /** `who` was KO'd, ejected or destroyed. */
  | { type: 'ko'; who: CombatantId }
  /** `who`'s Overdrive gauge reached 100. */
  | { type: 'overdrive'; who: CombatantId }
  /** Any enemy began a telegraphed charge; `who` narrows it to one enemy. */
  | { type: 'charge-started'; who?: CombatantId };

/**
 * A story beat wired to a battle state change.
 *
 * The engine evaluates every trigger after each resolved action and emits a
 * `script-trigger` event when one fires; the presenter pauses playback, runs
 * the referenced script, then resumes.
 */
export interface MidBattleTrigger {
  /** Unique within the chapter; also the `script-trigger` event's `name`. */
  id: string;
  when: TriggerCondition;
  /** When true the trigger is disarmed after firing once. Almost always true. */
  once: boolean;
  /** Script to play. */
  script: StoryScriptRef;
}

// ---------------------------------------------------------------------------
// 13. Results
// ---------------------------------------------------------------------------

/** How a battle ended and what it paid out. */
export interface BattleResult {
  outcome: 'victory' | 'defeat' | 'escape';
  /** Turns taken, 1-based count of `turn-start` events. */
  turns: number;
  /** FFX: total CTB ticks elapsed. FFX-2: total ATB ticks (3000 = 1 s). */
  elapsedTicks: number;
  /** Wall-clock battle length in milliseconds, for the best-time record in `SaveData`. */
  elapsedMs: number;
  /** Total AP awarded (FFX) — split per member by `sphereLevelsGained`'s owner keys. */
  ap: number;
  /** Total EXP awarded (FFX-2). 0 for FFX. */
  exp: number;
  gil: number;
  drops: ItemDrop[];
  /** Which enemies were overkilled, by combatant id. */
  overkilled: CombatantId[];
  /** Sphere Levels gained this battle, keyed by party member id (FFX only). */
  sphereLevelsGained: Record<CombatantId, number>;
  /** Levels gained this battle, keyed by member id (FFX-2 only). */
  levelsGained?: Record<CombatantId, number>;
  /**
   * Party member ids (FFX only) who completed at least one full turn this
   * battle, mapped to how many turns — present only for a completed turn, so
   * `Object.keys()` is the participation set. Deliberately **separate** from
   * {@link sphereLevelsGained}'s AP-eligibility rule, which also excludes
   * anyone KO'd or petrified at the end (`ffx-combat-core.md` §10.1): a
   * reserve member who switched in, fought and was KO'd before the battle
   * ended took real turns and must still get a results row (round 04
   * PR-0003, second pass) even though they earn no AP. `sphereLevelsGained`
   * alone cannot answer "did they act", only "do they earn AP".
   */
  turnsTaken?: Record<CombatantId, number>;
  /**
   * The formation that follows this one with no menu between, copied from
   * {@link EnemyGroupDef.nextGroupId} on a victory. Present only when this
   * battle was a link in a chain (Yunalesca's forms, the Vegnagun chain).
   *
   * The engine **never advances groups itself**: it reports this and stops. The
   * BattleScreen re-inits the engine for the next group with the party's
   * carried-over state and `BattleSetup.chained = true`, so no results screen
   * shows between links [docs/CONTRACT-CHANGES.md, orchestrator decision 6].
   */
  nextGroupId?: string;
}

// ---------------------------------------------------------------------------
// 14. RNG
// ---------------------------------------------------------------------------

/**
 * The only source of randomness either engine may use.
 *
 * Deterministic under a seed: the same seed and the same command sequence must
 * produce the same event stream, byte for byte. e2e tests and the critic depend
 * on it. Implementation: `src/battle/common/rng.ts`.
 */
export interface Rng {
  /** Uniform float in `[0, 1)`. */
  next(): number;
  /** Uniform integer in `[min, max]`, inclusive on both ends. */
  int(min: number, max: number): number;
  /** Uniform element of a non-empty array. Throws on an empty array. */
  pick<T>(items: readonly T[]): T;
  /** Re-seed in place. Any 32-bit integer. */
  seed(n: number): void;
  /** The seed currently in use. */
  readonly currentSeed: number;
}

// ---------------------------------------------------------------------------
// 15. Engine facade
// ---------------------------------------------------------------------------

/** What the engine wants next. */
export type Decision =
  /** A player-controlled actor's turn. The UI shows the command menu. */
  | {
      kind: 'player-input';
      actorId: CombatantId;
      commands: AvailableCommand[];
    }
  /** The engine resolved something on its own (an AI turn, a tick, a counter). Play the events, then ask again. */
  | { kind: 'resolved'; events: BattleEvent[] }
  /**
   * FFX-2 only: nobody is ready. Advance the clock with
   * {@link FFX2BattleEngine.tick} and ask again.
   */
  | {
      kind: 'waiting';
      /** Milliseconds until the next gauge fills, so the presenter can sleep efficiently. */
      nextEventMs: number;
    }
  /** The battle is over. Show the results screen. */
  | { kind: 'battle-over'; result: BattleResult };

/** Live battle state. Presentation reads it; only the engine writes it. */
export interface BattleState {
  game: GameId;
  /** Every combatant on or off the field, keyed by id. */
  combatants: Record<CombatantId, AnyCombatant>;
  /** Active party slots, left to right. Exactly 3 entries in both games. */
  activeIds: CombatantId[];
  /** Bench members (FFX only; X-2 has no reserve). */
  reserveIds: CombatantId[];
  /** Enemy ids in formation order. */
  enemyIds: CombatantId[];
  /** Summoned aeon, or `null`. While non-null, party CTB counters and status durations are frozen. */
  aeonId: CombatantId | null;
  /** Battle turn counter, 1-based; increments on each `turn-start`. */
  turn: number;
  /**
   * Tick clock. FFX: total CTB ticks elapsed (normalised after each action).
   * FFX-2: total ATB ticks, 3000 per second at the default speed.
   */
  ticks: number;
  /** Every event emitted so far, in order. `log[i].seq === i`. */
  log: BattleEvent[];
  /** Next `seq` to assign. */
  nextSeq: number;
  /** Mid-battle triggers registered for this encounter. */
  triggers: MidBattleTrigger[];
  /** Ids of triggers that have already fired (so `once` triggers stay disarmed). */
  firedTriggerIds: string[];
  /** Set once the battle ends. */
  result: BattleResult | null;
  /** Seed the engine was initialised with. */
  seed: number;
  /** Encounter-scoped flags an AI script or a story trigger can set and read. */
  flags: Record<string, number | string | boolean>;
}

/** Everything needed to start a battle. */
export interface BattleSetup {
  game: GameId;
  /** Party build for this chapter. */
  party: FFXPartyBuild | FFX2PartyBuild;
  enemies: EnemyGroupDef;
  /** Mid-battle story hooks. */
  triggers: MidBattleTrigger[];
  /** RNG seed. Fixed in tests and in the e2e gallery. */
  seed: number;
  /** Opening condition. Boss formations are always `'normal'` unless a script says otherwise. */
  condition?: 'normal' | 'preemptive' | 'ambush' | 'scripted';
  /** Escape and Flee are disabled when false. All five of our encounters ship `false`. */
  canEscape?: boolean;
  /**
   * This battle is a link in a chain (`EnemyGroupDef.nextGroupId`), not a fresh
   * encounter: no results screen shows between links and mid-chain story
   * scripts may play. The engine never advances groups itself — `victory`
   * carries `nextGroupId` and the BattleScreen re-inits with the party's
   * carried-over state [docs/CONTRACT-CHANGES.md, orchestrator decision 6].
   */
  chained?: boolean;
}

/**
 * The facade both engines implement.
 *
 * Playback protocol (see `docs/CONTRACTS.md` for the full walkthrough):
 * ```
 * engine.init(setup);
 * for (;;) {
 *   const d = engine.nextDecision();
 *   if (d.kind === 'battle-over') break;
 *   if (d.kind === 'resolved')     { await presenter.play(d.events); continue; }
 *   if (d.kind === 'waiting')      { engine.tick(d.nextEventMs); continue; }   // X-2
 *   const cmd = await ui.chooseCommand(d.actorId, d.commands);
 *   await presenter.play(engine.submit(cmd));
 * }
 * ```
 */
export interface BattleEngine {
  /** Build the initial state. Safe to call again to restart with a new setup. */
  init(setup: BattleSetup): void;
  /** What happens next. Never mutates state for `'player-input'` or `'battle-over'`. */
  nextDecision(): Decision;
  /** Resolve one command and return the events it produced, in order. */
  submit(command: Command): BattleEvent[];
  /** Deeply read-only view of the live state. Do not mutate. */
  state(): Readonly<BattleState>;
  /** Re-seed. Only legal before `init` or between battles. */
  setSeed(n: number): void;
}

/** The FFX (CTB) engine. */
export interface FFXBattleEngine extends BattleEngine {
  /**
   * The next `n` turns, ascending by tick value, for the CTB list.
   * Pass `previewCommand` to re-render the list as if the current actor used
   * that command's rank [ffx-combat-core §1.6].
   */
  predictTurnOrder(n: number, previewCommand?: Command): TurnPreview[];
}

/** The FFX-2 (ATB) engine. */
export interface FFX2BattleEngine extends BattleEngine {
  /** Current gauges, for the HUD. */
  gaugeSnapshot(): AtbSnapshot;
  /**
   * Advance the real-time clock by `ms` and return anything that resolved
   * (enemy turns, charge completions, status expiries, chain breaks).
   *
   * **Two Config ATB modes** (`research/ffx2-combat-core.md` §1.5). Under
   * **Wait**, the default (Bailey, 2026-09-22, `docs/target/decisions.json`
   * D-029), an open command menu holds the whole clock and this advances
   * nothing until the command is confirmed. Under **Active** (D-009's build)
   * the presenter keeps calling this while a command menu, submenu or target
   * cursor is open, with `throughInput` set: a girl standing ready for a
   * command is queued for input, not acting, and does not stop the clock. The
   * mode is the engine's (`FFX2Engine.setAtbMode`), not a parameter here.
   * FFX-2 only — FFX is CTB and has no clock to run.
   */
  tick(ms: number, opts?: { throughInput?: boolean }): BattleEvent[];
  /**
   * Is the command menu open for `actorId` still answerable — is she ready,
   * able to act, not chain-locked, not Berserked, and is the battle still on?
   *
   * The presenter polls this once per pump step so a menu whose owner was KO'd,
   * Stopped or Slept while it was open closes instead of hanging the loop.
   * See `src/battle/ffx2/active.ts`.
   */
  inputValid(actorId: CombatantId): boolean;
}

// ---------------------------------------------------------------------------
// 16. Party and encounter builds
// ---------------------------------------------------------------------------

/** One inventory row. */
export interface InventoryEntry {
  itemId: ItemId;
  /** 1–99. */
  count: number;
}

/** A single FFX party member at the chapter's build point. */
export interface FFXMemberBuild {
  /** Character id from `data/ffx/ids`. */
  id: string;
  name: string;
  spriteKey: SpriteKey;
  portraitKey: PortraitKey;
  stats: StatBlock;
  /** Starting HP. Usually `stats.maxHp`. */
  hp: number;
  /** Starting MP. Usually `stats.maxMp`. */
  mp: number;
  learnedAbilityIds: AbilityId[];
  equipment: { weapon: EquipmentDef; armor: EquipmentDef };
  overdrive: {
    /** Starting gauge, 0–100. */
    gauge: number;
    mode: OverdriveModeId;
    unlockedModes: OverdriveModeId[];
    unlockedOverdriveIds: AbilityId[];
  };
  sphereGrid: SphereGridState;
  /**
   * Statuses carried over from the previous link of a chained encounter.
   * Omitted for a fresh battle [docs/CONTRACT-CHANGES.md, orchestrator
   * decision 6].
   */
  statuses?: Partial<Record<StatusId, StatusInstance>>;
}

/** One aeon Yuna owns at this point. */
export interface AeonBuild {
  /** Aeon id from `data/ffx/ids`. */
  id: string;
  name: string;
  spriteKey: SpriteKey;
  stats: StatBlock;
  /** Current HP — aeon HP/MP persist between battles and are not refilled by winning. */
  hp: number;
  mp: number;
  /** Aeon gauge, 0–100. Aeon Overdrives carry `od_cost = 20` in the data but the gauge is still modelled 0–100. */
  overdriveGauge: number;
  /** Attack, its special, Shield, Boost, Dismiss. */
  abilityIds: AbilityId[];
  /** Its Overdrive(s). Valefor is the only aeon with two. */
  overdriveIds: AbilityId[];
  /** Battles remaining before a KO'd aeon may be summoned again. 0 = available. */
  reviveCountdown?: number;
  /** Statuses carried over from the previous link of a chained encounter. */
  statuses?: Partial<Record<StatusId, StatusInstance>>;
}

/** The FFX party at a chapter's build point. */
export interface FFXPartyBuild {
  game: 'ffx';
  /** Every member the player may field, including the bench. */
  members: FFXMemberBuild[];
  /**
   * The members on the field at battle start, in slot order: **three**
   * everywhere but a forced solo line-up. One or two ids is legal (additive,
   * 2026-09-25): Chapter XIV's Via Purifico duel fields **Yuna alone**
   * (`forced_party "y"`, research/ffx-isaaru-bevelle.md §1.2 [verified: 3
   * sources]). The engine has always built the line-up from this list's
   * length (`setup.ts`), so a shorter one needs no engine change.
   */
  activeSlots: [string, string, string] | [string, string] | [string];
  /** Bench member ids, switchable in. */
  reserve: string[];
  aeons: AeonBuild[];
  inventory: InventoryEntry[];
  /** Party gil. Range 0–9 999 999. */
  gil: number;
  /** Sphere inventory shared across the party: sphere id -> count. */
  sphereInventory: Record<string, number>;
}

/** A single FFX-2 girl at the chapter's build point. */
export interface FFX2MemberBuild {
  /** Character id from `data/ffx2/ids`: `yuna` | `rikku` | `paine`. */
  id: string;
  name: string;
  spriteKey: SpriteKey;
  portraitKey: PortraitKey;
  /** 1–99. Stats are a function of (dressphere x level) only. */
  level: number;
  /** Starting dressphere id. */
  currentDressphere: string;
  /** Dresspheres she owns. */
  owned: string[];
  garmentGrid: GarmentGridState;
  /** Per-dressphere learned abilities and banked AP. */
  abilitiesLearned: Record<string, DressphereProgress>;
  /** Exactly two entries, or fewer. */
  accessories: string[];
  /** Starting HP/MP. `null` = start at full. */
  hp?: number;
  mp?: number;
  /**
   * Statuses she carries in from the previous link of a chained encounter.
   * Mirrors `FFXMemberBuild.statuses`; `undefined` for a fresh battle.
   * Gate effects ride along on {@link GarmentGridState.passedGates}, which the
   * carried `garmentGrid` already holds [ffx2-combat-core §4.1].
   */
  statuses?: Partial<Record<StatusId, StatusInstance>>;
}

/** The FFX-2 party at a chapter's build point. Always exactly three girls. */
export interface FFX2PartyBuild {
  game: 'ffx2';
  members: [FFX2MemberBuild, FFX2MemberBuild, FFX2MemberBuild];
  inventory: InventoryEntry[];
  /** Range 0–9 999 999. */
  gil: number;
}

/** Either build. */
export type AnyPartyBuild = FFXPartyBuild | FFX2PartyBuild;

/** One enemy in a formation. */
export interface EnemyDef {
  /** Enemy id from `data/ffx/ids` or `data/ffx2/ids`. */
  id: string;
  name: string;
  spriteKey: SpriteKey;
  /** Field slot, 0-based, left to right. */
  slot: number;
  stats: StatBlock;
  /** Starting HP. Usually `forms[0].hp`. */
  hp: number;
  mp: number;
  affinities: ElementalAffinities;
  /** Raw 0–255 resistance bytes. Missing key = 0. */
  immunities: StatusImmunities;
  immunityFlags: ImmunityFlag[];
  /** All forms in order; single-form enemies carry one entry. */
  forms: EnemyForm[];
  aiScriptId: string;
  rewards: EnemyRewards;
  /** Ability ids the AI script may select. */
  abilityIds: AbilityId[];
  flags: CombatantFlags;
  sensorText?: string;
  scanText?: string;
  misleadingSensor?: boolean;
  /** Per-enemy Threaten chance, a percent that may exceed 100. Default 100; 0 = immune. */
  threatenChance?: number;
  /** Poison tick as a percentage of max HP, 0–100. */
  poisonTickPercent?: number;
  /**
   * Doom countdown, in the victim's turns; see {@link EnemyDef.doomTurns}.
   * Also the countdown Doom runs on when it is inflicted **on** this enemy.
   */
  doomTurns?: number;
  /** Zanmato level 1–7; Yojimbo's Zanmato succeeds at or below the party's compatibility tier. */
  zanmatoLevel?: number;
  /**
   * A part that **cannot be permanently killed**: it comes back on a timer.
   *
   * The Yu Pagodas are the case this exists for
   * [ffx-bfa-yu-yevon §1.4, "Revive rule (critical to implement correctly)",
   * verified: 2 sources]: destroyed, they return "after roughly three turns"
   * with `new max HP = 5,000 + excess damage from the killing blow` (the
   * wiki's own worked example: start 5,000, take 2,700 then 2,600 → back with
   * 5,300). The research converts "about three turns" into **CTB ticks**,
   * because a dead Pagoda takes no turns of its own and the phrase is
   * otherwise undefined: 63 ticks in the Braska's Final Aeon fight (Pagoda
   * AGI 40) and 72 in the possessed-aeon and Yu Yevon fights (AGI 30). On
   * expiry it re-enters the queue like a revived character, at `baseCTB × 3`.
   *
   * Without this the pillars are a one-time chore instead of a repeating
   * decision, and the boss's entire heal / cleanse / Overdrive economy is
   * switched off for the rest of the battle by two early swings.
   */
  reviveRule?: PartReviveRule;
  /** FFX-2 enemy level, 1–99. */
  level?: number;
  /** FFX-2 only: ATB ticks the enemy waits after its gauge fills before choosing. 0 = acts immediately. */
  thinkingPeriod?: number;
}

/** A music change wired to a battle phase. */
export interface MusicPhaseCue {
  /** Which phase starts the cue: `'start'`, `'form:1'`, `'hp-below:0.5'`, `'part-destroyed:bulwark-r'`. */
  at: string;
  track: MusicKey | null; // null: start nothing, what plays carries; an entrance scene owns it (PR-0129)
  /** Crossfade in milliseconds, 0–4 000. */
  fadeMs?: number;
}

/** One battle's enemy formation. */
export interface EnemyGroupDef {
  /** Formation id, e.g. `'seymour-flux'`. */
  id: string;
  game: GameId;
  enemies: EnemyDef[];
  /** Parts belonging to an enemy in {@link enemies}; drawn and targeted separately. */
  parts?: EnemyDef[];
  /** Overrides each enemy's own `aiScriptId` when the formation has group-level logic. */
  aiScriptId?: string;
  /** Music cues for this formation's phases. */
  musicCues?: MusicPhaseCue[];
  /** Escape and Flee disabled when false. All five of our encounters ship `false`. */
  canEscape?: boolean;
  /**
   * For a chained encounter (Yunalesca's three forms, the Vegnagun four-part
   * chain): the formation that follows this one with no menu between.
   */
  nextGroupId?: string;
  /**
   * The party fights this formation under a **permanent, non-consumable
   * Auto-Life granted by the fayth**, so a KO'd member revives immediately and
   * the battle cannot be lost [ffx-bfa-yu-yevon §2.3, verified: 3 sources].
   *
   * True for every possessed-aeon formation and for Yu Yevon. The status is
   * applied at setup and never removed; `hp.ts` already distinguishes a
   * permanent Auto-Life from a cast one and reports its revive as
   * `cause: 'fayth'`. The single documented loss condition — deliberate
   * party-wide self-petrification — is unaffected, because Petrify is not a KO.
   */
  grantsPermanentAutoLife?: boolean;
  /**
   * **FFX-2, a chained link that opens after a Save Sphere** (Chapter XI, the
   * Road to the Farplane; `docs/plans/chapter-fallen-aeons-review.md` FA2 = b,
   * a sourced `[conflict]`: GamerGuides (HD) has Save Spheres between the
   * platforms, FFExodus (PS2) has none). The party enters this link at full HP
   * and MP, and a girl KO'd in the previous link stands up. Items spent stay
   * spent. It also marks the link as the retry checkpoint (FA3 = b), for the
   * flow to read. Absent everywhere else, so no other chain changes.
   */
  restoresPartyOnEntry?: boolean;
  /**
   * **FFX, the mirror lock** (Chapter XIV, Isaaru's contest of aeons,
   * `docs/plans/chapter-isaaru-review.md` I-G2): Yuna cannot summon her own
   * copy of the aeon she is facing, "two aeons of the same type cannot fight
   * each other" [research/ffx-isaaru-bevelle.md §1.2, verified: 2 sources].
   * `aeonId` is the locked roster key; `mirrorOf` is the enemy combatant id
   * whose name the greyed Summon row gives as its reason ("Mirror of
   * Grothia", Bailey's O-5 pick). Read by `battle/ffx/aeon-duel.ts`; absent
   * everywhere else, so no other chapter's Summon list changes.
   */
  lockedAeons?: ReadonlyArray<{ aeonId: string; mirrorOf: CombatantId }>;
  /**
   * **FFX, "can only be fought by aeons"** (Chapter XIV; research §1.2
   * [verified: 2 sources] for the rule, plan B6 / B11 for how it is
   * built, each Bailey's pick 2026-09-25). While set:
   * - a party member's rows that act on the enemy side (Attack, Talk, attack
   *   items, any foe-aimed ability) are greyed "Only an aeon can fight an
   *   aeon" and refused if submitted (B6 = a, our estimate: the sources say
   *   only aeons can fight, not what Yuna's menu shows);
   * - (no Items row on an aeon is every FFX battle's rule, §6.2, PR-0155);
   * - the battle is **lost** when no aeon holds the field and none is left to
   *   summon (B11 = a, [single source: GameFAQs]), so it never drifts into the
   *   400-turn stalemate `'escape'` (plan I-G3, review E11).
   */
  aeonsOnly?: boolean;
  /**
   * AP paid on a victory over this formation **on top of** its enemies'
   * rewards, for a reward no single enemy carries: the 5,000 AP Yuna gains
   * for winning Isaaru's duel [research §11 I-1, single source: GameFAQs;
   * plan B13 = a]. Absent everywhere else.
   */
  victoryBonusAp?: number;
}
