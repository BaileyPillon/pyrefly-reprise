/**
 * Types and constants of the FFX-2 damage orchestrator kernel (`pipeline.ts`, `settle.ts`).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), the per-target
 * damage orchestrator at 0x6172c0 (the older copy has it at 0x6172e0). Spec: `research/re-ffx2-damage.md`
 * section 2.
 *
 * Every input field names the byte, word or dword of the game's structures it stands for (`Chr+0x...` is the
 * 0x17e0-byte battle character, `Cmd+0x...` the command row, `ActionRec+0x...` the queued action). The values
 * are the raw bytes: the kernel zero-extends the stat bytes and sign-extends the stage bytes itself, as the
 * game's MOVZX / MOVSX do, so a caller hands over exactly what is stored.
 *
 * Pure, DOM-free, no `three`.
 */

import type { BaseDamageRecords, BaseDamageTarget, BaseDamageUser } from './damage.ts';
import type { ElementAffinities } from './element.ts';
import type { Ffx2Draw } from './rng.ts';

/** Result-flag bits the orchestrator ORs into the flag word (`Result+4`) besides the class bits 1, 2 and 4. */
export const RESULT_DEFENSE_CLAMP = 0x08; // Defense status clamped a physical hit to +/-1
export const RESULT_SHELL = 0x20; // Shell halved the hit
export const RESULT_PROTECT = 0x40; // Protect halved the hit
export const RESULT_CRITICAL = 0x100; // a critical hit

/** Damage-class bits of `Cmd+0x27`: which pools the command damages. */
export const CLASS_HP = 1;
export const CLASS_MP = 2;
export const CLASS_ATB = 4;

/** The command row fields the orchestrator reads (the base formula's `misc` and `damage` words are the same two). */
export interface PipelineCommand {
  /**
   * The command id, the orchestrator's `cmdId`. 0x3181 and 0x31ea skip the "target must be in battle" test;
   * 0x2000..0x2fff are item commands (Element Master, Non-Element Master and Medicine apply to them).
   */
  id: number;
  /** Cmd+0x0e (u8): the sub-menu category. The Booster auto-ability applies to categories 1 and 2. */
  category: number;
  /**
   * Cmd+0x10 (u32), flags_target: 0x40 the command can target a dead character, 0x80 it can target all (with
   * `ActionRec+0x27` this halves the damage), 0x400 skips the `+0x5ac` test of the target gate.
   */
  flagsTarget: number;
  /**
   * Cmd+0x14 (u32), flags_misc: 0x1000 / 0x2000 delay (forces the ATB class with formula 0x18), 0x10000 the
   * element also takes the attacker's weapon element, 0x40000 the target must be dead.
   */
  flagsMisc: number;
  /**
   * Cmd+0x1c (u32), flags_damage: bits 0-1 the class (1 physical, 2 magical), 4 can crit, 0x10 healing,
   * 0x40 cap 9999, 0x80 cap 99999.
   */
  flagsDamage: number;
  /** Cmd+0x27 (u8), damage_class: 1 HP, 2 MP, 4 ATB (OR-ed). */
  damageClass: number;
  /** Cmd+0x28 (u8): the damage formula. */
  formula: number;
  /** Cmd+0x2b (u8): the power. 0 means no damage is computed at all (no draw either). */
  power: number;
  /** Cmd+0x2e (u8): the command's element byte. */
  element: number;
  /** Cmd+0x78 (u16): the species-killer mask. */
  speciesKiller: number;
}

/** What the orchestrator reads from the attacker's character record (and the exe's own party tables). */
export interface PipelineAttacker extends BaseDamageUser {
  /** The attacker's character id. */
  id: number;
  /** Chr+0x434 (u32): status group 1 bits. 0x80 Berserk, 0x4000 Damage 9999. */
  status1: number;
  /** Chr+0x650 (u16): auto-abilities. 0x20 Booster, 0x100 Medicine, 0x200 Element Master, 0x400 Non-Element Master. */
  autoAbilities650: number;
  /** Chr+0x652 (u16, only the low byte is read): bit 0 breaks the 9999 damage limit. */
  autoAbilities652: number;
  /** Chr+0x3af (u8): the weapon element, used only when the command's flags_misc has 0x10000. */
  weaponElement: number;
  /** True for a player-side monster (the exe's "aided" character). False in every ordinary fight. */
  aided?: boolean;
}

