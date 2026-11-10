/**
 * The Fiend Arena Superbosses (the hidden FFX-2 chapter 53, the word `legion`): the chapter record, its pause metadata, its build, the flow around the two acts through the app's own path, and the hiding.
 * **FFX-2 only** [AGENTS.md rule 14]. Stage 3 of the lane (tracks T3 and T4); the data, the engine checks and the scripts have their own files (`fiend-superbosses-data|engine|ai|runs.test.ts`).
 *
 * 1. **The record**: the chapter's id, game, number, scene, build, first group, music and the Sensor lines, as the decisions of the lane (LG1, LG3, LG5, LG8, LG9, LG10) name them.
 * 2. **The build** (LG3): a deep copy of `viaInfinitoBuild`, equal to it and not the same object; the Lv 99 line of the Cup.
 * 3. **The metadata**: three objectives, a tip that promises nothing the kit cannot do, snapshots and hero art that exist, a quote that is a line of the pre scene.
 * 4. **The setup and the chain**: `setupForChapter` hands the engine the party and act 1, no escape, the four triggers; the chain loop finds act 2 by id; act 2 opens at full HP and MP with a fallen girl standing and nothing else
 *    carried (spent items stay spent); the defeat on act 2 retries ACT 2, a defeat on act 1 starts the chapter over.
 * 5. **The triggers** fire as the real engine plays: the three callouts once after their move, the seam on the KO of Shinra and on nothing of the Numerus.
 * 6. **The stage and the store**: the scene key is the Den of Woe's registered scene; an attempt and a clear go to the experiments' store, never the save.
 * 7. **The hiding**: without the word the chapter is on no list (the absence tests).
 */
import { describe, expect, it } from 'vitest';

