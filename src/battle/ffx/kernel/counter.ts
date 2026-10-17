/**
 * FFX counters: which hit arms a counter, which command is harmful, and the reaction a holder queues (re-parity RC9 lane FFX-G slice G-c; **FFX only**).
 *
 * **Game case: FFX only.** FFX-2 has its own counters (`research/re-ffx-targeting.md` section 0); none of these addresses exist there. Source: FFX.exe,
 * Steam build 25501027, SHA-256 0537B2A1...686D; the rules are the FFX-G04 note's (`research/re-ffx-targeting.md` section 7, our words), each function
 * proven against the game's own machine code in an x86-32 emulator (`tests/fixtures/parity/ffx/counter_*.json`). Pure and deterministic: no draw anywhere
 * in the counter chain, nothing here imports the DOM, `three` or the engine (AGENTS.md rule 1).
 *
 * | Function | VA | Vectors |
 * |---|---|---|
 * | {@link counterKind} (the kind a hit meets, and whether it arms) | 0x0078c1d0 | 20,000 + 8,000 |
 * | {@link isHarmful} (the table test that decides whether a command can arm a counter) | 0x0079e340 | 12,000 + 8,000 |
 * | {@link queueCounter} (the holder's answer, queued as a reaction) | 0x0078d8d0 | 6,000 + 8,000 |
 *
 * **The chain.** The game computes every hit of a target before it applies any (`pp_BtlCalcCommand` runs `pp_BtlCalcTarget`, which loops the target's hits
 * through `pp_BtlCalcHit`). At the end of each hit that is not a "no effect" outcome (a hit, a miss, a forced miss and a Nul-nullified hit all count) the hit
 * asks {@link counterKind} to arm: when the kind is not 0 and the command is harmful, the target's one "counter armed" byte (`Chr+0x6dc`) is set. The hit
 * records are then applied one hit per call (`pp_BtlApplyHitRecords`); each call, once its hit is in, looks at the armed byte and, when it is set, runs
 * {@link queueCounter}, which clears it whatever the answer. So a target answers **once per command**, at the first hit it applies.
 *
 * `Chr+0x6dd` and `Chr+0x446` are presentation only: the sole reader of `+0x6dd` is the character's position getter (0x007948e0, which adds an offset to the
 * world position when it is set), and `+0x446` is the script property `stat_command_type`, read by the animation and camera helpers (a whole-exe scan of
 * every memory operand with those displacements, read only). The rules here never need either.
 */

/** The three auto-ability bits of `Chr+0x6bc` the counter reads: Counterattack, Evade and Counter, Magic Counter. */
export const AUTO_COUNTERATTACK = 0x08;
export const AUTO_EVADE_AND_COUNTER = 0x10;
export const AUTO_MAGIC_COUNTER = 0x20;

/** `Cmd+0x1a` bits bit 2 and 3: the target type (0 single, 1 group, 2 all, 3 self). A counter exists only for type 0. */
const TARGET_TYPE_MASK = 0x0c;
/** `Cmd+0x20`: the low two bits are the damage kind (1 physical, 2 magical), bit 4 is the restorative flag. */
const DAMAGE_KIND_MASK = 0x03;
const RESTORATIVE = 0x10;

/** What {@link counterKind} reads. A field of the game's own record or character, named by its offset where it has one. */
export interface CounterKindInput {
  /** `Cmd+0x1a` (the low byte of the target word): bits 2 and 3 are the target type. */
  b1a: number;
  /** `Cmd+0x20` (the low byte): the damage kind and the restorative flag. */
  b20: number;
  /** The target's `Chr+0x6bc`: 0x08 Counterattack, 0x10 Evade and Counter, 0x20 Magic Counter. */
  auto: number;
  /** The attacker's `Chr+0xdf1`: the kind of the action it is executing, non-zero for a reaction. */
  attackerKind: number;
  /** The attacker's and the target's ids (the call compares the ids, not the slots). */
  attackerId: number;
  targetId: number;
  /** The byte at VA 0x0112ca12: 1 at every battle start, 0 only in the eleven duel scenes that no chapter of the project is. */
  switchOn: number;
}

/**
 * The counter kind a hit meets (`pp_BtlCounterKind`, VA 0x0078c1d0). 0 when the command is not single-target, the attacker is itself in a reaction,
 * attacker and target are the same id, or the switch is off. Otherwise by damage kind: physical, Evade and Counter gives 2 and wins over Counterattack
 * (1); magical, Magic Counter gives 1; any other kind gives 0. Kind 2 is the forced miss of the hit check (in a check that rolls only; `kernel/hit.ts`).
 */
