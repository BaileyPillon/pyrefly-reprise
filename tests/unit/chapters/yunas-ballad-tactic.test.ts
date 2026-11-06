/**
 * Yuna's Ballad (the hidden FFX-2 chapter): the encounter tactic (`src/engine/tactics/ffx2-yunas-ballad.ts`), which the shipped auto-battler plays and the move advisor ("NEXT BEST MOVE") reads. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Why it exists: the first browser job of the chapter showed the advisor card naming **Pray** on Yuna's first menu (a White Mage has no attack; Pray heals about 109 HP, and a Yuna who only prays wins 0 of 8 seeds in the
 * bench). The Sanctuary Keeper's review found the same defect (M1) in its own chapter. The tactic is the bench's `warrior` line: heal under half, Change to the Warrior once, then Attack. Pinned here:
 *
 * 1. **Registration**: the chapter's two fighters find it, an FFX board never does, and the Den of Woe's own board still finds the Den's tactic.
 * 2. **The choices**, on the real engine's menus: a Change to Warrior first, an Attack at the fighter once she wears it, an X-Potion (then a Hi-Potion, then a Potion) under half HP, a Cura when the bag is empty.
 * 3. **The shipped path**: through `intendedStrategy` (the auto-battler and the advisor's source) the chapter is won on every seed tried, both duels.
 */
import { describe, expect, it } from 'vitest';

import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import type { BattleEngine, Decision } from '../../../src/battle/common/types.ts';
import { FFX2_YUNAS_BALLAD } from '../../../src/data/chapter-ffx2-yunas-ballad.ts';
import { ffx2DenOfWoe, tacticFor, TACTICS } from '../../../src/engine/tactics/index.ts';
import { FIGHT_DRESSPHERE, HEAL_BELOW, YUNAS_BALLAD_BOSS_IDS, ffx2YunasBallad } from '../../../src/engine/tactics/ffx2-yunas-ballad.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { playChain } from '../helpers/ffx2ChainPlay.ts';
import { openDuel, yunaOf, type Duel } from '../helpers/yunasBalladDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** The first menu of an open duel. */
function firstMenu(duel: Duel, seed = 3): { engine: ReturnType<typeof openDuel>; d: Input } {
  const engine = openDuel(duel, seed);
  for (let i = 0; i < 4000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return { engine, d };
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
  }
  throw new Error('no menu');
}

const asEngine = (e: ReturnType<typeof openDuel>): BattleEngine => e as unknown as BattleEngine;

describe('registration', () => {
  it('the chapter is registered under both fighters and the FFX-2 game; an FFX board and a three-girl Den board never reach it', () => {
    expect(CHAPTER_GAME['ffx2-yunas-ballad']).toBe('ffx2');
    expect(TACTICS.filter((t) => t.chapterId === 'ffx2-yunas-ballad').map((t) => t.bossId)).toEqual([...YUNAS_BALLAD_BOSS_IDS]);
    for (const duel of [0, 1] as const) expect(tacticFor(asEngine(firstMenu(duel).engine))).toBe(ffx2YunasBallad);
    // the Den's own board (a shade on the field) still finds the Den's tactic, not this one
    expect(ffx2DenOfWoe).not.toBe(ffx2YunasBallad);
    const ffx = { state: () => ({ game: 'ffx', combatants: { 'x2-possessed-rikku': { id: 'x2-possessed-rikku', side: 'enemy' } } }) } as unknown as BattleEngine;
    expect(tacticFor(ffx)).toBeNull();
  });
});