/** What the orchestrator reads from the target's character record. */
export interface PipelineTarget extends BaseDamageTarget {
  /** The target's character id. */
  id: number;
  /** Chr+0x3b8 / Chr+0x388: current and max MP (the MP class). */
  mp: number;
  maxMp: number;
  /** Chr+0x434 (u32): status group 1 bits. 1 Death, 2 Petrify, 0x200 Defense. */
  status1: number;
  /** Chr+0x3b0..0x3b3: the four element-affinity bytes. */
  affinities: ElementAffinities;
  /** Chr+0x438 (u8): Shell counter, non-zero = Shell is on. */
  shell: number;
  /** Chr+0x439 (u8): Protect counter, non-zero = Protect is on. */
  protect: number;
  /** Chr+0x447 (u8): immune to physical damage. */
  immunePhysical: number;
  /** Chr+0x448 (u8): immune to magical damage. */
  immuneMagical: number;
  /** Chr+0x449 (u8): invincible. */
  invincible: number;
  /** Chr+0x3a6 (u8 read): bit 0 immune to the percent-HP formulas 4 and 7, bit 6 immune to ATB damage. */
  special: number;
  /** Chr+0x660 (u16): species mask, matched bit by bit against the command's species-killer mask. */
  species: number;
  /** Chr+0x5ad (u8): this target's chain counter before the hit. */
  chain: number;
  /** Chr+0x1784 (u8): non-zero when the character is in the battle. */
  inBattle: number;
  /** Chr+0x1787 (s8): non-zero when the character is dead. */
  dead: number;
  /** Chr+0x5ac (u8): the value 1 makes the character an invalid target unless flags_target has 0x400. Meaning not pinned. */
  flag5ac: number;
  /**
   * The ATB pool the ATB class damages: while the target is charging an action, its remaining charge and the
   * charge's maximum; otherwise its remaining recovery and the recovery's maximum ({@link atbValues}).
   */
  atb: { current: number; max: number };
  /** True for a player-side monster. False in every ordinary fight. */
  aided?: boolean;
}

export interface PipelineInput {
  cmd: PipelineCommand;
  attacker: PipelineAttacker;
  target: PipelineTarget;
  /** ActionRec+0xb0 (s32): the amount a command carries (formula 0xc). */
  amount: number;
  /** ActionRec+0x27 != 0: the all-targets choice. Together with Cmd.flags_target & 0x80 it halves the damage. */
  allTargets: boolean;
  /** True for the estimate mode: variance 0x100, no critical roll, no draw. The game's normal mode is false. */
  preview: boolean;
  /** The physical back-attack test: the angle between target facing and attacker is beyond 112.5 degrees. */
  backAttack: boolean;
  /** The save-record fields formulas 0xd, 0x16 and 0x17 read. Zeros when unknown. */
  records: BaseDamageRecords;
  /** rom.bin delay_count[2]; defaults to {4000, 8000}. */
  delay?: readonly [number, number];
  /** DAT_011b95c4: the aid count, 0..5 (default 3, which scales by exactly 1). */
  aidCount?: number;
}

export interface PipelineHooks {
  /** The attacker's mode-0 RNG stream (one draw per class base-formula call), see `damage.ts`. */
  draw: Ffx2Draw;
  /**
   * The critical-hit decision. Called exactly once, right after the HP class base formula, only when the call
   * is not a preview and the command can crit (Cmd.flags_damage & 4). The game's own function draws one
   * value from the attacker's mode-0 stream and compares; the crit kernel does that and returns true for a
   * crit (including the Always Critical status). Not called for the MP and ATB classes.
   */
  rollCrit: () => boolean;
}

/** What the orchestrator computes before the status rolls (everything the numbers depend on). */
export interface ClassDamage {
  /** False when the target gate failed: nothing was computed and everything below is 0. */
  gate: boolean;
  /** The HP delta before halving and caps: positive damage, negative healing. */
  hp: number;
  /** The MP delta, same convention. */
  mp: number;
  /** The ATB delta (delay damage), same convention. */
  atb: number;
  /** Result+4: the class bits plus RESULT_* bits. */
  flags: number;
  /** Result+2: the damage classes not blocked (starts as Cmd+0x27). */
  surviving: number;
  /** The "no effect" counter: how many class blocks an immunity cancelled. */
  blocked: number;
  /** Result+0x30: the chain counter value the chain multiplier used (0 = none). */
  chain: number;
  /** Result+0x31: the back attack doubled the hit. */
  backAttack: boolean;
  critical: boolean;
  /** Result+0x70: the preview base damage for the HP pool (variance 0x100), before every modifier. */
  estimate: number;
}

/** What the status phase tells the damage numbers (all default to false). */
export interface StatusPhaseOutcome {
  /** A group 2 Haste or Slow roll failed to land (status index 4 or 5): the group 2 pass drops the ATB delta. */
  hasteSlowFailed?: boolean;
  /** The result status mask (Result+0x34) has bit 0 (Death) after the rolls: a living target is killed outright. */
  resultHasDeath?: boolean;
  /** The result status mask has bit 1 (Petrify) after the rolls. */
  resultHasPetrify?: boolean;
  /** The Shatter roll fired this hit (result status mask bit 0x400). */
  shattered?: boolean;
}

/** The orchestrator's final numbers. */
export interface DamageResult {
  gate: boolean;
  /** Result+0x74: the HP delta after halving and the cap (positive damage, negative healing). */
  hp: number;
  /** Result+0x78: the MP delta. */
  mp: number;
  /** Result+0x7c: the ATB delta. */
  atb: number;
  flags: number;
  surviving: number;
  blocked: number;
  chain: number;
  backAttack: boolean;
  critical: boolean;
  estimate: number;
  /** The damage limit that applied to this hit (9999 or 99999). */
  cap: number;
}
