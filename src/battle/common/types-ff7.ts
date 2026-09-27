/**
 * FF7's own combat types: the third game, `GameId` `'ff7'`.
 *
 * **Contract file** (listed in `docs/CONTRACTS.md`; every change gets a
 * `docs/CONTRACT-CHANGES.md` note). Split from `./types.ts` so that 2,600-line
 * file does not grow; `types.ts` imports these type-only and widens its unions
 * (`AnyCombatant`, `AnyPartyBuild`, `BattleSetup.party`, `EnemyDef.ff7`).
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Nothing here is read by the FFX
 * or FFX-2 engines. The shapes follow `research/ff7-battle-core.md` (cited as
 * "core §x") and `research/ff7-guard-scorpion.md` ("gs §x"); this file holds
 * **no numbers** beyond the ranges those sections give for each field (rule 6).
 *
 * The one rule that keeps the games apart: an {@link Ff7Combatant} still carries
 * the shared {@link StatBlock} (`stats`), because shared UI reads HP and MP from
 * it, but its other fields are **mirrors** for display only. The FF7 engine
 * reads the {@link Ff7Combatant.ff7} block and nothing else, so no FFX or FFX-2
 * meaning of Strength or Agility leaks into an FF7 formula.
 */

import type {
  AbilityId,
  Combatant,
  CombatantId,
  InventoryEntry,
  ItemId,
  PortraitKey,
  SpriteKey,
  StatusId,
  StatusInstance,
} from './types.ts';

// ---------------------------------------------------------------------------
// Stats (core §1)
// ---------------------------------------------------------------------------

/**
 * The seven primary stats plus the HP and MP pools, before equipment and
 * Materia [core §1.1, verified: 2 sources].
 */
export interface Ff7BaseStats {
  /** Character or enemy level, 1–99. */
  level: number;
  /** Base maximum HP before Materia percentages. */
  hp: number;
  /** Base maximum MP before Materia percentages. */
  mp: number;
  /** Strength. `Att = Str + weapon Attack`. */
  str: number;
  /** Vitality. `Def = Vit + armour Defense`. */
  vit: number;
  /** Magic. `MAt = Mag`. */
  mag: number;
  /** Spirit. `MDf = Spr` (armour MDefense is never added: the kept bug, core §1.1). */
  spr: number;
  /** Dexterity. Feeds the Turn Timer (core §2.3) and `Df% = [Dex / 4] + armour Df%`. */
  dex: number;
  /** Luck. Critical chance and Lucky Evade (core §3). */
  lck: number;
}

/**
 * The battle stats FF7's formulas read [core §1.1, §1.3]. For a party member
 * they are derived from {@link Ff7BaseStats} + equipment + Materia; for an
 * enemy they are listed final (enemies have no MD%, core §1.3).
 */
export interface Ff7DerivedStats {
  maxHp: number;
  maxMp: number;
  /** Attack. */
  att: number;
  /** Attack% (weapon hit rate). */
  atPct: number;
  /** Defense. */
  def: number;
  /** Defense% (physical evade). */
  dfPct: number;
  /** Magic attack. */
  mat: number;
  /** Magic defense. */
  mdf: number;
  /** Magic defense% (magic evade). Always 0 for an enemy [core §1.3]. */
  mdPct: number;
  /** Total Dexterity, including equipment and Materia (the Turn Timer's `TotalDex`, core §2.3). */
  dex: number;
  /** Luck. */
  lck: number;
}

// ---------------------------------------------------------------------------
// Rows, Limit, Materia, the ATB (core §2, §5, §7, §8)
// ---------------------------------------------------------------------------

/** Front or back row [core §5.1]. */
export type Ff7Row = 'front' | 'back';

/**
 * The Limit gauge [core §7]. An integer 0 to 255, full at 255; fills only from
 * HP damage done by an enemy; replaces Attack with Limit while full.
 */
export interface LimitState {
  /** 0–255. */
  gauge: number;
  /** Current Limit Level, 1–4. */
  level: 1 | 2 | 3 | 4;
  /** Limits this character may use at the current level. */
  learnedLimitIds: AbilityId[];
}

/** One Materia orb [core §8]. */
export interface MateriaInstance {
  /** Materia id from `data/ff7/ids`. */
  id: string;
  /** AP banked on this orb; absent = not tracked (the slice's starting AP is unsourced). */
  ap?: number;
}

