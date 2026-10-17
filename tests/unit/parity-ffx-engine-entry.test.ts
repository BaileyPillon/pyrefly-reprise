/**
 * **Battle entry and exit at the engine** (re-parity RC8, lane FFX-L; **FFX only**; `research/re-ffx-battle-entry.md`).
 *
 * `parity-ffx-entry.test.ts` proves the kernels against the game. This file proves the WIRING, against oracles that import
 * nothing from `adapt/entry.ts` or `results.ts`:
 *
 * 1. **L2 and L1, the draws a battle makes on its way in.** Every group of every FFX chapter (the eleven and the hidden Gui chapter, every
 *    link of every chain) is built on the engine's game generator with a tap on every draw. The tap must read: one draw of stream 1 (the
 *    start-type roll), the placement shuffle of the formation if it has one (the streams the note lists, typed in again here: Chapter VII
 *    28 28 28 30, Chapter XII 29 29 29 29 29 30 31 32, the Gui fights 30 30 30 31), then the 26 opening draws (party slots 20 to 26, slot 7 and
 *    ten aeons on 27, the monsters 28 to 35), each on its stream and each equal to the next output of that stream's generator, restated
 *    here from `kernel/rng.ts`. A preemptive or ambush start spends the first two and none of the 26. A one-stream generator (a scripted
 *    test, FF7, a forecast) spends only the 26 it always did.
 * 2. **The start-type answer** (discarded by the engine) is the game's: scripted bytes through a real battle with and without Initiative.
 * 3. **L3, Victory Overdrive on every ending.** A generated field of party members in every Victor-mode state (Cursed, dead, Petrified, out of the
 *    battle, a bar nearly full) ends as a victory, a defeat and an escape; the gauges equal what the kernel's world gives, built again by hand
 *    (`helpers/ffxEngineGauge.ts`). Then the real Chapter II and III parties through `finish`.
 * 4. **K3** is pinned in `data-ffx-command-records.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { BattleResult, EnemyGroupDef, FFXCombatant, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { GameStreams } from '../../src/battle/common/streams.ts';
import { buildBattle, getFFXRegistry, type Ctx } from '../../src/battle/ffx/index.ts';
import { finish } from '../../src/battle/ffx/engine-end.ts';
import { buildBattleResult } from '../../src/battle/ffx/results.ts';
import { spendEntryDraws, LINKED_FORMATIONS } from '../../src/battle/ffx/adapt/entry.ts';
import { FFX_STREAM_GAME, makeFfxRng } from '../../src/battle/ffx/adapt/streams.ts';
import { rngNextState, rngOutput, seedProduct, seedStates } from '../../src/battle/ffx/kernel/rng.ts';
import { odOnVictory } from '../../src/battle/ffx/kernel/overdrive-hooks.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { getChapter, type Chapter } from '../../src/data/encounters.ts';
import { MACALANIA_GROUP_ID } from '../../src/data/ffx/enemies/seymour-anima-macalania.ts';
import { OMNIS_GROUP_ID } from '../../src/data/ffx/enemies/seymour-omnis.ts';
import { GUI_GROUP_1_ID, GUI_GROUP_2_ID } from '../../src/data/ffx/sinspawn-gui-ids.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { contextOf, makeRng } from './helpers/ffxEngineWiring.ts';
import { type Seat, aeonSeat, engineCombatant, enemySeat, oracleWorld, partySeat } from './helpers/ffxEngineGauge.ts';

// ------------------------------------------------------------------------------------------------ the independent tables

const CHAPTER_IDS = [
  'seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus',
  'seymour-omnis', 'isaaru-via-purifico', 'sin-fins-core', 'sin-face', 'sinspawn-gui',
];

/** The streams of the placement shuffle by group id (`research/re-ffx-battle-entry.md` section 2), typed in again; every other group draws none. */
const SHUFFLE_STREAMS: Readonly<Record<string, readonly number[]>> = {
  [MACALANIA_GROUP_ID]: [28, 28, 28, 30],
  [OMNIS_GROUP_ID]: [29, 29, 29, 29, 29, 30, 31, 32],
  [GUI_GROUP_1_ID]: [30, 30, 30, 31],
  [GUI_GROUP_2_ID]: [30, 30, 30, 31],
};