import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { SAVE_KEY } from '../../../src/app/SaveData.ts';
import { checkpointAt, resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { BattleSetup, BattleState, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { FIEND_SUPERBOSSES_TEXT, FFX2_FIEND_SUPERBOSSES } from '../../../src/data/chapter-ffx2-fiend-superbosses.ts';
import { FIEND_SUPERBOSSES_META } from '../../../src/data/chapter-meta-ffx2-fiend-superbosses.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { fiendSuperbossBuild } from '../../../src/data/ffx2/builds/fiend-superbosses.ts';
import { act1ShinraGroup, act2NumerusGroup, x2AlmightyShinra, x2NumerusDuo, x2NumerusQuattour, x2NumerusTria, x2NumerusUnum } from '../../../src/data/ffx2/enemies/fiend-superbosses.ts';
import * as ids from '../../../src/data/fiend-superbosses-ids.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { ffx2FiendSuperbossesScripts as S } from '../../../src/story/scripts/ffx2-fiend-superbosses.ts';
import { GIRLS, attackOf, bigHp, forcedAct, girlsOf, logOf, makeInvincible, move, nextInput, playUntilActed, rowOf, topUp, unit, type Act } from '../helpers/fiendSuperbossDrive.ts';
import { playChain } from '../helpers/ffx2ChainPlay.ts';

/** A fresh engine for a setup (the app's own engine options). */
function engineFor(setup: BattleSetup): FFX2Engine {
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** The fighting enemies of an act, by id. */
const fightersOf = (act: Act): readonly string[] => (act === 1 ? [ids.X2_ALMIGHTY_SHINRA_ID] : ids.NUMERUS_HEAD_IDS);

/**
 * Play one link to a victory: every fighter's HP is set to 1 once (a measurement rig for the flow; the fights themselves are in the engine and run files) and the girls strike. Darkness hits all four heads at once,
 * so act 2 ends on the first Darkness; a plain attack takes one head a girl's turn, and four turns do the same.
 */
function winLink(engine: FFX2Engine, act: Act): { outcome: string; result: Record<string, unknown> } {
  // The base party loses both acts within seconds (the lane's measurement), so the flow rig also makes the girls Invincible (topped up at each decision) until the strike lands.
  for (const id of GIRLS) makeInvincible(unit(engine, id));
  for (const id of fightersOf(act)) (unit(engine, id) as unknown as { hp: number }).hp = 1;
  for (let i = 0; i < 6000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: String(d.result.outcome), result: d.result as unknown as Record<string, unknown> };
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    topUp(engine);
    const standing = fightersOf(act).find((id) => unit(engine, id).alive) ?? fightersOf(act)[0]!;
    engine.submit(rowOf(d, 'ability', 'x2-dark-knight-darkness', []) ?? attackOf(d, standing));
  }
  throw new Error('the link did not end');
}

describe('the record', () => {
  it('is the chapter getChapter finds: id, game, number 53, hidden (experimental), the lane\'s scene, build, first group and music', () => {
    expect(getChapter(ids.FIEND_SUPERBOSSES_ID)).toBe(FFX2_FIEND_SUPERBOSSES);
    expect(FFX2_FIEND_SUPERBOSSES).toMatchObject({
      id: 'ffx2-fiend-superbosses',
      game: 'ffx2',
      number: 53,
      experimental: true,
      title: 'The Fiend Arena Superbosses',
      sceneKey: ids.FIEND_SUPERBOSSES_SCENE,
      thumbnailKey: 'chapter-ffx2-fiend-superbosses',
      music: { scene: 'scene-bevelle-underground', battle: 'boss-trema', victory: 'victory-ffx2' },
    });
    expect(FFX2_FIEND_SUPERBOSSES.buildRef).toBe(fiendSuperbossBuild);
    expect(FFX2_FIEND_SUPERBOSSES.enemyGroupRef).toBe(act1ShinraGroup);
    expect(FFX2_FIEND_SUPERBOSSES.scriptsRef).toBe(S);
    for (const key of ['title', 'subtitle', 'location', 'blurb'] as const) expect(FFX2_FIEND_SUPERBOSSES[key]).toBe(FIEND_SUPERBOSSES_TEXT[key]);
  });

  it('the music is the groups\' own stand-in cue (LG9): both acts open on boss-trema, and the chapter names the same', () => {
    for (const g of [act1ShinraGroup, act2NumerusGroup]) expect(JSON.stringify(g.musicCues), g.id).toContain('boss-trema');
  });

  it('the number is the program row\'s and unique among every registered chapter', () => {
    const all = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.number === 53);
    expect(all.map((c) => c.id)).toEqual(['ffx2-fiend-superbosses']);
  });

  it('the Sensor lines are the five fighting enemies\' own, one each, and the three hidden parts carry none', () => {
    expect(Object.keys(FFX2_FIEND_SUPERBOSSES.sensorTexts).sort()).toEqual([ids.X2_ALMIGHTY_SHINRA_ID, ...ids.NUMERUS_HEAD_IDS].sort());
    const defs = [x2AlmightyShinra, x2NumerusUnum, x2NumerusDuo, x2NumerusTria, x2NumerusQuattour];
    for (const d of defs) {
      expect(FFX2_FIEND_SUPERBOSSES.sensorTexts[d.id], d.id).toBe(d.sensorText);
      expect(d.sensorText!.length, d.id).toBeGreaterThan(40);
    }
    expect(new Set(Object.values(FFX2_FIEND_SUPERBOSSES.sensorTexts)).size).toBe(5);
  });

  it('every Sensor line tells the truth of the data: Shinra\'s six beats and the Impact, Unum\'s Command, Duo\'s coin, Tria\'s Fulmen, Quattour\'s nine beats', () => {
    const t = FFX2_FIEND_SUPERBOSSES.sensorTexts;
    expect(t[ids.X2_ALMIGHTY_SHINRA_ID]).toMatch(/Six beats/);
    expect(t[ids.X2_ALMIGHTY_SHINRA_ID]).toMatch(/an eighth of everyone/);
    expect(t[ids.X2_ALMIGHTY_SHINRA_ID]).toMatch(/fourteen times/);
    expect(t[ids.X2_NUMERUS_UNUM_ID]).toMatch(/four and a half seconds/);
    expect(t[ids.X2_NUMERUS_DUO_ID]).toMatch(/flips a coin/);
    expect(t[ids.X2_NUMERUS_DUO_ID]).toMatch(/nine beats/);
    expect(t[ids.X2_NUMERUS_TRIA_ID]).toMatch(/Fulmen/);
    expect(t[ids.X2_NUMERUS_QUATTOUR_ID]).toMatch(/nine beats/);
  });
});

describe('the build (LG3)', () => {
  it('is a deep copy of Chapter XIII\'s Lv 99 line: equal to it, not the same object, and mutating one never reaches the other', () => {
    expect(fiendSuperbossBuild).toEqual(viaInfinitoBuild);
    expect(fiendSuperbossBuild).not.toBe(viaInfinitoBuild);
    expect(fiendSuperbossBuild.members).not.toBe(viaInfinitoBuild.members);
    const before = JSON.stringify(viaInfinitoBuild);
    const copy = structuredClone(fiendSuperbossBuild);
    copy.members[0]!.level = 1;
    expect(JSON.stringify(viaInfinitoBuild)).toBe(before);
  });

  it('is the party the lane\'s helper measures (the Lv 99 three, ten Megalixirs, Light and Lunar Curtains and Remedies, no Dark Matter and no Phoenix Downs)', () => {
    expect(fiendSuperbossBuild.members.map((m) => m.id)).toEqual([...GIRLS]);
    const bag = Object.fromEntries(fiendSuperbossBuild.inventory.map((i) => [i.itemId, i.count]));
    expect(bag).toMatchObject({ 'x2-megalixir': 10, 'x2-light-curtain': 10, 'x2-lunar-curtain': 10, 'x2-remedy': 10 });
    expect(bag['x2-dark-matter']).toBeUndefined(); // so no Miracle Drink can be mixed as built: the guide and the tip promise none
    expect(bag['x2-phoenix-down']).toBeUndefined();
    for (const m of fiendSuperbossBuild.members) expect(m.level, m.id).toBe(99);
  });
});

describe('the pause metadata', () => {
  it('is registered for the chapter, FFX-2, numeral EXP, with three objectives whose rules fit the two acts', () => {
    expect(getChapterMeta(ids.FIEND_SUPERBOSSES_ID)).toBe(FIEND_SUPERBOSSES_META);
    expect(FIEND_SUPERBOSSES_META).toMatchObject({ id: 'ffx2-fiend-superbosses', gameLabel: 'FFX-2', numeral: 'EXP', focalCharacterId: 'paine' });
    expect(FIEND_SUPERBOSSES_META.objectives.map((o) => o.rule)).toEqual([
      { kind: 'link-reached', link: 2 },
      { kind: 'parts-downed', targetIds: [ids.X2_NUMERUS_UNUM_ID] },
      { kind: 'victory' },
    ]);
    expect(new Set(FIEND_SUPERBOSSES_META.objectives.map((o) => o.id)).size).toBe(3);
  });

  it('its words are the record\'s, and the quote is a line of the pre scene, in Paine\'s mouth', () => {
    for (const key of ['title', 'subtitle', 'location', 'blurb'] as const) expect(FIEND_SUPERBOSSES_META[key]).toBe(FIEND_SUPERBOSSES_TEXT[key]);
    const line = S.pre.find((s) => s.type === 'say' && s.text === FIEND_SUPERBOSSES_META.quote.text);
    expect(line, 'the quote is a pre-scene line').toBeDefined();
    expect((line as { who: string }).who).toBe('paine');
    expect(FIEND_SUPERBOSSES_META.quote.speaker).toBe('Paine');
  });

  it('the tip is short (no short form needed) and promises nothing the Lv 99 kit cannot do: no Miracle Drink, no Thunder-proofing, no Dispel', () => {
    expect(FIEND_SUPERBOSSES_META.tip.length).toBeLessThanOrEqual(170);
    expect(FIEND_SUPERBOSSES_META.tip).toMatch(/Darkness ignores/);
    expect(FIEND_SUPERBOSSES_META.tip).toMatch(/Protect and Shell do not stop one/);
    expect(FIEND_SUPERBOSSES_META.tip).not.toMatch(/Miracle|Invincible|Thunder-proof|Dispel|Mix/i);
  });

  it('the music keys are the record\'s, and the stand-in hero art and snapshots name files that exist (the stand-ins are stated in the header)', () => {
    expect([...FIEND_SUPERBOSSES_META.musicKeys]).toEqual(['scene-bevelle-underground', 'boss-trema', 'victory-ffx2']);
    expect(FIEND_SUPERBOSSES_META.heroArt).toBe('pause/ch13-trema');
    expect(FIEND_SUPERBOSSES_META.snapshots.map((s) => s.image)).toEqual(['backdrops/den-of-woe.png', 'characters/trema/idle.png', 'characters/x2-aranea/idle.png']);
  });
});

describe('the setup', () => {
  it('plays the chapter\'s party against act 1, cannot be fled, and carries the four triggers in the order of the record', async () => {
    await registerBattleContent();
    const setup = setupForChapter(FFX2_FIEND_SUPERBOSSES, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.enemies).toBe(act1ShinraGroup);
    expect(setup.triggers.map((t) => t.id)).toEqual(['first-clione', 'first-final-impact', ids.FS_SEAM_1, 'first-command']);
  });

  it('the engine offers no Escape row on either act (the foes\' scripts are held back, so the first menu comes before the base party falls)', async () => {
    await registerBattleContent();
    for (const act of [1, 2] as Act[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_FIEND_SUPERBOSSES, 3), enemies: forcedAct(act).group });
      const d = nextInput(engine, 4000);
      expect(d, `act ${act}`).not.toBeNull();
      expect(d!.commands.filter((c) => c.enabled && /escape|flee/i.test(c.command.kind)), `act ${act}`).toHaveLength(0);
    }
  });

  it('the chain loop finds act 2 by id from act 1, and the data objects are the ones the chapter names', async () => {
    await registerBattleContent();
    const seen: string[] = [FFX2_FIEND_SUPERBOSSES.enemyGroupRef.id];
    let group: EnemyGroupDef = FFX2_FIEND_SUPERBOSSES.enemyGroupRef;
    for (let i = 0; i < 5 && group.nextGroupId; i++) {
      const next = await findEnemyGroup(group.nextGroupId);
      expect(next, group.nextGroupId).toBeDefined();
      group = next!;
      seen.push(group.id);
    }
    expect(seen).toEqual([...ids.FIEND_SUPERBOSSES_GROUP_IDS]);
    expect(group).toBe(act2NumerusGroup);
    expect(group.nextGroupId).toBeUndefined();
  });
});

