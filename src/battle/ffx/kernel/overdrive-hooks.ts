/**
 * FFX Overdrive gauge kernel, part 2: the hooks that decide how much each of the 17 modes (and the aeons' own mode)
 * gains, and when. One hook per kind of event, in the game's own order and with its own integer arithmetic.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-overdrive-steal-aeons.md` section 1. Not wired into the engine. Pure, deterministic.
 *
 * | Hook | VA | Called by | Modes |
 * |---|---|---|---|
 * | {@link odOnHpChange} | 0x007b0d50 | `pp_BtlApplyHitRecords`, for every hit, BEFORE the HP changes | 0 Warrior, 1 Comrade, 2 Stoic, 3 Healer, aeon |
 * | {@link odOnDeath} | 0x007b0f80 | `pp_BtlDamageCheckDeath` | 7 Avenger, 8 Slayer, 9 Hero |
 * | {@link odOnOutcome} | 0x007b12c0 | `pp_BtlApplyHitRecords`, after the HP changed | 4 Tactician, 5 Victim, 6 Dancer, 10 Rook |
 * | {@link odOnTurn} | 0x007b13c0 | the CTB scheduler, when it queues a turn | 13 Ally, 14 Sufferer, 15 Daredevil, 16 Loner |
 * | {@link odOnVictory} | 0x007b1540 | the battle-end state (0x007917d0) | 11 Victor |
 * | {@link odOnEscape} | 0x007b1090 | a successful flee (0x007ae370, group flee 0x007ada60) | 12 Coward |
 *
 * Every hook first runs the learning counter of the mode it concerns for the characters it concerns, whether or
 * not the character has that mode, and only then adds the gain for a character who does. The gain itself goes
 * through `odAdd`, so Curse, a dead or Petrified character, Shield, the multipliers and the AP conversion all apply.
 */

import { isMonster, type OdWorld, odAdd, odModeCounter, OdMode, weakLevel, type OdSlot } from './overdrive.ts';
import { mul, sdiv, udiv } from './int32.ts';

/** `(udiv(x, d) + 1) | 0`: the "+1" the HP-scaled gains share (the quotient is unsigned, the sum wraps). */
function scaled(x: number, d: number): number {
  return (udiv(x, d) + 1) | 0;
}

/**
 * `pp_BtlOdOnHpChange(userId, userChr, targetId, targetChr, hp, base, gate)` (0x007b0d50). `hp` is the signed HP
 * change of one hit record (positive = damage to the target, negative = healing, 0 = nothing or a miss), `base` the
 * record's base damage (before elements and modifiers), `gate` the result block's byte 6 (1 when the command carries
 * the "charges Overdrive" flag, bit 0x01000000 of the command's misc word). The slots are read BEFORE the hit's HP
 * change is applied. Returns what the game returns (a count of the characters the hook looked at; no caller uses it).
 *
 * In order:
 *   1. An aeon (mode 0x13) hit by a monster with a non-negative `hp` gains `base * 18 / maxHP + 1` (a miss, hp 0, counts).
 *   2. Damage (`hp` > 0) by a monster against a party member or aeon: that target's Stoic counter runs, and a Stoic
 *      gains `hp * 30 / maxHP + 1`; then for each other party member 0 to 6 who is in the battle the Comrade counter
 *      runs and a Comrade gains `hp * 20 / (victim's maxHP) + 1`. Returns 1 plus the number of those others.
 *   3. Healing (`hp` < 0) by a party member or aeon of a different non-monster: the Healer counter runs; a Healer
 *      gains `min(heal, missing HP) * 16 / (target's maxHP) + 1` (unsigned division). Returns 1.
 *   4. Damage by a party member or aeon against a monster: returns 1; when `gate` is not 0 the Warrior counter runs;
 *      a Warrior gains `min(hp * 10 / ref + 1, 16)`, an aeon gains `((hp * 16) / ref) / 10 + 1` with no cap.
 */