/**
 * Slots on one piece of equipment [core §8.1]: `slots` holes, of which the
 * pairs in `links` are linked (0-based slot indices). `O=O` is
 * `{ slots: 2, links: [[0, 1]] }`; `O` is `{ slots: 1, links: [] }`.
 */
export interface MateriaSlotLayout {
  slots: number;
  links: ReadonlyArray<readonly [number, number]>;
}

/** One weapon, armour or accessory as FF7 describes it [core §1.1, gs §8.3]. */
export interface Ff7EquipmentDef {
  /** Equipment id from `data/ff7/ids`. */
  id: string;
  name: string;
  kind: 'weapon' | 'armour' | 'accessory';
  /** Weapon Attack. */
  att?: number;
  /** Weapon Attack%. */
  atPct?: number;
  /** Armour Defense. */
  def?: number;
  /** Armour Defense%. */
  dfPct?: number;
  /** Armour MDefense (not applied in battle: core §1.1's kept bug). */
  mdef?: number;
  /** Armour MDefense%. */
  mdPct?: number;
  /** Primary-stat bonuses, e.g. the Buster Sword's Mag +2. */
  statBonus?: Partial<Pick<Ff7BaseStats, 'str' | 'vit' | 'mag' | 'spr' | 'dex' | 'lck'>>;
  /** Weapons only: Long Range ignores the row check [core §5.1]. */
  longRange?: boolean;
  /** Weapons only: the attack's element for the affinity check, e.g. `'cut'`, `'shoot'`. */
  element?: string;
  slots: MateriaSlotLayout;
}

/**
 * The Turn Timer [core §2.3]: full at 65,535, reset to 0 when the turn is
 * taken. `tick(ms)` advances it; nothing else does.
 */
export interface Ff7AtbState {
  /** 0–65,535. */
  turnTimer: number;
  /** The V-Timer, for status durations [core §2.2]. */
  vTimer: number;
  /** True once the gauge is full and the unit waits in the ready list [core §2.6, estimate]. */
  ready: boolean;
}

// ---------------------------------------------------------------------------
// Combatant
// ---------------------------------------------------------------------------

/** An enemy's listed stats, already final: no At% and no MD% [core §1.3]. */
export type Ff7EnemyStats = Omit<Ff7DerivedStats, 'atPct' | 'mdPct'>;

/** Enemy-only FF7 fields [core §1.3, gs §2]. */
export interface Ff7EnemyFields {
  level: number;
  stats: Ff7EnemyStats;
  /** Per-form stat overrides, index = form (Guard Scorpion's raised tail changes Def and MDf, gs §2.1). */
  formStats?: ReadonlyArray<Partial<Ff7EnemyStats>>;
  exp: number;
  ap: number;
  gil: number;
  /** Win drops. `chanceClass` is the /63 drop class (`Rnd(0..63) <= class`); 63 is certain [gs §2.2]. */
  drops: ReadonlyArray<{ itemId: ItemId; count: number; chanceClass: number }>;
  /** Element id (core §6.1, lower case) -> affinity level [core §6.2]. Absent = neutral. */
  elements?: Readonly<Record<string, 'death' | 'auto-hit' | 'weak' | 'half' | 'void' | 'absorb' | 'recovery'>>;
  /** Statuses it is immune to [gs §3]. */
  statusImmune?: readonly string[];
}

/**
 * An FF7 fighter. {@link Combatant} carries id, side, HP and MP for shared UI;
 * everything FF7's formulas read is in `ff7`.
 */
export interface Ff7Combatant extends Combatant {
  ff7: {
    /** Party members only. */
    base?: Ff7BaseStats;
    derived: Ff7DerivedStats;
    row: Ff7Row;
    /** Party members only. */
    limit?: LimitState;
    /** Party members only: Materia by equipment slot. */
    materia?: { weapon: Array<MateriaInstance | null>; armour: Array<MateriaInstance | null> };
    atb: Ff7AtbState;
    /** Enemies only. */
    enemy?: Ff7EnemyFields;
    /** Enemies with forms: the current one, 0-based. */
    formIndex?: number;
    /** Enemy AI script id. */
    aiScriptId?: string;
    /**
     * Party members only: used Defend on the most recent turn, so physical damage
     * taken is halved until the next action [core §5.2, §4.5 step 4]. Absent = false.
     */
    defending?: boolean;
  };
}

