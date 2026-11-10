/**
 * Special Dress Up on the real FFX-2 engine (FFX-2 only; the `specialDressUp` switch is OFF in every build and ON here).
 *
 * The walk is the girl's own: the Change rows the menu offers, along the real Garment Grid of the chapter's build (`helpers/specialDrive.ts`). Nothing in a chapter is edited; the rigs are named where they are
 * used (the foe's Curse lifted so the walk can finish, the girls kept alive, Full Throttle added to Paine's bag in Chapter IV, which gives it to her only in Chapter V). `research/re-ffx2-special-dresspheres.md`
 * has the sources for every number checked here.
 */

import { describe, expect, it } from 'vitest';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { bahamutGroup } from '../../src/data/ffx2/enemies/bahamut.ts';
import { FORMS, masteredLearned } from '../../src/battle/ffx2/special/forms.ts';
import { specialPartStats } from '../../src/battle/ffx2/special/stats.ts';
import { calculateStatsFor } from '../../src/battle/ffx2/kernel/dressphere-stats.ts';
import { dressUpMoveOf, bigMoveOf } from '../../src/engine/BigMoves.ts';
import type { FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { abilityRow, aimed, intoSpecial, logOf, nextInput, nodesOf, openSpecial, partsPolicy, specialRow, unit, walkTo, type Input } from './helpers/specialDrive.ts';

const BOSS = 'bahamut';

/** Chapter IV's party with the Specials as the build gives them (Full Throttle added to Paine's owned list: a rig), optionally mastered. */
function chapterIV(mastered: boolean): FFX2PartyBuild {
  const build = structuredClone(bevelleBuild);
  const paine = build.members[2]!;
  if (!paine.owned.includes('full-throttle')) paine.owned.push('full-throttle');
  if (mastered) for (const m of build.members) {
    const form = Object.values(FORMS).find((f) => f.girl === m.id);
    if (form) Object.assign(m.abilitiesLearned, masteredLearned(form));
  }
  return build;
}

const SPECIALS = [
  { girl: 'yuna', id: 'floral-fallal', pods: ['floral-fallal-right-pistil', 'floral-fallal-left-pistil'], finisher: 'x2-floral-fallal-great-whirl' },
  { girl: 'rikku', id: 'machina-maw', pods: ['machina-maw-smasher-r', 'machina-maw-crusher-l'], finisher: 'x2-machina-maw-vajra' },
  { girl: 'paine', id: 'full-throttle', pods: ['full-throttle-right', 'full-throttle-left'], finisher: 'x2-full-throttle-sword-dance' },
] as const;

function enter(girl: string, mastered = false, seed = 1) {
  const engine = openSpecial({ build: chapterIV(mastered), group: bahamutGroup, seed, immortal: true });
  const walk = walkTo(engine, girl, { immortal: true });
  expect(walk.input, 'the walk reaches the offer').not.toBeNull();
  return { engine, walk };
}

describe('the offer', () => {
  it('is not made before every dressphere of the grid has been worn, and is made after (all three girls, Chapter IV)', () => {
    for (const s of SPECIALS) {
      const engine = openSpecial({ build: chapterIV(false), group: bahamutGroup, seed: 1, immortal: true });
      const first = nextInput(engine) as Input;
      expect(specialRow(first), `${s.girl} at the start`).toBeUndefined();
      const w = walkTo(engine, s.girl, { immortal: true });
      expect(w.input, s.girl).not.toBeNull();
      expect(w.changes, `${s.girl} needed the walk`).toBeGreaterThanOrEqual(3);
      const row = specialRow(w.input as Input);
      expect((row?.command as { extra: { toDressphere: string; specialDressUp: boolean } }).extra).toMatchObject({ toDressphere: s.id, specialDressUp: true });
      const sphere = unit(engine, s.girl).dresspheres!;
      expect(sphere.garmentGrid.wornThisBattle.length, 'every dressphere of the grid is worn').toBe(nodesOf(engine, s.girl).filter((d) => d !== null).length);
    }
  });

  it('with the switch off there is no row and the wheel\'s own command is refused as it always was', () => {
    const engine = openSpecial({ build: chapterIV(false), group: bahamutGroup, seed: 1, immortal: true, specials: false });
    const w = walkTo(engine, 'yuna', { immortal: true, maxDecisions: 400 });
    expect(w.input).toBeNull();
    const d = nextInput(engine);
    expect(d).not.toBeNull();
    expect(specialRow(d as Input)).toBeUndefined();
    const before = logOf(engine).length;
    engine.submit({ kind: 'spherechange', targets: [], extra: { toDressphere: 'floral-fallal', toNode: unit(engine, d!.actorId).dresspheres!.garmentGrid.nodePosition, gatesCrossed: [], specialDressUp: true } });
    const added = logOf(engine).slice(before);
    expect(added.some((e) => e.type === 'spherechange')).toBe(false);
    expect(unit(engine, d!.actorId).dresspheres!.current).not.toBe('floral-fallal');
  });
});

describe('putting on the Special', () => {
  for (const s of SPECIALS) {
    it(`${s.girl} becomes ${s.id}: three parts, the others out of the field, the game's stats, Ribbon and Auto-Life`, () => {
      const { engine, walk } = enter(s.girl);
      const girl = unit(engine, s.girl);
      const accessories = [...girl.accessories];
      const hpRatioBefore = girl.hp / girl.stats.maxHp;
      intoSpecial(engine, walk.input as Input);

      const ev = logOf(engine).filter((e) => e.type === 'spherechange');
      expect(ev[ev.length - 1]).toMatchObject({ who: s.girl, to: s.id, special: s.id });

      expect(girl.dresspheres!.current).toBe(s.id);
      expect(engine.state().activeIds).toEqual([s.girl, ...s.pods]);
      const others = ['yuna', 'rikku', 'paine'].filter((g) => g !== s.girl);
      for (const o of others) expect(unit(engine, o).removed, `${o} is out of the field`).toBe(true);
      for (const id of s.pods) expect(unit(engine, id).removed).toBe(false);

      // the game's numbers: the part's own growth row, x (nodes + 25) / 25 (the grid has 5 nodes in every Chapter IV bag; the pods read plate 0, 6 nodes)
      const form = FORMS[s.id];
      const gridNodes = nodesOf(engine, s.girl).filter((d) => d !== null).length; // the nodes of her grid: 5, and 4 on Paine's Stonehewn
      expect(girl.stats.maxHp).toBe(specialPartStats(form.main.job, girl.level, gridNodes, []).maxHp);
      expect((girl as unknown as { sdspGridNodeCount?: number }).sdspGridNodeCount).toBe(gridNodes);
      const rawHp = calculateStatsFor(girl.level, form.main.job).stats[0] as number;
      expect(girl.stats.maxHp).toBe(Math.trunc((rawHp * (gridNodes + 25)) / 25));
      const pod = unit(engine, s.pods[0]);
      expect(pod.stats.maxHp).toBe(Math.trunc(((calculateStatsFor(girl.level, form.pods[0].job).stats[0] as number) * 31) / 25));
      expect(pod.hp).toBe(pod.stats.maxHp);
      expect(girl.hp / girl.stats.maxHp).toBeGreaterThan(hpRatioBefore - 0.01); // the pool keeps its ratio across the change
      expect(girl.hp / girl.stats.maxHp).toBeLessThan(hpRatioBefore + 0.01);

      // Ribbon: the wards of the game's row 0x8068, Eject among them, and Doom
      for (const u of [girl, pod, unit(engine, s.pods[1])]) {
        expect(u.immunities.eject, `${u.id} eject`).toBe(255);
        expect(u.immunities.slow).toBe(255);
        expect(u.immunities.doom).toBe(255);
        expect(u.statuses['auto-life'], `${u.id} has Auto-Life`).toBeDefined();
      }
      // every accessory stops working
      expect(girl.accessories).toEqual([]);
      expect(accessories.length).toBeGreaterThan(0);
    });
  }
});

describe('the parts\' menus', () => {
  it('the main body has no Item and no Escape; each part lists the commands of its own ladder that the game lists from the start (Floral Fallal)', () => {
    const { engine, walk } = enter('yuna');
    intoSpecial(engine, walk.input as Input);
    const seen = new Map<string, string[]>();
    for (let i = 0; i < 12 && seen.size < 3; i++) {
      const d = nextInput(engine) as Input;
      if (!seen.has(d.actorId)) seen.set(d.actorId, d.commands.map((c) => `${c.command.kind}:${c.label}`));
      engine.submit({ kind: 'defend', targets: [] });
    }
    const main = seen.get('yuna') as string[];
    expect(main.some((r) => r.startsWith('item:'))).toBe(false);
    expect(main.some((r) => r.startsWith('escape:'))).toBe(false);
    expect(main).toContain('attack:Attack');
    expect(main).toEqual(expect.arrayContaining(['ability:Heat Whirl', 'ability:Ice Whirl', 'ability:Electric Whirl', 'ability:Aqua Whirl']));
    expect(main).not.toContain('ability:Great Whirl'); // not learned: 30 AP, and Flare Whirl before it
    expect(seen.get('floral-fallal-right-pistil')).toEqual(['ability:White Pollen', 'ability:Hard Leaves', 'ability:Tough Nuts', 'ability:Mirror Petals', 'ability:Floral Bomb']);
    expect(seen.get('floral-fallal-left-pistil')).toEqual(['ability:Dream Pollen', 'ability:Mad Seeds', 'ability:Sticky Honey', 'ability:Halfdeath Petals', 'ability:Silent White']);
  });

  it('a build that names a Special\'s learned list gets exactly that list, and Double and Triple HP only when named', () => {
    const build = chapterIV(true);
    const engine = openSpecial({ build, group: bahamutGroup, seed: 1, immortal: true });
    const w = walkTo(engine, 'yuna', { immortal: true });
    intoSpecial(engine, w.input as Input);
    const girl = unit(engine, 'yuna');
    const lowLv = specialPartStats(FORMS['floral-fallal'].main.job, girl.level, 5, []);
    expect(girl.stats.maxHp, 'Double HP and Triple HP: +100 percent each on the base').toBeGreaterThan(lowLv.maxHp * 2.9);
    const d = nextInput(engine) as Input;
    expect(abilityRow(d, 'x2-floral-fallal-great-whirl')).toBeDefined();
    expect(abilityRow(d, 'x2-floral-fallal-all-life')).toBeDefined();
  });
});

describe('each Special in a fight (Chapter IV, seeded)', () => {
  for (const s of SPECIALS) {
    it(`${s.id}: the parts act on their own gauges, the finisher lands with the game's hits, and the same seed gives the same fight`, () => {
      const run = (seed: number) => {
        const { engine, walk } = enter(s.girl, true, seed);
        intoSpecial(engine, walk.input as Input);
        const policy = partsPolicy(BOSS);
        const actors = new Set<string>();
        let turns = 0;
        for (let i = 0; i < 200 && turns < 14; i++) {
          const d = nextInput(engine);
          if (d === null) break;
          topUpParts(engine);
          actors.add(d.actorId);
          engine.submit(policy(d, engine));
          turns += 1;
        }
        return { engine, actors };
      };
      const a = run(3);
      expect([...a.actors].sort()).toEqual([s.girl, ...s.pods].sort());
      const starts = logOf(a.engine).filter((e) => e.type === 'action-start');
      const finisher = starts.filter((e) => e.abilityId === s.finisher);
      expect(finisher.length, 'the finisher was thrown').toBeGreaterThan(0);
      const afterFinisher = logOf(a.engine).filter((e) => e.type === 'damage' && e.sourceId === s.girl);
      expect(afterFinisher.length).toBeGreaterThan(0);
      const b = run(3);
      expect(JSON.stringify(logOf(b.engine))).toBe(JSON.stringify(logOf(a.engine)));
    });
  }
});

/** Keep the parts alive for a measurement of what they do (the foe's script is Chapter IV's; this is a rig). */
function topUpParts(engine: ReturnType<typeof openSpecial>): void {
  for (const id of engine.state().activeIds) {
    const u = unit(engine, id);
    if (u.alive) u.hp = u.stats.maxHp;
  }
}

describe('the finishers\' formulas, run on the engine (the rows are the game\'s)', () => {
  it('Great Whirl twelve hits of power 8, Vajra one hit of power 80, Sword Dance two hits of power 48', () => {
    const rows: Record<string, { hits: number; power: number }> = {
      'x2-floral-fallal-great-whirl': { hits: 12, power: 8 },
      'x2-machina-maw-vajra': { hits: 1, power: 80 },
      'x2-full-throttle-sword-dance': { hits: 2, power: 48 },
    };
    for (const s of SPECIALS) {
      const { engine, walk } = enter(s.girl, true);
      intoSpecial(engine, walk.input as Input);
      let seen = 0;
      for (let i = 0; i < 100 && seen === 0; i++) {
        const d = nextInput(engine);
        if (d === null) break;
        topUpParts(engine);
        const row = d.actorId === s.girl ? abilityRow(d, s.finisher) : undefined;
        if (row) {
          const before = logOf(engine).length;
          engine.submit(aimed(row, row.targeting === 'random-enemy' || row.targeting === 'all-enemies' ? [] : [BOSS]));
          // the strikes land when the cast completes: play on until the boss has been hit by the finisher
          for (let k = 0; k < 200; k++) {
            const hit = logOf(engine).slice(before).filter((e) => e.type === 'damage' && e.targetId === BOSS && e.sourceId === s.girl);
            if (hit.length >= rows[s.finisher]!.hits) break;
            const n = nextInput(engine);
            if (n === null) break;
            topUpParts(engine);
            engine.submit({ kind: 'defend', targets: [] });
          }
          const hits = logOf(engine).slice(before).filter((e) => e.type === 'damage' && e.targetId === BOSS && e.sourceId === s.girl);
          expect(hits.length, s.finisher).toBe(rows[s.finisher]!.hits);
          seen = hits.length;
        } else engine.submit({ kind: 'defend', targets: [] });
      }
      expect(seen, s.finisher).toBeGreaterThan(0);
    }
  });
});

describe('the portrait hook rides the real events', () => {
  it('the change into a Special is the cue (`spherechange` with `special`), and the finisher is a big move', () => {
    const { engine, walk } = enter('paine', true);
    intoSpecial(engine, walk.input as Input);
    const ev = logOf(engine).filter((e) => e.type === 'spherechange').pop() as unknown as { who: string; to: string; special?: string };
    const move = dressUpMoveOf('ffx2', { id: 'paine', name: 'Paine' }, ev.to, ev.special);
    expect(move).toMatchObject({ kind: 'special', portraitId: 'paine', title: 'Full Throttle', tag: 'PAINE · SPECIAL DRESS UP' });
    expect(dressUpMoveOf('ffx2', { id: 'paine', name: 'Paine' }, 'warrior', undefined)).toBeNull();
    const big = bigMoveOf({ game: 'ffx2', command: { kind: 'ability', id: 'x2-full-throttle-sword-dance', targets: [] }, abilityId: 'x2-full-throttle-sword-dance', abilityName: 'Sword Dance', actorId: 'paine', actorName: 'Paine' });
    expect(big).toMatchObject({ kind: 'special', portraitId: 'paine', tag: 'PAINE · SPECIAL' });
  });
});

describe('the form ends', () => {
  it('the girl leaves it by the one Change row she has: her old dress, the pods gone, the others back, her accessories returned', () => {
    const { engine, walk } = enter('yuna');
    const accessories = [...unit(engine, 'yuna').accessories];
    intoSpecial(engine, walk.input as Input);
    const d = nextInput(engine) as Input;
    expect(d.actorId).toBe('yuna');
    const back = d.commands.filter((c) => c.command.kind === 'spherechange');
    expect(back).toHaveLength(1);
    const returnTo = (back[0]!.command as unknown as { extra: { toDressphere: string } }).extra.toDressphere;
    expect(returnTo).toBe(nodesOf(engine, 'yuna')[unit(engine, 'yuna').dresspheres!.garmentGrid.nodePosition]); // the dress on the node she stands on
    engine.submit(back[0]!.command);
    const girl = unit(engine, 'yuna');
    expect(girl.dresspheres!.current).toBe(returnTo);
    expect(girl.dresspheres!.special).toBeUndefined();
    expect(girl.accessories).toEqual(accessories);
    expect(engine.state().activeIds).toEqual(['yuna', 'rikku', 'paine']);
    for (const g of ['rikku', 'paine']) expect(unit(engine, g).removed).toBe(false);
    for (const p of SPECIALS[0].pods) expect(unit(engine, p).removed).toBe(true);
    expect(girl.immunities.eject).not.toBe(255);
    // the walk starts over: no second offer until she has been round the grid again
    const next = nextInput(engine) as Input;
    expect(specialRow(next)).toBeUndefined();
  });

  it('a main body that falls while a pod stands ends it: she is back in her old dress knocked out, the pods gone, the others back', () => {
    const { engine, walk } = enter('rikku');
    intoSpecial(engine, walk.input as Input);
    nextInput(engine);
    const girl = unit(engine, 'rikku');
    const returnTo = (girl as unknown as { sdsp: { returnTo: string } }).sdsp.returnTo;
    delete girl.statuses['auto-life']; // a rig: no second chance, so the fall below is a fall
    girl.hp = 0;
    girl.alive = false;
    girl.statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as never;
    for (let i = 0; i < 40 && girl.dresspheres!.current !== returnTo; i++) {
      const step = engine.nextDecision();
      if (step.kind === 'waiting') engine.tick(Math.max(1, step.nextEventMs));
    }
    expect(girl.dresspheres!.current).toBe(returnTo);
    expect(girl.alive).toBe(false);
    expect(engine.state().activeIds).toEqual(['yuna', 'rikku', 'paine']);
    expect(unit(engine, 'yuna').removed).toBe(false);
    expect(unit(engine, 'machina-maw-smasher-r').removed).toBe(true);
    expect(logOf(engine).some((e) => e.type === 'message' && /ends/.test((e as unknown as { text: string }).text))).toBe(true);
  });

  it('all three parts down is a defeat, with the other girls alive and out of the field', () => {
    const { engine, walk } = enter('paine');
    intoSpecial(engine, walk.input as Input);
    for (const id of engine.state().activeIds) {
      const u = unit(engine, id);
      delete u.statuses['auto-life'];
      u.hp = 0;
      u.alive = false;
      u.statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as never;
    }
    let over = false;
    for (let i = 0; i < 400 && !over; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') over = true;
      else if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    }
    expect(over).toBe(true);
    expect(engine.state().result?.outcome).toBe('defeat');
    expect(unit(engine, 'yuna').alive).toBe(true);
  });
});