export function odOnHpChange(w: OdWorld, userId: number, targetId: number, hp: number, base: number, gate: number): number {
  const user = w.slots[userId] as OdSlot;
  const target = w.slots[targetId] as OdSlot;
  const userMon = isMonster(userId);
  const targetMon = isMonster(targetId);
  let ret = 0;

  if (target.mode === OdMode.Aeon && hp >= 0 && userMon && !targetMon) {
    odAdd(w, targetId, scaled(mul(base, 18), target.maxHp));
  }

  if (hp > 0) {
    if (userMon) {
      if (targetMon) return 0;
      odModeCounter(w, targetId, OdMode.Stoic, 0);
      if (target.mode === OdMode.Stoic) odAdd(w, targetId, scaled(mul(hp, 30), target.maxHp));
      let count = 1;
      for (let j = 0; j < 7; j++) {
        const other = w.slots[j] as OdSlot;
        if (other.inBattle && j !== targetId) {
          count++;
          odModeCounter(w, j, OdMode.Comrade, 0);
          if (other.mode === OdMode.Comrade) odAdd(w, j, scaled(mul(hp, 20), target.maxHp));
        }
      }
      return count;
    }
    if (!targetMon) return 0;
    ret = 1;
    if (gate !== 0) {
      odModeCounter(w, userId, OdMode.Warrior, 0);
      if (user.mode === OdMode.Warrior) {
        let g = (sdiv(mul(hp, 10), user.refDamage) + 1) | 0;
        if (g > 16) g = 16;
        odAdd(w, userId, g);
      }
      if (user.mode === OdMode.Aeon) {
        odAdd(w, userId, (sdiv(sdiv(hp << 4, user.refDamage), 10) + 1) | 0);
        return 1;
      }
    }
    return ret;
  }

  if (hp === 0 || userMon || targetMon || userId === targetId) return ret;
  odModeCounter(w, userId, OdMode.Healer, 0);
  ret = 1;
  if (user.mode === OdMode.Healer) {
    let heal = -hp | 0;
    const missing = (target.maxHp - target.hp) | 0;
    if (heal > missing) heal = missing;
    odAdd(w, userId, scaled(heal << 4, target.maxHp));
  }
  return ret;
}

/**
 * `pp_BtlOdOnDeath(killerId, killerChr, victimId, victimChr)` (0x007b0f80).
 *   - A monster kills a party member or aeon: for each party member 0 to 6 who is in the battle and is not the victim
 *     the Avenger counter runs, and an Avenger gains 30. Returns how many.
 *   - A party member or aeon kills a monster: the Slayer counter runs, a Slayer gains 20; the Hero counter runs when
 *     the monster's maximum HP is above 20 times the killer's reference damage or is 10000 or more (signed
 *     compares); a Hero gains 20 when the monster's maximum HP is above 3 times the reference damage (unsigned).
 * Returns 0 in every other combination.
 */
export function odOnDeath(w: OdWorld, killerId: number, victimId: number): number {
  const killer = w.slots[killerId] as OdSlot;
  const victim = w.slots[victimId] as OdSlot;
  const killerMon = isMonster(killerId);
  const victimMon = isMonster(victimId);
  if (killerMon) {
    if (victimMon) return 0;
    let count = 0;
    for (let j = 0; j < 7; j++) {
      const other = w.slots[j] as OdSlot;
      if (other.inBattle && j !== victimId) {
        count++;
        odModeCounter(w, j, OdMode.Avenger, 0);
        if (other.mode === OdMode.Avenger) odAdd(w, j, 30);
      }
    }
    return count;
  }
  if (!victimMon) return 0;
  odModeCounter(w, killerId, OdMode.Slayer, 0);
  if (killer.mode === OdMode.Slayer) odAdd(w, killerId, 20);
  const ref = killer.refDamage;
  if (victim.maxHp > mul(ref, 20) || victim.maxHp >= 10000) odModeCounter(w, killerId, OdMode.Hero, 0);
  if (killer.mode === OdMode.Hero && victim.maxHp >>> 0 > mul(ref, 3) >>> 0) odAdd(w, killerId, 20);
  return 0;
}

/**
 * `pp_BtlOdOnOutcome(userId, userChr, targetId, targetChr, badStatuses, outcome)` (0x007b12c0). `badStatuses` is the
 * hit record's byte 4 as a SIGNED byte (the count of harmful statuses the hit applied), `outcome` its byte 3 (bit 0:
 * the hit missed, bit 1: Shell or Protect reduced it).
 *   - A monster hits a party member or aeon: with `badStatuses` above 0 the Victim counter runs (also for a dead
 *     target) and a Victim gains 16; with outcome bit 0 the Dancer counter runs and a Dancer gains 16; with bit 1 the
 *     Rook counter runs and a Rook gains 10. Returns how many of the three fired.
 *   - A party member or aeon hits a monster with `badStatuses` above 0: the Tactician counter runs and a Tactician
 *     gains 16. Returns 1.
 */
