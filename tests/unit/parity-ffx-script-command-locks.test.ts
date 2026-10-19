/**
 * **The commands a monster's own script switches off** (re-parity RC10, lane "FFX script command locks"; **FFX only**; the script call `setCommandDisabled`, `FFX.exe` 0x007A6EF0 /
 * 0x0079B470 / 0x0079A080; the handoff is `docs/handoff/re-parity-rc10-ffx-script-command-locks.md`).
 *
 * The fixture (`tests/fixtures/parity/ffx/monster_command_disables.json`) is a static scan of the install's own monster files: the constant arguments of every `setCommandDisabled`
 * call of the 361 FFX monster scripts (actor spec, command id, flag), the function and hook each call sits in, and which of the 863 battle files hold the monster. Everything below runs
 * against an oracle that imports nothing from `formation-commands.ts`:
 *
 * 1. **The corpus.** Exactly 18 monster scripts make the call (81 calls). Of them only the ten possessed aeons and Magus Sisters (m163 to m169, m178 to m180) are held by a formation of one
 *    of our chapters (`sins07_00` to `sins07_07`); Tros, Geosgaeno, Negator, m211 and the Mimics are in no formation of ours and make their calls in a fight hook (onTurn, onHit, onTargeted,
 *    onDeath), not at the start.
 * 2. **The game model.** The setter (0x0079B470) has two branches: an id below 0x1000 stores the flag in the availability byte of that aeon's character; the summon menu's gate (0x0079A080)
 *    treats a 0 byte as "cannot be summoned". Replaying each possessed script's init hook on the model says which aeon each one takes from Yuna.
 * 3. **The data** carries `scriptCommandDisables` on exactly Chapter III's five possession links, equal to the model's, and on no other group of the game; the Last Summoning carries the same
 *    lock the other way (`lockedAeons`, its own aeon among them) and none of this field.
 * 4. **The engine** is `parity-ffx-script-command-locks-engine.test.ts`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { EnemyGroupDef } from '../../src/battle/common/types.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { POSSESSED_SCRIPT_LOCK_ID, possessedScriptDisables } from '../../src/data/ffx/enemies/possessed-script-locks.ts';
import { possessedAeonGroups } from '../../src/data/ffx/enemies/braskas-final-aeon.ts';
import { DARK_AEONS_GROUPS } from '../../src/data/ffx/enemies/dark-aeons-groups.ts';
import { ISAARU_GROUPS } from '../../src/data/ffx/enemies/isaaru.ts';
import { OFFERING_KEYS, openerGroup, possessionGroup, yuYevonLink } from '../../src/data/ffx/enemies/last-summoning-chain.ts';
import { AEON_SLOT } from '../../src/battle/ffx/adapt/slots.ts';
import { aeonUnavailable } from '../../src/battle/ffx/kernel/aeon-party.ts';

// ---------------------------------------------------------------------------------------------------------------------- the fixture

interface Call {
  at: string;
  fn: string;
  hook: string;
  who: number | null;
  command: number | null;
  flag: number | null;
}
interface Monster {
  name: string | null;
  calls: Call[];
  fights: string[];
  chaptersWhichFightIt: string[];
}
interface Fixture {
  corpus: { monsterFilesScanned: number; battleFilesScanned: number; monsterFilesWithCalls: number; totalCalls: number };
  monsters: Record<string, Monster>;
}
const FX = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx/monster_command_disables.json', import.meta.url)), 'utf8')) as Fixture;
const MONSTERS = Object.keys(FX.monsters);

/** The possessed aeons and Sisters, by the script file: m163 Valefor ... m169 Yojimbo, m178 to m180 the Sisters. */
const POSSESSED: Readonly<Record<string, string>> = {
  m163: 'possessed-valefor', m164: 'possessed-ifrit', m165: 'possessed-ixion', m166: 'possessed-shiva', m167: 'possessed-bahamut', m168: 'possessed-anima', m169: 'possessed-yojimbo',
  m178: 'possessed-cindy', m179: 'possessed-sandy', m180: 'possessed-mindy',
};
/** The game's aeon slots (the character table: 8 Valefor ... 14 Yojimbo, 15 to 17 the Sisters). */
const AEON_BY_SLOT: Readonly<Record<number, string>> = { 8: 'valefor', 9: 'ifrit', 10: 'ixion', 11: 'shiva', 12: 'bahamut', 13: 'anima', 14: 'yojimbo', 15: 'cindy', 16: 'sandy', 17: 'mindy' };