describe('the chain to a victory', () => {
  it('two acts, each a fresh fight: act 2 opens at full HP and MP with a fallen girl standing, spent items stay spent, nothing else carries; act 2 has no next', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3]) {
      let setup = setupForChapter(FFX2_FIEND_SUPERBOSSES, seed);
      let group: EnemyGroupDef = setup.enemies;
      const outcomes: string[] = [];
      let engine = engineFor(setup);
      for (const act of [1, 2] as Act[]) {
        expect(group.enemies[0]!.id, `seed ${seed} act ${act}`).toBe(act === 1 ? ids.X2_ALMIGHTY_SHINRA_ID : ids.X2_NUMERUS_UNUM_ID);
        if (act === 2) {
          // The arena's seam: whatever act 1 did to the girls, act 2 opens whole.
          for (const girl of girlsOf(engine)) {
            expect(girl.hp, `seed ${seed} ${girl.id}`).toBe(girl.stats.maxHp);
            expect(girl.mp, `seed ${seed} ${girl.id}`).toBe(girl.stats.maxMp);
            expect(girl.alive, `seed ${seed} ${girl.id}`).toBe(true);
            expect(Object.keys(girl.statuses).filter((s) => s !== 'ko'), `seed ${seed} ${girl.id}: nothing else carries`).toEqual([]);
          }
          expect(engine.state().flags['inventory:x2-megalixir'], `seed ${seed}: a Megalixir spent in act 1 stays spent`).toBe(9);
        }
        outcomes.push(winLink(engine, act).outcome);
        // Wreck the party on the way out: HP 1, MP 0, Rikku down, one Megalixir spent. The next act must not care (but must keep the spent item).
        const after = engine.state();
        for (const id of GIRLS) {
          const g = after.combatants[id] as unknown as { hp: number; mp: number; alive: boolean };
          g.hp = id === 'rikku' ? 0 : 1;
          g.mp = 0;
          if (id === 'rikku') g.alive = false;
        }
        after.flags['inventory:x2-megalixir'] = 9;
        if (!group.nextGroupId) break;
        const next = await findEnemyGroup(group.nextGroupId);
        expect(next).toBeDefined();
        setup = setupForNextLink(setup, next!, after as BattleState, seed + act);
        group = next!;
        engine = engineFor(setup);
      }
      expect(outcomes, `seed ${seed}`).toEqual(['victory', 'victory']);
      expect(group.nextGroupId).toBeUndefined();
    }
  }, 120_000);

  it('the last head down ends act 2 with the body and pod at 0 HP and the tail at 1 (the heads\' death entry, stage 2), and the result is a victory', async () => {
    await registerBattleContent();
    const engine = engineFor({ ...setupForChapter(FFX2_FIEND_SUPERBOSSES, 5), enemies: act2NumerusGroup });
    expect(winLink(engine, 2).outcome).toBe('victory');
    expect([ids.X2_NUMERUS_BODY_ID, ids.X2_NUMERUS_POD_ID, ids.X2_NUMERUS_TAIL_ID].map((id) => unit(engine, id).hp)).toEqual([0, 0, 1]);
  });
});