export function odOnOutcome(w: OdWorld, userId: number, targetId: number, badStatuses: number, outcome: number): number {
  const user = w.slots[userId] as OdSlot;
  const target = w.slots[targetId] as OdSlot;
  const userMon = isMonster(userId);
  const targetMon = isMonster(targetId);
  let count = 0;
  if (userMon) {
    if (targetMon) return 0;
    if (badStatuses > 0) {
      odModeCounter(w, targetId, OdMode.Victim, 1);
      count = 1;
      if (target.mode === OdMode.Victim) odAdd(w, targetId, 16);
    }
    if ((outcome & 1) !== 0) {
      count++;
      odModeCounter(w, targetId, OdMode.Dancer, 1);
      if (target.mode === OdMode.Dancer) odAdd(w, targetId, 16);
    }
    if ((outcome & 2) !== 0) {
      count++;
      odModeCounter(w, targetId, OdMode.Rook, 1);
      if (target.mode === OdMode.Rook) odAdd(w, targetId, 10);
    }
    return count;
  }
  if (targetMon && badStatuses > 0) {
    odModeCounter(w, userId, OdMode.Tactician, 0);
    if (user.mode === OdMode.Tactician) odAdd(w, userId, 16);
    return 1;
  }
  return 0;
}

/**
 * `pp_BtlOdOnTurn(id, chr)` (0x007b13c0): runs at the start of a turn (the scheduler calls it for every character
 * whose turn it queues; ids above 6 do nothing). In order: the Ally counter, and an Ally gains 3; if the HP is below
 * half (`weakLevel` at least 1) the Daredevil counter, and a Daredevil gains 5; if no OTHER slot among the first 0x12
 * (party and aeons) is in the battle, takes turns, is alive and is not Petrified, the Loner counter, and a Loner gains
 * 16; if the character has Zombie, Poison, Confuse, Sleep, Silence, Darkness, Slow or Doom, the Sufferer counter, and
 * a Sufferer gains 16. Returns 1 plus one for each of Daredevil, Loner and Sufferer that applied.
 */
export function odOnTurn(w: OdWorld, id: number): number {
  if (id >>> 0 > 6) return 0;
  const c = w.slots[id] as OdSlot;
  let ret = 1;
  odModeCounter(w, id, OdMode.Ally, 0);
  if (c.mode === OdMode.Ally) odAdd(w, id, 3);
  if (weakLevel(c.hp, c.maxHp) >= 1) {
    ret = 2;
    odModeCounter(w, id, OdMode.Daredevil, 0);
    if (c.mode === OdMode.Daredevil) odAdd(w, id, 5);
  }
  let others = 0;
  for (let j = 0; j < 0x12; j++) {
    if (j === id) continue;
    const o = w.slots[j] as OdSlot;
    if (o.inBattle && o.getsTurns && !o.dead && !o.stoned) others++;
  }
  if (others === 0) {
    ret++;
    odModeCounter(w, id, OdMode.Loner, 0);
    if (c.mode === OdMode.Loner) odAdd(w, id, 16);
  }
  const sufferer =
    (c.perm & 0x0a) !== 0 || (c.perm & 0x100) !== 0 || c.sleep !== 0 || c.silence !== 0 || c.darkness !== 0 || c.slow !== 0 || (c.extra & 0x4000) !== 0;
  if (!sufferer) return ret;
  odModeCounter(w, id, OdMode.Sufferer, 0);
  if (c.mode === OdMode.Sufferer) odAdd(w, id, 16);
  return ret + 1;
}

/**
 * `pp_BtlOdOnVictory()` (0x007b1540): for each party member 0 to 6 who is in the battle (dead or not) the Victor
 * counter runs and a Victor gains 20. Returns how many were in the battle. The caller is the battle-end state.
 */
export function odOnVictory(w: OdWorld): number {
  let count = 0;
  for (let j = 0; j < 7; j++) {
    const c = w.slots[j] as OdSlot;
    if (c.inBattle) {
      count++;
      odModeCounter(w, j, OdMode.Victor, 0);
      if (c.mode === OdMode.Victor) odAdd(w, j, 20);
    }
  }
  return count;
}

/** `pp_BtlOdOnEscape(id, chr)` (0x007b1090): the Coward counter runs and a Coward gains 10. Returns 0. */
export function odOnEscape(w: OdWorld, id: number): number {
  const c = w.slots[id] as OdSlot;
  odModeCounter(w, id, OdMode.Coward, 0);
  if (c.mode === OdMode.Coward) odAdd(w, id, 10);
  return 0;
}