// ---------------------------------------------------------------------------------------------------------------------- the game model

/** The setter's aeon branch (0x0079B470, `id >> 12 == 0`): a byte store into the aeon's availability byte. Replays the init hook of one monster in code order. */
function availabilityAfterInit(m: Monster): Map<number, number> {
  const availability = new Map<number, number>();
  for (const c of m.calls) {
    if (c.hook !== 'init' || c.command === null || c.flag === null) continue;
    if (c.command >> 12 === 0) availability.set(c.command & 0xfff, c.flag & 0xff);
  }
  return availability;
}

/** The gate (0x0079A080) for a standing aeon with no recovery count, given the availability byte: the kernel's own function, so the model and the engine cannot drift together. */
const usable = (byte: number): boolean => aeonUnavailable({ hp: 1, avail: byte, blocked: 0, recover: 0 } as Parameters<typeof aeonUnavailable>[0]) === 0;

describe('the corpus: which monster scripts call setCommandDisabled, and which of them our chapters fight', () => {
  it('exactly 18 of the 361 monster scripts make the call, 81 calls in all, and the scan covers all 863 battle files', () => {
    expect(FX.corpus).toEqual({ monsterFilesScanned: 361, battleFilesScanned: 863, monsterFilesWithCalls: 18, totalCalls: 81 });
    expect(MONSTERS).toEqual(['m101', 'm109', 'm123', 'm163', 'm164', 'm165', 'm166', 'm167', 'm168', 'm169', 'm178', 'm179', 'm180', 'm211', 'm251', 'm252', 'm253', 'm256']);
    expect(Object.values(FX.monsters).reduce((n, m) => n + m.calls.length, 0)).toBe(81);
    expect(Object.fromEntries(MONSTERS.map((k) => [k, FX.monsters[k]!.calls.length]))).toEqual({
      m101: 6, m109: 33, m123: 12, m163: 1, m164: 1, m165: 1, m166: 1, m167: 1, m168: 1, m169: 1, m178: 1, m179: 1, m180: 1, m211: 12, m251: 2, m252: 2, m253: 2, m256: 2,
    });
  });

  it('only the ten possessed aeons and Sisters are held by a formation of one of our chapters', () => {
    const reached = MONSTERS.filter((k) => FX.monsters[k]!.chaptersWhichFightIt.length > 0);
    expect(reached).toEqual(Object.keys(POSSESSED));
    // Chapter III fights the five mandatory aeons (sins07_00 to _04); the hidden Last Summoning all ten bodies.
    for (const [k, chapters] of Object.entries({ m163: 2, m164: 2, m165: 2, m166: 2, m167: 2, m168: 1, m169: 1, m178: 1, m179: 1, m180: 1 })) {
      expect(FX.monsters[k]!.chaptersWhichFightIt, k).toHaveLength(chapters);
      expect(FX.monsters[k]!.chaptersWhichFightIt, k).toContain('last-summoning');
    }
    for (const k of ['m163', 'm164', 'm165', 'm166', 'm167']) expect(FX.monsters[k]!.chaptersWhichFightIt, k).toContain('braskas-final-aeon');
    // Everything else is in no formation of ours, and its battle files are not the ones our chapters fight.
    for (const k of MONSTERS.filter((m) => !(m in POSSESSED))) {
      expect(FX.monsters[k]!.chaptersWhichFightIt, k).toEqual([]);
      expect(FX.monsters[k]!.fights.length, k).toBeGreaterThan(0);
      expect(FX.monsters[k]!.fights.some((f) => f.startsWith('sins') || f.startsWith('dome') || f.startsWith('bvyt')), k).toBe(false);
    }
  });

  it('the possessed scripts make one init-hook call each (an aeon id, flag 0); the other eight make theirs in a fight hook', () => {
    for (const k of Object.keys(POSSESSED)) {
      const m = FX.monsters[k]!;
      expect(m.calls, k).toHaveLength(1);
      expect(m.calls[0], k).toMatchObject({ hook: 'init', who: 1, flag: 0 });
      expect(m.calls[0]!.command, k).toBeLessThan(0x1000);
    }
    for (const k of MONSTERS.filter((m) => !(m in POSSESSED))) {
      const hooks = new Set(FX.monsters[k]!.calls.map((c) => c.hook));
      expect(hooks.has('init'), k).toBe(false);
      for (const h of hooks) expect(['onTurn', 'onHit', 'onTargeted', 'onDeath'], `${k} ${h}`).toContain(h);
    }
  });
});