describe('the choices, on the real engine\'s menus', () => {
  it('a White Mage with a full bag Changes to the Warrior first (the menu offers Pray, which is not the answer)', () => {
    for (const duel of [0, 1] as const) {
      const { engine, d } = firstMenu(duel);
      expect(yunaOf(engine).dresspheres?.current).toBe('white-mage');
      const c = ffx2YunasBallad('yuna', d.commands, asEngine(engine));
      expect(c, `duel ${duel}`).toMatchObject({ kind: 'spherechange', extra: { toDressphere: FIGHT_DRESSPHERE } });
    }
  });

  it('wearing the Warrior she attacks the fighter; under half HP she drinks an X-Potion instead, then a Hi-Potion, then a Potion, then casts Cura as a White Mage', () => {
    // Change her by the engine's own row, then look at the next menu
    const first = firstMenu(0);
    const row = first.d.commands.find((c) => c.enabled && c.command.kind === 'spherechange' && c.command.extra.toDressphere === 'warrior')!;
    first.engine.submit(row.command as never);
    let d: Input | null = null;
    for (let i = 0; i < 4000 && d === null; i++) {
      const n = first.engine.nextDecision();
      if (n.kind === 'player-input') d = n;
      else if (n.kind === 'waiting') first.engine.tick(Math.max(1, n.nextEventMs));
    }
    expect(d).not.toBeNull();
    expect(yunaOf(first.engine).dresspheres?.current).toBe('warrior');
    const attack = ffx2YunasBallad('yuna', d!.commands, asEngine(first.engine));
    expect(attack).toMatchObject({ kind: 'attack', targets: ['x2-possessed-rikku'] });
    // under half: an X-Potion on herself
    const y = yunaOf(first.engine);
    y.hp = Math.floor(y.stats.maxHp * (HEAL_BELOW - 0.05));
    expect(ffx2YunasBallad('yuna', d!.commands, asEngine(first.engine))).toMatchObject({ kind: 'item', id: 'x2-x-potion', targets: ['yuna'] });
    // no X-Potion offered: a Hi-Potion; none of the three: a Cura is only a White Mage's, so a Warrior swings on
    const without = (ids: string[]) => d!.commands.filter((c) => !(c.command.kind === 'item' && 'id' in c.command && ids.includes((c.command as { id: string }).id)));
    expect(ffx2YunasBallad('yuna', without(['x2-x-potion']), asEngine(first.engine))).toMatchObject({ kind: 'item', id: 'x2-hi-potion' });
    expect(ffx2YunasBallad('yuna', without(['x2-x-potion', 'x2-hi-potion']), asEngine(first.engine))).toMatchObject({ kind: 'item', id: 'x2-potion' });
    expect(ffx2YunasBallad('yuna', without(['x2-x-potion', 'x2-hi-potion', 'x2-potion']), asEngine(first.engine))).toMatchObject({ kind: 'attack' });
    // as a White Mage with an empty bag and low HP she casts Cura on herself
    const wm = firstMenu(0);
    const w = yunaOf(wm.engine);
    w.hp = Math.floor(w.stats.maxHp * 0.3);
    const bare = wm.d.commands.filter((c) => c.command.kind !== 'item');
    expect(ffx2YunasBallad('yuna', bare, asEngine(wm.engine))).toMatchObject({ kind: 'ability', id: 'x2-white-mage-cura', targets: ['yuna'] });
  });

  it('has no opinion on a turn that is not Yuna\'s or when no fighter stands', () => {
    const { engine, d } = firstMenu(0);
    expect(ffx2YunasBallad('rikku', d.commands, asEngine(engine))).toBeNull();
    const foe = engine.state().combatants['x2-possessed-rikku']!;
    (foe as unknown as { alive: boolean }).alive = false;
    expect(ffx2YunasBallad('yuna', d.commands, asEngine(engine))).toBeNull();
  });
});

describe('the shipped path (the auto-battler and the advisor\'s source) wins the chapter', () => {
  it('through intendedStrategy, both duels are won on every seed tried', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const r = await playChain(FFX2_YUNAS_BALLAD, seed, 'bench');
      expect(r.link1Won, `seed ${seed}`).toBe(true);
      expect(r.outcome, `seed ${seed}`).toBe('victory');
    }
  }, 120_000);

  it('and at the human pace (Wait with its split, 1.5 s a menu) and in Active ATB it still wins', async () => {
    await registerBattleContent();
    for (const pace of ['human', 'active'] as const) {
      for (const seed of [1, 2, 3]) {
        const r = await playChain(FFX2_YUNAS_BALLAD, seed, pace);
        expect(r.outcome, `${pace} seed ${seed}`).toBe('victory');
      }
    }
  }, 180_000);
});
