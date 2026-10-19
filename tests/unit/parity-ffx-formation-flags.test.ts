/**
 * **The flags a formation script sets** (re-parity RC10, lane "FFX formation-script flags"; **FFX only**; `FFX-G06` sections 4.1 to 4.4 and 8, and the
 * battle set-up `FFX.exe` 0x00781020; the handoff is `docs/handoff/re-parity-rc10-ffx-formation-flags.md`).
 *
 * The fixture (`tests/fixtures/parity/ffx/formation_flags.json`) is a static scan of the install's own formation files: the constant argument of every
 * flag call, in code order, for each formation our FFX chapters fight, and for the whole game which formation files make each flag call. Everything below
 * runs against an oracle that imports nothing from `formation-flags.ts`:
 *
 * 1. **The game model.** The battle set-up writes each flag's default, each call stores its argument as the note's emulation shows (a byte keeps the low
 *    8 bits, a bit the lowest), and the one reader of the defending flag returns the character's Defend command id (0x3021) while the flag is non-zero and 0
 *    while it is zero (decompile of 0x0078fb80; the character init that fills the field is 0x0079b4f0). Replaying each formation's writes on that model says
 *    which chapter formations end with Defend off: exactly Isaaru's three.
 * 2. **The data** carries `defendOff` on exactly those three groups, and on no other group of the game.
 * 3. **The engine** offers no Defend row to Yuna or an aeon in those three battles, refuses a submitted Defend with the turn kept open, and leaves every
 *    other FFX chapter's menus alone.
 * 4. **The flags not wired** are not wired for a reason the fixture shows: no formation of our chapters sets them to anything but the default, or does not
 *    set them at all.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Command, Decision, EnemyGroupDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { ISAARU_GROUPS } from '../../src/data/ffx/enemies/isaaru.ts';
import { DARK_AEONS_GROUPS } from '../../src/data/ffx/enemies/dark-aeons-groups.ts';
import { OFFERING_KEYS, openerGroup, possessionGroup, yuYevonLink } from '../../src/data/ffx/enemies/last-summoning-chain.ts';
import { DEFEND_OFF_FLAG, FORMATION_DEFEND_OFF, applyFormationFlags, defendOff, defendRefused, defendTakenFrom } from '../../src/battle/ffx/formation-flags.ts';
import { actor, content, grandSummon, newEngine, nextInput, row, summon, setupFor, type Input } from './helpers/isaaruUnits.ts';
import { createFFXEngine } from '../../src/battle/ffx/index.ts';

// ---------------------------------------------------------------------------------------------------------------------- the fixture

interface Write {
  call: string;
  value: number | null;
  at: string;
}
interface Fixture {
  reset: Record<string, number>;
  setters: Record<string, 'byte' | 'bit'>;
  corpus: Record<string, Record<string, { files: number; calls: number; names: string[] }>>;
  randPosFlagCorpus: { value0Files: number; calls: number; otherValues: string[] };
  chapterFormations: Record<string, { chapter: string; writes: Write[] }>;
}

const FX = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx/formation_flags.json', import.meta.url)), 'utf8')) as Fixture;

/** The three formation files of Isaaru's contest and the engine group each one is (Fist, Wing and Sword are the first, second and third link). */
const ISAARU_FORMATIONS: Readonly<Record<string, string>> = { bvyt09_10: 'isaaru-grothia', bvyt09_11: 'isaaru-pterya', bvyt09_12: 'isaaru-spathi' };

// ---------------------------------------------------------------------------------------------------------------------- the game model

interface World {
  defending: number;
  counter: number;
  anima: number;
  randPos: number;
}

/** The battle set-up (0x00781020) writes the defaults; each formation script then runs its calls in code order. */
function play(writes: readonly Write[]): World {
  const w: World = { defending: FX.reset['setDefendingEnabled'] as number, counter: FX.reset['btlSetCounterFlag'] as number, anima: FX.reset['btlSetAnimaChainOff'] as number, randPos: FX.reset['btlSetRandPosFlag'] as number };
  for (const x of writes) {
    if (x.value === null) throw new Error(`a flag call with a computed argument: ${x.call} at ${x.at}`);
    switch (x.call) {
      case 'setDefendingEnabled':
        w.defending = x.value & 0xff;
        break;
      case 'btlSetCounterFlag':
        w.counter = x.value & 0xff;
        break;
      case 'btlSetAnimaChainOff':
        w.anima = x.value & 1;
        break;
      case 'btlSetRandPosFlag':
        w.randPos = x.value & 1;
        break;
      default:
        break; // SetAmbushState and btlSetEscape: not part of this model (the entry lane and the escape note own them)
    }
  }
  return w;
}