/** The start-type roll's stream (`research/re-ffx-rng-hit.md` section 2: stream 1, `FFX.exe` 0x0078d090), typed in again. */
const START_TYPE_STREAM = 1;

/** The 26 opening draws on a normal start (`research/re-ffx-ctb-status.md` section 3): 18 party and aeon slots, then 8 monster slots. */
const OPENING_STREAMS: readonly number[] = [20, 21, 22, 23, 24, 25, 26, ...new Array<number>(11).fill(27), 28, 29, 30, 31, 32, 33, 34, 35];

interface Tap {
  stream: number;
  value: number;
}

interface Entry {
  chapter: Chapter;
  group: EnemyGroupDef;
  link: number;
}

async function groupsOf(chapterId: string): Promise<Entry[]> {
  const chapter = getChapter(chapterId) as Chapter;
  const out: Entry[] = [];
  let group: EnemyGroupDef | null | undefined = chapter.enemyGroupRef;
  while (group && out.length < 20) {
    out.push({ chapter, group, link: out.length });
    group = group.nextGroupId ? await findEnemyGroup(group.nextGroupId) : undefined;
  }
  return out;
}

/** What the generator of `stream` gives next, restated from the kernel: the 68 states the run seed leaves, one step per draw. */
class Model {
  private readonly states: number[];

  constructor(seed: number) {
    this.states = [...seedStates(seedProduct(1, (seed >>> 0) - 1))];
  }

  next(stream: number): number {
    const s = rngNextState(stream, this.states[stream] as number);
    this.states[stream] = s;
    return rngOutput(s);
  }
}

function content() {
  return getFFXRegistry().clone();
}

/** Build one battle of an entry on the game generator and return every draw it made. */
function tapped(e: Entry, seed: number, condition: 'normal' | 'preemptive' | 'ambush' | 'scripted' = 'normal'): { taps: Tap[]; ctx: Ctx; rng: GameStreams } {
  const rng = makeFfxRng(seed);
  const taps: Tap[] = [];
  rng.tap = (stream, value) => void taps.push({ stream, value });
  const base = setupForChapter(e.chapter, seed);
  const ctx = buildBattle({ ...base, enemies: e.group, seed, condition, ...(e.link > 0 ? { chained: true } : {}) }, rng, content(), () => undefined);
  return { taps, ctx, rng };
}

// ------------------------------------------------------------------------------------------ 1. the draws on the way in