// ---------------------------------------------------------------------------
// The clock and the lines (engine part 2)
// ---------------------------------------------------------------------------

/**
 * FF7's three Config battle modes [core §2.5, single source: wiki battle system]:
 * Active (time stops only for Summons), Recommended (the default: time stops during
 * battle animations), Wait (also while the player targets or is in a sub-menu).
 */
export type Ff7AtbMode = 'active' | 'recommended' | 'wait';

/** Which of the three Guard Scorpion warnings plays, by who is alive [gs §7.1, verified: 2 sources]. */
export type Ff7HintCase = 'both-alive' | 'cloud-only' | 'barret-only';

/**
 * What an FF7 `message` event is, beyond its text (the event's optional `ff7` field).
 * - `lock-on`: Search Scope's "Locked On Target" on `targetId` [gs §4].
 * - `hint`: line `line` (0-based) of the tail warning, said by `speakerId` [gs §7.1].
 */
export type Ff7MessageTag =
  | { kind: 'lock-on'; targetId: CombatantId }
  | { kind: 'hint'; hintCase: Ff7HintCase; line: number; speakerId: CombatantId };

// ---------------------------------------------------------------------------
// Builds
// ---------------------------------------------------------------------------

/** One FF7 party member at the chapter's build point [gs §8]. */
export interface Ff7MemberBuild {
  /** Character id from `data/ff7/ids`. */
  id: string;
  name: string;
  spriteKey: SpriteKey;
  portraitKey: PortraitKey;
  base: Ff7BaseStats;
  /** Starting HP; absent = full. */
  hp?: number;
  /** Starting MP; absent = full. */
  mp?: number;
  row: Ff7Row;
  weapon: Ff7EquipmentDef;
  armour: Ff7EquipmentDef;
  accessory: Ff7EquipmentDef | null;
  materia: { weapon: Array<MateriaInstance | null>; armour: Array<MateriaInstance | null> };
  limit: LimitState;
  /** Carried from a previous battle; absent for a fresh one. */
  statuses?: Partial<Record<StatusId, StatusInstance>>;
}

/** The FF7 party at a chapter's build point: one to three members on the field. */
export interface Ff7PartyBuild {
  game: 'ff7';
  members: Ff7MemberBuild[];
  /** Field line-up, in slot order. */
  activeSlots: [string, string, string] | [string, string] | [string];
  inventory: InventoryEntry[];
  /** Party gil; absent = unsourced for this build point. */
  gil?: number;
}

/** A Limit Break used from the Limit command (replaces Attack while the gauge is full, core §7.2). */
export interface LimitCommand {
  kind: 'limit';
  id: AbilityId;
  targets: CombatantId[];
}

/**
 * **Change**: the member swaps between the front and the back row [core §5.1, §9,
 * single source: wiki battle system; manual p. 18 via staging §5]. Never targets.
 */
export interface RowChangeCommand {
  kind: 'row-change';
  targets: [];
}

/** FF7's own command kinds, widened into the shared `Command` union by `./types.ts`. */
export type Ff7Command = LimitCommand | RowChangeCommand;

/**
 * A Limit gauge changed (FF7 only): `value` 0 to 255 (full at 255), `level` 1 to 4, `ready` = Limit
 * replaces Attack [core §7]. Never `overdrive-gauge`. `./types.ts` joins it to `BattleEvent` with the
 * shared event base (`seq`).
 */
export interface Ff7LimitGaugeFields {
  type: 'limit-gauge';
  actorId: CombatantId;
  value: number;
  level: number;
  ready: boolean;
}

/**
 * FF7's message tag, `BattleEvent` `'message'`'s optional `ff7` field: what the line is (Search
 * Scope's lock-on, a hint line and its speaker); absent in FFX and FFX-2. The type is
 * {@link Ff7MessageTag} above.
 *
 * `EnemyDef.ff7` is added here by module augmentation, so `./types.ts` does not grow (C-3): the
 * enemy's own FF7 stat block; the FF7 engine reads this, not `stats`.
 */
declare module './types.ts' {
  interface EnemyDef {
    /** FF7 only: the enemy's own FF7 stat block; the FF7 engine reads this, not `stats`. */
    ff7?: Ff7EnemyFields;
  }
}