/** 0x0078fb80 with the debug byte clear: the character's Defend command id while the flag is non-zero, else 0. A party member's field is 0x3021 (0x0079b4f0). */
const DEFEND_COMMAND_ID = 0x3021;
function defendIdOf(w: World): number {
  return w.defending !== 0 ? DEFEND_COMMAND_ID : 0;
}

const FORMATIONS = Object.keys(FX.chapterFormations);

describe('the model of the game against the scan', () => {
  it('the set-up defaults and the setters are the ones the note and the set-up routine show', () => {
    expect(FX.reset).toEqual({ setDefendingEnabled: 1, btlSetCounterFlag: 1, btlSetAnimaChainOff: 0, btlSetRandPosFlag: 0 });
    expect(FX.setters).toEqual({ setDefendingEnabled: 'byte', btlSetCounterFlag: 'byte', btlSetAnimaChainOff: 'bit', btlSetRandPosFlag: 'bit' });
    // The setters' arithmetic, worked by hand: 256 stores a zero in a byte, 3 stores a one in a bit.
    expect(play([{ call: 'setDefendingEnabled', value: 256, at: '' }]).defending).toBe(0);
    expect(play([{ call: 'setDefendingEnabled', value: 0x1ff, at: '' }]).defending).toBe(0xff);
    expect(play([{ call: 'btlSetAnimaChainOff', value: 2, at: '' }]).anima).toBe(0);
    expect(play([{ call: 'btlSetAnimaChainOff', value: 3, at: '' }]).anima).toBe(1);
    expect(play([{ call: 'btlSetCounterFlag', value: 0, at: '' }, { call: 'setDefendingEnabled', value: 1, at: '' }]).counter).toBe(0);
  });

  it('the scan covers the 38 formation files our FFX chapters fight, every one with a constant for each flag call', () => {
    expect(FORMATIONS).toHaveLength(38);
    for (const f of FORMATIONS) {
      const entry = FX.chapterFormations[f]!;
      expect(entry.writes.length, f).toBeGreaterThan(0);
      for (const x of entry.writes) expect(x.value, `${f} ${x.call} at ${x.at}`).not.toBeNull();
    }
  });

  it('replayed on the model, exactly Isaaru\'s three formations end with the party\'s Defend off', () => {
    const off = FORMATIONS.filter((f) => defendIdOf(play(FX.chapterFormations[f]!.writes)) === 0).sort();
    expect(off).toEqual(Object.keys(ISAARU_FORMATIONS).sort());
  });

  it('every chapter formation but those ends with the counter flag at its default 1 (no counters off in any chapter) and the random-position flag at its default 0', () => {
    for (const f of FORMATIONS) {
      const w = play(FX.chapterFormations[f]!.writes);
      expect(w.counter, f).toBe(1);
      expect(w.randPos, f).toBe(0);
    }
  });

  it('the Anima chain is switched off by 16 of the chapter formations (Macalania, Omnis, the Sin fights, Braska\'s chain): a model-only flag with no wiring', () => {
    const off = FORMATIONS.filter((f) => play(FX.chapterFormations[f]!.writes).anima === 1).sort();
    expect(off).toEqual(
      ['mcyt06_00', 'sins03_00', 'sins06_00', 'sins07_00', 'sins07_01', 'sins07_02', 'sins07_03', 'sins07_04', 'sins07_05', 'sins07_06', 'sins07_07', 'sins07_10', 'ssbt00_00', 'ssbt01_00', 'ssbt02_00', 'ssbt03_00'].sort(),
    );
  });

  it('the whole-game counts the handoff quotes: who sets what (FFX-G06 section 4.1)', () => {
    const c = FX.corpus;
    expect(c['setDefendingEnabled']!['0']).toMatchObject({ files: 23, calls: 24 });
    expect(c['setDefendingEnabled']!['1']).toMatchObject({ files: 7, calls: 15 });
    expect(c['btlSetCounterFlag']!['0']).toMatchObject({ files: 11, calls: 11 });
    expect(c['btlSetAnimaChainOff']!['1']).toMatchObject({ files: 31, calls: 33 });
    expect(c['btlSetEscape']!['2']).toMatchObject({ files: 8, calls: 8 });
    expect(FX.randPosFlagCorpus).toEqual({ value0Files: 847, calls: 847, otherValues: [] });
    // No chapter formation is among the files that turn the counter flag off or make escape "always".
    expect(c['btlSetCounterFlag']!['0']!.names.filter((n) => FORMATIONS.includes(n))).toEqual([]);
    expect(c['btlSetEscape']!['2']!.names.filter((n) => FORMATIONS.includes(n))).toEqual([]);
    // Of the files that turn Defend off, only Isaaru's three are chapter formations.
    expect(c['setDefendingEnabled']!['0']!.names.filter((n) => FORMATIONS.includes(n)).sort()).toEqual(Object.keys(ISAARU_FORMATIONS).sort());
    expect(c['setDefendingEnabled']!['1']!.names.filter((n) => FORMATIONS.includes(n))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------- the data

function allGroups(): EnemyGroupDef[] {
  return Object.values(ENEMY_GROUPS_BY_ID);
}

describe('the data carries the flag on exactly the groups the model says', () => {
  it('the three Isaaru groups, and no other group of the game, carry defendOff', () => {
    const marked = allGroups().filter((g) => g.defendOff === true).map((g) => g.id).sort();
    expect(marked).toEqual(Object.values(ISAARU_FORMATIONS).sort());
    expect(ISAARU_GROUPS.map((g) => g.defendOff)).toEqual([true, true, true]);
  });

  it('the groups the data builds on demand (the Dark Aeons pool, the Last Summoning chain: opener, every possession link, Yu Yevon) carry none either', () => {
    const built: EnemyGroupDef[] = [...DARK_AEONS_GROUPS, openerGroup(), ...OFFERING_KEYS.map((k) => possessionGroup([k])), yuYevonLink(OFFERING_KEYS)];
    expect(built.length).toBeGreaterThan(20);
    for (const g of built) expect(g.defendOff, g.id).toBeUndefined();
  });

  it('each formation file is the link it is said to be: Fist, Wing and Sword fight Ifrit, Valefor and Bahamut\'s mirror locks', () => {
    const mirror: Record<string, string> = { bvyt09_10: 'ifrit', bvyt09_11: 'valefor', bvyt09_12: 'bahamut' };
    for (const [file, id] of Object.entries(ISAARU_FORMATIONS)) {
      const g = ENEMY_GROUPS_BY_ID[id] as EnemyGroupDef;
      expect(g.lockedAeons?.map((l) => l.aeonId), file).toEqual([mirror[file]]);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------- the engine

function rowKinds(d: Input): string[] {
  return d.commands.map((c) => c.command.kind);
}

describe('the engine: Defend is off for the party and the aeons in Isaaru\'s three battles', () => {
  for (const [file, link] of Object.entries(ISAARU_FORMATIONS)) {
    it(`${file} (${link}): Yuna has no Defend row, a submitted Defend is refused with the turn kept open, and an aeon has none either`, () => {
      const engine = newEngine(link as 'isaaru-grothia', 3);
      expect(engine.state().flags[DEFEND_OFF_FLAG]).toBe(true);
      const d = nextInput(engine)!;
      expect(d.actorId).toBe('yuna');
      expect(rowKinds(d)).not.toContain('defend');
      expect(row(d.commands, 'summon')).toBeDefined(); // the rest of her menu is as it was
      const before = engine.state().log.length;
      const out = engine.submit({ kind: 'defend', targets: [] } as Command);
      expect(out).toEqual([]); // refused with no event: no action, no message (the cue and the words are presentation)
      expect(engine.state().log.length).toBe(before);
      const again = nextInput(engine)!;
      expect(again.actorId).toBe('yuna'); // the turn is still hers
      // An aeon on the field has no Defend row either.
      const aeonId = 'shiva'; // free in all three links: the mirror locks are Ifrit, Valefor and Bahamut
      engine.submit(summon(aeonId));
      const a = nextInput(engine)!;
      expect(a.actorId).toBe(aeonId);
      expect(rowKinds(a)).not.toContain('defend');
      expect(engine.submit({ kind: 'defend', targets: [] } as Command)).toEqual([]);
      expect(nextInput(engine)!.actorId).toBe(aeonId);
    });
  }

  it('the flag is in the battle state, so a fork (the dry runs of the move advisor) sees it; Grand Summon and the rest of the duel rules are untouched', () => {
    const engine = newEngine('isaaru-grothia', 4);
    const fork = (engine as ReturnType<typeof createFFXEngine>).fork(99); // the advisor's dry runs fork the engine and read the same state
    expect(fork.state().flags[DEFEND_OFF_FLAG]).toBe(true);
    expect(nextInput(fork)!.commands.some((c) => c.command.kind === 'defend')).toBe(false);
    expect(nextInput(engine)!.actorId).toBe('yuna');
    engine.submit(grandSummon('shiva')); // the duel's other rules ride on the same state and still work
    expect(actor(engine, 'yuna').overdrive?.gauge).toBeDefined();
    expect(nextInput(engine)!.actorId).toBe('shiva');
  });

  it('the link carries no stale state: the flag is read from the group of each link', () => {
    for (const id of Object.values(ISAARU_FORMATIONS)) expect(newEngine(id as 'isaaru-grothia', 5).state().flags[DEFEND_OFF_FLAG]).toBe(true);
  });

  it('with the field taken off the group (the switch for one formation), Yuna has her Defend row again and it works', () => {
    const group = { ...(ENEMY_GROUPS_BY_ID['isaaru-grothia'] as EnemyGroupDef) };
    delete (group as { defendOff?: boolean }).defendOff;
    const setup = { ...setupFor('isaaru-grothia', 6), enemies: group };
    const e = createFFXEngine({ content, autoResolveMinigames: true });
    e.init(setup);
    expect(e.state().flags[DEFEND_OFF_FLAG]).toBeUndefined();
    const d = nextInput(e)!;
    expect(rowKinds(d)).toContain('defend');
    const out = e.submit({ kind: 'defend', targets: [] } as Command);
    expect(out.some((x) => x.type === 'action-start')).toBe(true);
  });

  it('the pure rule: only the party and the aeons lose it, only a Defend is refused, and the switch is on', () => {
    expect(FORMATION_DEFEND_OFF).toBe(true);
    const ctx = { state: { flags: {} as Record<string, unknown> } } as never;
    const on = { state: { flags: { [DEFEND_OFF_FLAG]: true } } } as never;
    const mk = (side: string) => ({ side }) as unknown as FFXCombatant;
    expect(defendOff(ctx)).toBe(false);
    expect(defendOff(on)).toBe(true);
    expect(defendTakenFrom(on, mk('party'))).toBe(true);
    expect(defendTakenFrom(on, mk('aeon'))).toBe(true);
    expect(defendTakenFrom(on, mk('enemy'))).toBe(false);
    expect(defendTakenFrom(ctx, mk('party'))).toBe(false);
    expect(defendRefused(on, mk('party'), { kind: 'defend', targets: [] } as Command)).toBe(true);
    expect(defendRefused(on, mk('party'), { kind: 'attack', targets: [] } as Command)).toBe(false);
    expect(defendRefused(on, mk('enemy'), { kind: 'defend', targets: [] } as Command)).toBe(false);
    expect(defendRefused(ctx, mk('party'), { kind: 'defend', targets: [] } as Command)).toBe(false);
    // applyFormationFlags copies only a group that asks for it.
    applyFormationFlags(ctx, { id: 'x', game: 'ffx', enemies: [] } as unknown as EnemyGroupDef);
    expect(defendOff(ctx)).toBe(false);
    applyFormationFlags(ctx, { id: 'x', game: 'ffx', enemies: [], defendOff: true } as unknown as EnemyGroupDef);
    expect(defendOff(ctx)).toBe(true);
  });
});

describe('every other FFX chapter plays as it did: its first menu still offers Defend to every active member', () => {
  const CHAPTERS = [
    'seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus', 'seymour-omnis',
    'sin-fins-core', 'sin-face', 'sinspawn-gui', 'biran-yenke', 'mirror-aeons', 'exp-fayth',
  ];
  beforeAll(async () => {
    await registerBattleContent();
  });
  for (const id of CHAPTERS) {
    it(`${id}: Defend on the first menu, no formation flag in the state`, () => {
      const chapter = getChapter(id)!;
      expect(chapter.game).toBe('ffx');
      const setup = setupForChapter(chapter, 1);
      const engine = new FFXEngine({ autoResolveMinigames: true });
      engine.setSeed(setup.seed);
      engine.init(setup);
      expect(engine.state().flags[DEFEND_OFF_FLAG]).toBeUndefined();
      let d: Decision = engine.nextDecision();
      for (let i = 0; i < 400 && d.kind !== 'player-input' && d.kind !== 'battle-over'; i++) d = engine.nextDecision();
      expect(d.kind).toBe('player-input');
      if (d.kind === 'player-input') expect(d.commands.some((c) => c.command.kind === 'defend' && c.enabled)).toBe(true);
    });
  }

  it('and Isaaru\'s chapter, set up the way the app sets it up, has the flag from the first link', () => {
    const chapter = getChapter('isaaru-via-purifico')!;
    const setup = setupForChapter(chapter, 1);
    const engine = new FFXEngine({ autoResolveMinigames: true });
    engine.setSeed(setup.seed);
    engine.init(setup);
    expect(engine.state().flags[DEFEND_OFF_FLAG]).toBe(true);
  });
});