describe('the draws a battle makes before and with its opening counters, on the game generator', () => {
  it('the table in the adapter names the data groups it should, and the engine enemy order is the formation file\'s slot order', async () => {
    expect(Object.keys(LINKED_FORMATIONS).sort()).toEqual([MACALANIA_GROUP_ID, OMNIS_GROUP_ID, GUI_GROUP_1_ID, GUI_GROUP_2_ID].sort());
    for (const id of Object.keys(LINKED_FORMATIONS)) {
      const group = ENEMY_GROUPS_BY_ID[id];
      expect(group, id).toBeDefined();
      const slots = [...group!.enemies, ...(group!.parts ?? [])].map((e) => e.id);
      expect(slots.length, `${id}: one combatant for each monster word`).toBe(LINKED_FORMATIONS[id]!.length);
    }
    const ids = (id: string): string[] => [...ENEMY_GROUPS_BY_ID[id]!.enemies, ...(ENEMY_GROUPS_BY_ID[id]!.parts ?? [])].map((e) => e.id);
    // Chapter VII: Guardian, Seymour, Guardian, Anima (words 108d 107c 108d 107d); the Guardians are slots 0 and 2
    const mac = ids(MACALANIA_GROUP_ID);
    expect(mac.map((id) => id.startsWith('guado-guardian'))).toEqual([true, false, true, false]);
    // Chapter XII: Omnis, then the four discs (words 1083, then 106a four times)
    const omnis = ids(OMNIS_GROUP_ID);
    expect(omnis[0]).toBe('seymour-omnis');
    expect(omnis.slice(1).every((id) => id.startsWith('mortiphasm'))).toBe(true);
    // the Gui fights: body, head, left arm, right arm (words 1075 10a0 10a1 10a1)
    for (const id of [GUI_GROUP_1_ID, GUI_GROUP_2_ID]) {
      const gui = ids(id);
      expect([gui.length, gui[2]!.includes('arm'), gui[3]!.includes('arm'), gui[1]!.includes('head')]).toEqual([4, true, true, true]);
    }
  });

  it('every group of every chapter and link: stream 1, the formation\'s shuffle, then the 26 opening draws, each the next output of its stream', async () => {
    await registerBattleContent();
    let groups = 0;
    const seen = new Set<string>();
    for (const chapterId of CHAPTER_IDS) {
      for (const e of await groupsOf(chapterId)) {
        for (const seed of [1, 7, 300]) {
          const { taps } = tapped(e, seed, e.link === 0 ? 'normal' : 'scripted');
          const shuffle = SHUFFLE_STREAMS[e.group.id] ?? [];
          const head = [START_TYPE_STREAM, ...shuffle, ...OPENING_STREAMS];
          expect(taps.slice(0, head.length).map((t) => t.stream), `${chapterId} / ${e.group.id} seed ${seed}`).toEqual(head);
          // each value is the next output of its generator
          const model = new Model(seed);
          for (const t of taps) expect(t.value, `${e.group.id} seed ${seed}: stream ${t.stream}`).toBe(model.next(t.stream));
          // nothing later in the set-up touches stream 1 again
          expect(taps.slice(1).some((t) => t.stream === 1), `${e.group.id}: a second start-type draw`).toBe(false);
          groups++;
          seen.add(e.group.id);
        }
      }
    }
    for (const id of Object.keys(SHUFFLE_STREAMS)) expect(seen.has(id), `${id} was built`).toBe(true);
    expect(seen.size).toBeGreaterThanOrEqual(20);
    expect(groups).toBeGreaterThanOrEqual(seen.size * 3);
  });

  it('Chapter VII on seed 1: the Guardians\' opening draws are the 4th and 2nd outputs of their streams, the shuffle having moved them on', async () => {
    await registerBattleContent();
    const e = (await groupsOf('seymour-anima-macalania'))[0] as Entry;
    const { taps } = tapped(e, 1);
    const model = new Model(1);
    const own = (stream: number): number[] => taps.filter((t) => t.stream === stream).map((t) => t.value);
    const first = (stream: number, n: number): number[] => Array.from({ length: n }, () => model.next(stream));
    // stream 28 = slot 0: three shuffle draws then the opening counter; stream 30 = slot 2: one shuffle draw then the opening counter
    expect(own(28)).toEqual(first(28, 4));
    expect(own(30)).toEqual(first(30, 2));
    // the other two monsters (slots 1 and 3) draw only their opening counter, the first output of their streams
    expect(own(29)).toEqual(first(29, 1));
    expect(own(31)).toEqual(first(31, 1));
    expect(own(1)).toEqual(first(1, 1));
  });

  it('a preemptive or an ambush start spends the start-type draw and the shuffle, and none of the 26 opening draws', async () => {
    await registerBattleContent();
    for (const chapterId of ['seymour-flux', 'seymour-anima-macalania', 'seymour-omnis', 'sinspawn-gui']) {
      const e = (await groupsOf(chapterId))[0] as Entry;
      for (const condition of ['preemptive', 'ambush'] as const) {
        const { taps } = tapped(e, 5, condition);
        const shuffle = SHUFFLE_STREAMS[e.group.id] ?? [];
        expect(taps.slice(0, 1 + shuffle.length).map((t) => t.stream), `${e.group.id} ${condition}`).toEqual([START_TYPE_STREAM, ...shuffle]);
        // no opening draw: nothing after the entry draws on a party, aeon or monster stream (20 to 35) while the battle is being built
        expect(taps.slice(1 + shuffle.length).filter((t) => t.stream >= 20 && t.stream <= 35), `${e.group.id} ${condition}: an opening draw`).toEqual([]);
      }
    }
  });

  it('a one-stream generator spends neither the start-type draw nor the shuffle: only the 26 opening draws, as before', async () => {
    await registerBattleContent();
    class Counting extends SeededRng {
      calls = 0;
      override next(): number {
        this.calls++;
        return super.next();
      }
    }
    for (const chapterId of ['seymour-flux', 'seymour-anima-macalania', 'seymour-omnis', 'sinspawn-gui']) {
      const e = (await groupsOf(chapterId))[0] as Entry;
      const rng = new Counting(9);
      const base = setupForChapter(e.chapter, 9);
      buildBattle({ ...base, enemies: e.group }, rng, content(), () => undefined);
      expect(rng.calls, `${e.group.id}: the one-stream draws`).toBe(26);
    }
  });
});

