/**
 * FFX end-of-battle save: what the game writes back into each party member's and aeon's save record when a battle ends
 * (`FUN_00785fc0`, VA 0x00785fc0, run by the battle frame after the AP settle), and the rebuild of the ten aeons that
 * follows it.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-overdrive-steal-aeons.md` section 4. Pure, deterministic, not wired into the engine. The vectors in
 * `tests/fixtures/parity/ffx/aeon_settle.json` run the whole function in the emulator and compare the party records, the
 * rebuilt aeons and the remembered party list and order.
 *
 * In order: the party lists parked by a summon are put back ({@link restoreLists}); the first three entries of the active
 * list and the 17-entry party order table are remembered for the next battle; then, for each of slots 0 to 0x11, the
 * character's gear ids, HP, MP, recovery counter and Overdrive state go into the save record ({@link saveCharacter});
 * finally slots 8 to 0x11 are rebuilt from Yuna's stats ({@link aeonStats}), which also clamps the HP and MP just written to
 * the new maxima.
 */

import { clamp } from './ap-award.ts';
import { restoreLists, type PartyWorld } from './aeon-party.ts';
import {
  aeonStats,
  type AbilityEffect,
  type AeonRow,
  type AeonStatsResult,
  type AssureRow,
  type PartyRawStats,
} from './aeon-stats.ts';

/** What the end-of-battle save reads of one battle character. */
export interface BattleChr {
  /** `Chr+0x5d0` (signed): current HP. */
  hp: number;
  /** `Chr+0x5d4`: current MP. */
  mp: number;
  /** `Chr+0x6d8`: the recovery counter (battles a fallen aeon stays away). */
  recover: number;
  /** `Chr+0x592`, `Chr+0x593`: weapon and armor ids. */
  weaponId: number;
  armorId: number;
  /** `Chr+0x5bb`, `Chr+0x5bc`, `Chr+0x5bd`: Overdrive mode, gauge and maximum. */
  odMode: number;
  odGauge: number;
  odMax: number;
}

/** The save-record bytes it writes (record = 0x94 bytes at VA 0x0113205c + id * 0x94). */
export interface SaveSlot {
  /** +0x1c, +0x20: current HP and MP. */
  hp: number;
  mp: number;
  /** +0x24, +0x28: maximum HP and MP (the clamp bounds; the aeon rebuild replaces them afterwards). */
  maxHp: number;
  maxMp: number;
  /** +0x3d: the recovery counter. */
  recover: number;
  /** +0x2d, +0x2e: weapon and armor ids. */
  weaponId: number;
  armorId: number;
  /** +0x38, +0x39, +0x3a: Overdrive mode, gauge and maximum. */
  odMode: number;
  odGauge: number;
  odMax: number;
}

/**
 * The per-character part of the save. HP: a character at 0 HP or below with no recovery counter is saved with 1 HP, one
 * with a counter keeps its 0. MP is saved as it is. A character with a recovery counter has it counted down by one; when
 * that makes it 0 the character is saved at full HP and MP (the save record's maxima) and the counter is 0. HP and MP are
 * then clamped to the save record's maxima. The gear ids and the Overdrive state go back unchanged.
 */
export function saveCharacter(chr: BattleChr, save: SaveSlot): void {
  save.weaponId = chr.weaponId & 0xff;
  save.armorId = chr.armorId & 0xff;
  let counter = chr.recover & 0xff;
  let hp = chr.hp < 1 && counter === 0 ? 1 : chr.hp | 0;
  let mp = chr.mp | 0;
  if (counter !== 0) {
    counter -= 1;
    if (counter < 1) {
      hp = save.maxHp | 0;
      mp = save.maxMp | 0;
      counter = 0;
    }
  }
  save.recover = counter;
  save.hp = clamp(hp, 0, save.maxHp | 0);
  save.mp = clamp(mp, 0, save.maxMp | 0);
  save.odMode = chr.odMode & 0xff;
  save.odGauge = chr.odGauge & 0xff;
  save.odMax = chr.odMax & 0xff;
}

/** What the rebuild of one aeon needs besides Yuna's stats and the battle count. */
export interface AeonBuild {
  bonus: { hp: number; mp: number; stats: readonly number[] };
  row: AeonRow;
  assure: AssureRow | null;
  abilities: readonly AbilityEffect[];
}

export interface SettleResult {
  /** The first three entries of the active list, remembered for the next battle (VA 0x011307e8). */
  list: number[];
  /** The party order table, remembered (VA 0x011307eb). */
  roster: number[];
  /** The rebuilt aeons by slot (8 to 0x11). */
  aeons: Record<number, AeonStatsResult>;
}

/**
 * `FUN_00785fc0()`: the whole end-of-battle save. `chrs` and `saves` hold slots 0 to 0x11; the saves are changed in place
 * (the aeons' maxima and current values are those of the rebuild).
 */
export function settleBattle(
  w: PartyWorld,
  chrs: readonly BattleChr[],
  saves: SaveSlot[],
  yuna: PartyRawStats,
  battles: number,
  builds: Readonly<Record<number, AeonBuild>>,
): SettleResult {
  restoreLists(w);
  const list = w.active.slice(0, 3);
  const roster = w.roster.slice();
  for (let id = 0; id < 0x12; id++) saveCharacter(chrs[id] as BattleChr, saves[id] as SaveSlot);
  const aeons: Record<number, AeonStatsResult> = {};
  for (let id = 8; id < 0x12; id++) {
    const s = saves[id] as SaveSlot;
    const b = builds[id] as AeonBuild;
    const r = aeonStats({
      slot: id,
      yuna,
      bonus: b.bonus,
      current: { hp: s.hp, mp: s.mp },
      row: b.row,
      battles,
      assure: b.assure,
      abilities: b.abilities,
    });
    s.maxHp = r.maxHp;
    s.maxMp = r.maxMp;
    s.hp = r.current.hp;
    s.mp = r.current.mp;
    aeons[id] = r;
  }
  return { list, roster, aeons };
}