describe('the results page: what each act pays (the kill rows of the lane\'s stage 1, through the engine)', () => {
  it('act 1 pays Shinra\'s row (3,000 EXP, 3,000 Gil, 1 AP, Dark Matter x2) and names act 2 next; act 2 pays the four heads\' rows (24,000 EXP, 20,000 Gil, 4 AP, no drop in our tables) and has no next, to every girl alike', async () => {
    await registerBattleContent();
    const one = winLink(engineFor(setupForChapter(FFX2_FIEND_SUPERBOSSES, 2)), 1).result;
    expect([one['exp'], one['gil'], one['ap'], one['drops'], one['nextGroupId']]).toEqual([3000, 3000, 1, [{ itemId: 'x2-dark-matter', count: 2 }], ids.ACT_2_GROUP_ID]);
    const two = winLink(engineFor({ ...setupForChapter(FFX2_FIEND_SUPERBOSSES, 2), enemies: act2NumerusGroup }), 2).result;
    expect([two['exp'], two['gil'], two['ap'], two['drops'], two['nextGroupId']]).toEqual([24_000, 20_000, 4, [], undefined]);
    for (const girl of GIRLS) expect((two['rewardsByMember'] as Record<string, { exp: number; ap: number }>)[girl], girl).toEqual({ exp: 24_000, ap: 4 });
    expect(two['exp']).toBe([x2NumerusUnum, x2NumerusDuo, x2NumerusTria, x2NumerusQuattour].reduce((n, h) => n + (h.rewards.exp ?? 0), 0));
  });
});