describe('the game model: each possessed script takes its own aeon from Yuna and no other', () => {
  it('replaying an init hook leaves exactly one aeon at availability 0, the aeon that copy is, and the gate refuses it', () => {
    for (const [k, id] of Object.entries(POSSESSED)) {
      const availability = availabilityAfterInit(FX.monsters[k]!);
      expect([...availability.entries()], k).toEqual([[AEON_SLOT[id.replace('possessed-', '')]!, 0]]);
      const slot = [...availability.keys()][0]!;
      expect(AEON_BY_SLOT[slot], k).toBe(id.replace('possessed-', ''));
      expect(usable(availability.get(slot)!), k).toBe(false);
      expect(usable(1), 'a byte left at 1 is summonable').toBe(true);
    }
  });

  it('the engine id table (AEON_SLOT) is the model\'s aeon table', () => {
    expect(AEON_SLOT).toEqual(Object.fromEntries(Object.entries(AEON_BY_SLOT).map(([slot, key]) => [key, Number(slot)])));
  });
});

describe('the data: Chapter III\'s five possession links carry the lock, nothing else does', () => {
  const MODEL: Readonly<Record<string, number>> = Object.fromEntries(
    Object.entries(POSSESSED).map(([k, id]) => [id, [...availabilityAfterInit(FX.monsters[k]!).keys()][0]!]),
  );

  it('the data\'s table equals what the model says for all ten bodies', () => {
    expect(POSSESSED_SCRIPT_LOCK_ID).toEqual(MODEL);
    for (const [id, command] of Object.entries(MODEL)) expect(possessedScriptDisables(id)).toEqual([{ who: 'yuna', command }]);
    expect(possessedScriptDisables('yu-yevon')).toBeUndefined();
    expect(possessedScriptDisables('braskas-final-aeon')).toBeUndefined();
  });

  it('Chapter III\'s possession links (the five mandatory aeons) carry exactly the one row of their own aeon', () => {
    const ids = possessedAeonGroups.map((g) => g.id);
    expect(ids).toEqual(['possessed-valefor', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-bahamut']);
    for (const g of possessedAeonGroups) expect(g.scriptCommandDisables, g.id).toEqual([{ who: 'yuna', command: MODEL[g.id]! }]);
    // and they are the groups the game data registers
    for (const id of ids) expect(ENEMY_GROUPS_BY_ID[id]?.scriptCommandDisables, id).toEqual(possessedAeonGroups.find((g) => g.id === id)!.scriptCommandDisables);
  });

  it('no other group of the game carries the field, the groups built on demand included', () => {
    const everyGroup: EnemyGroupDef[] = [
      ...Object.values(ENEMY_GROUPS_BY_ID),
      ...DARK_AEONS_GROUPS,
      ...ISAARU_GROUPS,
      openerGroup(),
      ...OFFERING_KEYS.map((k) => possessionGroup([k])),
      possessionGroup([...OFFERING_KEYS]),
      yuYevonLink([...OFFERING_KEYS]),
    ];
    const carrying = everyGroup.filter((g) => g.scriptCommandDisables !== undefined).map((g) => g.id);
    expect([...new Set(carrying)].sort()).toEqual(['possessed-bahamut', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-valefor']);
  });

  it('the Last Summoning is the same lock the other way: every link locks the aeons given up, its own among them, and carries no script row', () => {
    for (const [i, key] of OFFERING_KEYS.entries()) {
      const order = OFFERING_KEYS.slice(0, i + 1);
      const g = possessionGroup(order);
      const locked = (g.lockedAeons ?? []).map((l) => l.aeonId);
      const own = key === 'sisters' ? ['cindy', 'sandy', 'mindy'] : [key];
      for (const aeon of own) expect(locked, `${key} locks ${aeon}`).toContain(aeon);
      expect(g.scriptCommandDisables, key).toBeUndefined();
    }
  });
});