export function counterKind(i: CounterKindInput): 0 | 1 | 2 {
  if ((i.b1a & TARGET_TYPE_MASK) !== 0 || i.attackerKind !== 0 || i.attackerId === i.targetId || (i.switchOn & 0xff) === 0) return 0;
  const kind = i.b20 & DAMAGE_KIND_MASK;
  if (kind === 1) {
    if ((i.auto & AUTO_EVADE_AND_COUNTER) !== 0) return 2;
    if ((i.auto & AUTO_COUNTERATTACK) !== 0) return 1;
    return 0;
  }
  if (kind === 2) return (i.auto & AUTO_MAGIC_COUNTER) !== 0 ? 1 : 0;
  return 0;
}

/** The statuses the harmful test counts (byte 3 of each behaviour entry has bit 0x80; the game's own tables, `research/re-ffx-targeting.md` section 7). */
const TEMPORAL_FLAGGED: ReadonlySet<number> = new Set([0, 1, 2, 12]); // Sleep, Silence, Darkness, Slow (temporal slots)
/** The extra-status bits flagged: Eject (8), Curse (10) and Doom (14). All twelve permanent statuses are flagged. */
const EXTRA_FLAGGED_MASK = (1 << 8) | (1 << 10) | (1 << 14);
const PERMANENT_STATUSES = 12;
const FIRST_TEMPORAL_STATUS = 12;

/** What {@link isHarmful} reads: the command record's damage and status words. */
export interface HarmfulInput {
  /** `Cmd+0x20` (the low byte): bit 4 is the restorative flag. */
  b20: number;
  /** `Cmd+0x23` and 7: the damage classes, 1 HP, 2 MP, 4 CTB. */
  damageClass: number;
  /** The non-zero chance bytes as `[status number, byte]` pairs (`Cmd+0x2e` on: 0 to 11 permanent, 12 to 24 temporal). */
  chances: ReadonlyArray<readonly [number, number]>;
  /** The non-zero duration bytes as `[temporal slot, byte]` pairs (`Cmd+0x47` on; slot 0 Sleep to slot 12 Slow). */
  durations: ReadonlyArray<readonly [number, number]>;
  /** `Cmd+0x54` (u16): the extra-status bits the command inflicts. */
  extra: number;
}

/**
 * Is this command harmful (`pp_BtlIsHarmful`, VA 0x0079e340)? A table test and not "does damage": a command with the restorative flag is never harmful;
 * otherwise it is when it has any damage class (HP, MP or CTB), a non-zero chance of any permanent status, a non-zero chance of Sleep, Silence, Darkness or
 * Slow **and** a non-zero duration for it, or an Eject, Curse or Doom bit. Haste, Shell, Protect, Reflect, Regen and the Nul spells do not count.
 */
export function isHarmful(i: HarmfulInput): boolean {
  if ((i.b20 & RESTORATIVE) !== 0) return false;
  if ((i.damageClass & 7) !== 0) return true;
  for (const [status, chance] of i.chances) if (chance !== 0 && status >= 0 && status < PERMANENT_STATUSES) return true;
  for (const [status, chance] of i.chances) {
    if (chance === 0 || status < FIRST_TEMPORAL_STATUS) continue;
    const slot = status - FIRST_TEMPORAL_STATUS;
    if (!TEMPORAL_FLAGGED.has(slot)) continue;
    if (i.durations.some(([s, d]) => s === slot && d !== 0)) return true;
  }
  return (i.extra & EXTRA_FLAGGED_MASK & 0xffff) !== 0;
}

/**
 * Does the end of a hit arm the target's counter? The call is made for every outcome but "no effect" (`noEffect`); it arms when the kind is not 0 and the
 * command is harmful. The armed byte is one byte per character: a later hit of the same command arms it again, it does not count.
 */
export function armsCounter(kind: number, harmful: boolean, noEffect: boolean): boolean {
  return !noEffect && kind !== 0 && harmful;
}

/** The reaction a holder queues: the game's action record for a counter. */
export interface CounterRecord {
  /** The holder's id: the acting character. */
  actor: number;
  /** The command: the holder's own default attack (`Chr+0x6c6`). */
  command: number;
  /** The target mask: the attacker alone (bit `attackerId & 31`). */
  targetMask: number;
  /** The queue priority (0: it runs before every other reaction) and the record kind (1: a reaction, so it can itself never be countered). */
  priority: 0;
  kind: 1;
}

/**
 * The answer of an armed holder (`pp_BtlQueueCounter`, VA 0x0078d8d0): when the holder can act (the game's Can-act with in-battle, not-Provoked and
 * not-Threatened all required, `kernel/target-world.ts#canActSlot`) it queues its own default attack at the attacker as a reaction; the armed byte is
 * cleared either way, so the caller drops it. Returns `undefined` when the holder cannot act.
 */
export function queueCounter(canAct: boolean, holderId: number, attackerId: number, defaultAttack: number): CounterRecord | undefined {
  if (!canAct) return undefined;
  return {
    actor: holderId & 0xff,
    command: defaultAttack & 0xffff,
    targetMask: (1 << (attackerId & 31)) >>> 0,
    priority: 0,
    kind: 1,
  };
}