describe('the shipped auto-battler plays the chain (the tactic is registered; stage 4 measures the lines)', () => {
  it('through the app path it neither throws nor wedges: it reaches a verdict on every seed (the base party loses, as the lane measured)', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3]) {
      const r = await playChain(FFX2_FIEND_SUPERBOSSES, seed, 'bench');
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(r.outcome);
    }
  }, 120_000);
});

describe('the defeat and the retry checkpoint', () => {
  it('a party that only defends loses to both acts (the engine ends the fight in defeat, never in a stalemate)', async () => {
    await registerBattleContent();
    for (const act of [1, 2] as Act[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_FIEND_SUPERBOSSES, 5), enemies: act === 1 ? act1ShinraGroup : act2NumerusGroup });
      let outcome = '';
      for (let i = 0; i < 30_000 && outcome === ''; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') outcome = String(d.result.outcome);
        else if (d.kind === 'waiting') engine.tick(Math.max(25, d.nextEventMs));
        else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      }
      expect(outcome, `act ${act}`).toBe('defeat');
    }
  }, 120_000);

  it('act 2 is a retry checkpoint (link 2): the retry setup opens ACT 2 with the party whole; act 1 has none, so a defeat there starts the chapter over', async () => {
    await registerBattleContent();
    const first = setupForChapter(FFX2_FIEND_SUPERBOSSES, 9);
    expect(checkpointAt(1, act1ShinraGroup, first)).toBeNull();
    // The state act 1 left the party in: Rikku down, the others on 1 HP.
    const wrecked = {
      ...first,
      enemies: act2NumerusGroup,
      party: {
        ...first.party,
        members: (first.party as { members: Array<{ id: string; hp?: number; mp?: number }> }).members.map((m) => ({ ...m, hp: m.id === 'rikku' ? 0 : 1, mp: 0 })),
      },
    } as BattleSetup;
    const cp = checkpointAt(2, act2NumerusGroup, wrecked);
    expect(cp).not.toBeNull();
    const retry = resumeSetup(cp!, 77);
    expect(retry.enemies.id).toBe(act2NumerusGroup.id);
    const engine = engineFor(retry);
    for (const girl of girlsOf(engine)) {
      expect(girl.hp, girl.id).toBe(girl.stats.maxHp);
      expect(girl.alive, girl.id).toBe(true);
    }
    for (const id of ids.NUMERUS_HEAD_IDS) expect(unit(engine, id).hp, id).toBe(unit(engine, id).stats.maxHp); // the heads start at full
  });
});