// ----------------------------------------------------------------------------------------------- 2. the start-type answer

describe('the start-type answer the engine discards is the game\'s', () => {
  /** A game generator whose draws are scripted per stream: stream 1 answers the queue, every other stream answers 0. */
  function scripted(queue1: number[]): GameStreams {
    const game = {
      ...FFX_STREAM_GAME,
      draw: (_states: Uint32Array, stream: number): number => (stream === 1 ? (queue1.shift() as number) : 0),
    };
    return new GameStreams(game, 1);
  }

  const cases: Array<[number, boolean, number]> = [
    // [low byte, Initiative, answer] worked from the rule: r - 33 with Initiative; ambush if r >= 223; preemptive if r < 32; else normal
    [10, false, 1], [31, false, 1], [32, false, 0], [222, false, 0], [223, false, 2], [255, false, 2],
    [10, true, 1], [64, true, 1], [65, true, 0], [230, true, 0], [255, true, 0], [0, true, 1],
  ];

  it.each(cases)('byte %i, Initiative %s -> start type %i (and one draw of stream 1, the whole 31-bit draw taken % 256)', async (byte, initiative, want) => {
    await registerBattleContent();
    const e = (await groupsOf('seymour-flux'))[0] as Entry;
    const chapter = e.chapter;
    const base = setupForChapter(chapter, 1);
    const party = structuredClone(base.party) as FFXPartyBuild;
    if (initiative) {
      const member = party.members.find((m) => m.id === party.activeSlots[0]);
      member!.equipment.weapon.autoAbilities = [...member!.equipment.weapon.autoAbilities, 'initiative'];
    }
    // the build's own entry draw takes one value off the queue; the call under test takes the next
    const rng = scripted([0, 0x40000000 + byte]);
    const ctx = buildBattle({ ...base, party, seed: 1 }, rng, content(), () => undefined);
    expect(spendEntryDraws(ctx, e.group.id)).toBe(want);
  });
});

// ------------------------------------------------------------------------------------------------ 3. Victory Overdrive

const OUTCOMES: ReadonlyArray<BattleResult['outcome']> = ['victory', 'defeat', 'escape'];

/** The engine's field for a list of seats; with `aeonOut` the aeon seat holds the field and the party stands out of the battle (the game's "in battle" byte is clear for them). */
function fieldOf(seats: readonly Seat[], aeonOut = false): { ctx: Ctx; by: Map<string, FFXCombatant> } {
  const combatants = seats.map(engineCombatant);
  const [a, b, ...rest] = combatants as [FFXCombatant, FFXCombatant, ...FFXCombatant[]];
  const built = contextOf(a, b, new SeededRng(1), 0, rest);
  if (aeonOut) built.ctx.state.aeonId = seats.find((s) => s.kind === 'aeon')!.id;
  return { ctx: built.ctx, by: new Map(combatants.map((c) => [c.id, c])) };
}