describe('the story triggers fire as the real engine plays the acts', () => {
  /** Play `act` with its fighters' scripts answering `commands` (forced) and the chapter's own triggers; return the names of the script-triggers that fired. */
  function fired(act: Act, commands: Array<{ who: string; c: ReturnType<typeof move> }>, opts: { koAct?: boolean } = {}): string[] {
    const f = forcedAct(act);
    const setup = { ...setupForChapter(FFX2_FIEND_SUPERBOSSES, 4), enemies: f.group };
    const engine = engineFor(setup);
    bigHp(engine);
    for (const { who, c } of commands) f.queues[who]!.push(c);
    if (opts.koAct) {
      winLink(engine, act);
    } else {
      const last = commands[commands.length - 1]!.who;
      expect(playUntilActed(engine, last, commands.filter((x) => x.who === last).length + 1, undefined, { maxDecisions: 4000 })).toBe(true);
    }
    return logOf(engine)
      .filter((e) => e.type === 'script-trigger')
      .map((e) => (e as unknown as { name: string }).name);
  }
  const A = ids.FS_ABILITY;

  it('each callout fires once, after its move starts: Shinra\'s first Clione, his first Final Impact, the first Fulmen Command', () => {
    const s = ids.X2_ALMIGHTY_SHINRA_ID;
    expect(fired(1, [{ who: s, c: move(A.clione) }, { who: s, c: move(A.clione) }])).toEqual(['first-clione']);
    expect(fired(1, [{ who: s, c: move(A.finalImpact) }, { who: s, c: move(A.finalImpact) }])).toEqual(['first-final-impact']);
    const t = ids.X2_NUMERUS_TRIA_ID;
    expect(fired(2, [{ who: t, c: move(A.fulmenCommand) }, { who: t, c: move(A.fulmenCommand) }])).toEqual(['first-command']);
  });

  it('the seam fires on the KO of Shinra, and the fall of the last head (the close) plays no seam', () => {
    expect(fired(1, [], { koAct: true })).toEqual([ids.FS_SEAM_1]);
    expect(fired(2, [], { koAct: true })).toEqual([]);
  });

  it('the Commands of the other three heads call out nothing: the callout is Tria\'s Fulmen alone', () => {
    expect(fired(2, [{ who: ids.X2_NUMERUS_UNUM_ID, c: move(A.radisCommand, ['yuna']) }, { who: ids.X2_NUMERUS_UNUM_ID, c: move(A.radisCommand, ['rikku']) }])).toEqual([]);
  });
});

describe('the stage and the store', () => {
  it('the scene key is the Den of Woe\'s registered scene (a factory, not a placeholder): the flagged stand-in (LG5)', () => {
    expect(FFX2_FIEND_SUPERBOSSES.sceneKey).toBe('den-of-woe');
    const scene = getScene(FFX2_FIEND_SUPERBOSSES.sceneKey);
    expect(scene, 'registered').toBeDefined();
    expect(scene!.placeholder).toBe(false);
    expect(getSceneFactory(FFX2_FIEND_SUPERBOSSES.sceneKey), 'has a factory').toBeDefined();
  });

  it('an attempt and a clear go to the experiments\' store under the chapter\'s id, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(ids.FIEND_SUPERBOSSES_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(ids.FIEND_SUPERBOSSES_ID);
      experimentProgress.recordClear(ids.FIEND_SUPERBOSSES_ID, 1_200_000, 3);
      expect(experimentRecord(ids.FIEND_SUPERBOSSES_ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 1_200_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([ids.FIEND_SUPERBOSSES_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});

describe('without the word the chapter is on no list (the absence tests)', () => {
  it('it is in the experiment table and nowhere else: not a listed chapter, not an id of the board, not an unlisted chapter', () => {
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_FIEND_SUPERBOSSES);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(ids.FIEND_SUPERBOSSES_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(ids.FIEND_SUPERBOSSES_ID)).toBe(false);
    expect(UNLISTED_CHAPTERS.map((c) => c.id as string)).not.toContain(ids.FIEND_SUPERBOSSES_ID);
    expect(FFX2_FIEND_SUPERBOSSES.experimental).toBe(true);
  });

  it('no other chapter\'s record starts on one of the chapter\'s act groups (the groups belong to this chapter alone)', () => {
    const own = new Set<string>(ids.FIEND_SUPERBOSSES_GROUP_IDS);
    for (const c of [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS]) {
      if (c.id === ids.FIEND_SUPERBOSSES_ID) continue;
      expect(own.has(c.enemyGroupRef.id), `${c.id} starts on one of the chapter's groups`).toBe(false);
    }
  });
});