describe('Victory Overdrive runs for every ending (0x007b1540, called in all five results)', () => {
  it('600 generated fields x 3 endings: the gauges are the kernel\'s, whatever the outcome', () => {
    const rng = makeRng(20261015);
    let victors = 0;
    let gained = 0;
    let none = 0;
    for (let i = 0; i < 600; i++) {
      const aeonOut = rng.next() < 0.15;
      const party = [0, 1, 2].map((n) => {
        const s = partySeat(rng, n);
        s.mode = rng.next() < 0.5 ? 11 : s.mode; // Victor
        s.dead = rng.next() < 0.15;
        s.spec.petrify = rng.next() < 0.1;
        s.curse = rng.next() < 0.1;
        s.inBattle = !aeonOut;
        s.points = rng.next() < 0.2 ? 95 : rng.int(0, 90);
        return s;
      });
      const foes = [enemySeat(rng, 0), enemySeat(rng, 1)];
      const seats: Seat[] = [party[0]!, foes[0]!, party[1]!, party[2]!, foes[1]!, ...(aeonOut ? [aeonSeat(rng, rng.int(0, 6))] : [])];
      for (const outcome of OUTCOMES) {
        const f = fieldOf(seats, aeonOut);
        const before = seats.map((s) => f.by.get(s.id)!.overdrive?.gauge ?? 0);
        const w = oracleWorld(seats);
        odOnVictory(w);
        buildBattleResult(f.ctx, outcome, undefined);
        const got = seats.map((s) => f.by.get(s.id)!.overdrive?.gauge ?? 0);
        const want = seats.map((s) => (s.kind === 'enemy' ? 0 : w.slots[s.slot]!.gauge * (s.kind === 'aeon' ? 5 : 1)));
        expect(got, `field ${i}, ${outcome}`).toEqual(want);
        if (outcome === 'escape') {
          victors += party.filter((s) => s.mode === 11).length;
          const moved = got.filter((g, j) => g !== before[j]).length;
          if (moved > 0) gained++;
          else none++;
        }
      }
    }
    // the sample holds both: fields where a Victor gained and fields where nobody could (dead, Petrified, Cursed, out of the battle, or full)
    expect(victors).toBeGreaterThan(400);
    expect(gained).toBeGreaterThan(200);
    expect(none).toBeGreaterThan(20);
  });

  it('a Victor who is alive, free of Curse and standing in the battle gains 20 at an escape and at a defeat, exactly as at a victory', () => {
    const rng = makeRng(77);
    for (const outcome of OUTCOMES) {
      const s = partySeat(rng, 4); // Wakka's slot
      Object.assign(s, { mode: 11, dead: false, curse: false, inBattle: true, points: 30 });
      s.spec.petrify = false;
      const seats = [s, enemySeat(rng, 0)];
      const f = fieldOf(seats);
      buildBattleResult(f.ctx, outcome, undefined);
      expect(f.by.get(s.id)!.overdrive!.gauge, outcome).toBe(50);
    }
  });

  it('Chapters II and III: Wakka, in the battle, takes his 20 through `finish` at a victory, a defeat and an escape (not when dead)', async () => {
    await registerBattleContent();
    type Ev = { type: string; who?: string; cause?: string };
    const build = async (chapterId: string, seed: number): Promise<{ ctx: Ctx; events: Ev[]; wakka: FFXCombatant }> => {
      const e = (await groupsOf(chapterId))[0] as Entry;
      const { ctx } = tapped(e, seed);
      const events: Ev[] = [];
      ctx.emit = (event) => void events.push(event as Ev);
      const wakka = ctx.state.combatants['wakka'] as FFXCombatant;
      expect(wakka.overdrive?.mode, `${chapterId}: Wakka wears Victor`).toBe('victor');
      // bring him into the active three (he starts on the bench) as the line does
      const out = ctx.state.activeIds[ctx.state.activeIds.length - 1] as string;
      ctx.state.activeIds = [...ctx.state.activeIds.filter((id) => id !== out), 'wakka'];
      ctx.state.reserveIds = [...ctx.state.reserveIds.filter((id) => id !== 'wakka'), out];
      wakka.removed = false;
      (ctx.state.combatants[out] as FFXCombatant).removed = true;
      return { ctx, events, wakka };
    };
    for (const chapterId of ['yunalesca', 'braskas-final-aeon']) {
      for (const outcome of OUTCOMES) {
        const { ctx, events, wakka } = await build(chapterId, 3);
        wakka.overdrive!.gauge = 30;
        finish({ ctx, push: (e) => ctx.emit(e), buffer: events as never, nextGroupId: undefined }, outcome);
        expect(ctx.state.result?.outcome, `${chapterId} ${outcome}`).toBe(outcome);
        expect(wakka.overdrive!.gauge, `${chapterId} ${outcome}: 30 + 20`).toBe(50);
        expect(events.some((ev) => ev.type === 'overdrive-gauge' && ev.who === 'wakka' && ev.cause === 'victor'), `${chapterId} ${outcome}: the event`).toBe(true);
      }
      const dead = await build(chapterId, 3);
      dead.wakka.hp = 0;
      dead.wakka.alive = false;
      dead.wakka.overdrive!.gauge = 30;
      finish({ ctx: dead.ctx, push: (e) => dead.ctx.emit(e), buffer: dead.events as never, nextGroupId: undefined }, 'escape');
      expect(dead.wakka.overdrive!.gauge, `${chapterId}: a dead Wakka gains nothing`).toBe(30);
    }
  });
});
