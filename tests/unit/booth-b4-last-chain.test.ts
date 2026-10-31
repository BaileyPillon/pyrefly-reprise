/**
 * THE CHAINS OF THE LAST FIVE LISTED CHAPTERS UNDER THE PRO STAGING (release 71, branch `booth-b4-last`; Bailey 2026-10-30: the booth treatment for every listed chapter). The paper preflight of `booth-leblanc` (`docs/plans/booth-leblanc-review.md`, section 4) asks of every
 * chapter that joins: does it chain, which victory kind, do its foes yield, does one foe change its painting inside the fight. Chapter VIII (Evrae, one link with Cid beside him), Chapter XVIII (Sin's face, one link), the Mirror Aeons chapter (TWO links: the Dark Sisters, then Dark Yojimbo
 * and Daigoro after a plate swap) and Chapter XVI (Ixion, one link, FFX-2) each run on one presenter and one staging layer; Chapter XVII (Sin's Fins and Core, THREE links) is not treated, so only what it declares is read here.
 *
 * Pinned, with the REAL engines, presenter, party, shipped tactic and chain loop and a recording staging port that keeps the ending marks the way `EndingView` does (the shape of `booth-ffx-b3b-chain` and `booth-ffx2-b3-chain`): no ending cue before the last link, one clear per later link, the one
 * freeze on the last link's foe and the one title naming it, the HUD in at the start of every link, the ribbon naming the right foe at each, no form change anywhere (defect class 5), no Change plate in FFX and no held breath anywhere (every chapter holds the breath). **Every fight is the SHIPPED one**
 * (no foe weakened): the intended line wins Evrae, Sin's face and Ixion on seed 1 and the Mirror Aeons pair and Dark Yojimbo on seed 2 (it loses seeds 1, 5 and 8 of the first eight; the chapter's bench puts the line at 66 to 77 percent: `docs/plans/ch-mirror-aeons-bench.md`), each in well under a second with the sleeps stubbed.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BattleEngine, BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import { headlineEnemy } from '../../src/battle/common/headlineEnemy.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { stageLinkBegins, stageVictory } from '../../src/engine/BattlePresenterStaging.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import { FFXEngine } from '../../src/battle/ffx/engine.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setStagingMode } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import { takeDefeatNote } from '../../src/engine/pro/staging/DefeatNote.ts';
import { emptyEnd, endFrame, type EndMarks } from '../../src/engine/pro/staging/EndingPlan.ts';
import type { BreathCue, EndingCue, OpeningCue, StagingPort } from '../../src/engine/pro/staging/StagingPort.ts';
import { FakeAudio, FakeStage } from './helpers/FakeStage.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';

/** A staging port that keeps what `EndingView` keeps (the marks), so the test reads what the player would see: `hud` is the HUD's opacity a minute after the last cue. */
class RecordingPort implements StagingPort {
  readonly log: string[] = [];
  /** Each ending cue with the foe it names (a freeze or a title at a mid-fight foe must fail, not only a wrong count). */
  readonly endings: Array<{ kind: string; boss: string }> = [];
  marks: EndMarks = emptyEnd();
  clears = 0;
  breath(cue: BreathCue): void {
    this.log.push(`breath:${cue.kind}`);
  }
  opening(cue: OpeningCue): void {
    this.log.push(`opening:${cue.kind}`);
  }
  ending(cue: EndingCue): void {
    this.log.push(`ending:${cue.kind}`);
    this.endings.push({ kind: cue.kind, boss: cue.kind === 'freeze' || cue.kind === 'title' ? cue.boss : '' });
    if (cue.kind === 'freeze') this.marks.freezeAt = 0;
    else if (cue.kind === 'title') this.marks.titleAt = 0;
    else if (cue.kind === 'pullback') this.marks.pullAt = 0;
    else if (cue.kind === 'fall') this.marks.fallAt = 0;
  }
  clear(): void {
    this.clears++;
    this.log.push('clear');
    this.marks = emptyEnd();
  }
  hud(): number {
    return endFrame(60_000, this.marks).hud;
  }
}

interface Row {
  readonly id: string;
  readonly game: 'ffx' | 'ffx2';
  readonly links: number;
  /** The foe the last link names (the freeze and the title), and the foe the ribbon names at each link's first menu. */
  readonly last: string;
  readonly heads: readonly string[];
  /** The seed the intended line wins the shipped fight on. */
  readonly seed: number;
}

/** The four chapters that joined (rule 14 from the sources: Evrae, Sin's face and the Mirror Aeons chapter are FFX's; Ixion at Djose is FFX-2's, `research/ffx2-ixion-djose.md` section 0). */
const ROWS: readonly Row[] = [
  { id: 'evrae-airship', game: 'ffx', links: 1, last: 'evrae', heads: ['evrae'], seed: 1 },
  { id: 'sin-face', game: 'ffx', links: 1, last: 'overdrive-sin', heads: ['overdrive-sin'], seed: 1 },
  { id: 'mirror-aeons', game: 'ffx', links: 2, last: 'dark-yojimbo', heads: ['dark-mindy', 'dark-yojimbo'], seed: 2 },
  { id: 'ffx2-ixion-djose', game: 'ffx2', links: 1, last: 'x2-ixion', heads: ['x2-ixion'], seed: 1 },
];

beforeEach(() => {
  setTreatedScope('all');
  setStagingMode('pro');
  setPaceGame('ffx');
  setPace('steady');
  takeDefeatNote();
});
afterEach(() => {
  setTreatedScope(null);
  setStagingMode(null);
  setDemoChapter(undefined);
  setPaceGame('other');
  takeDefeatNote();
});

/** A bare presenter context for the pure beats: the party and one foe on the field. */
function ctxOf(port: StagingPort, foe: string, party: string[], o: { moreLinks?: boolean } = {}): EventCtx {
  return {
    deps: { staging: port },
    speed: () => 'normal',
    moments: { reducedMotion: false, reducedFlashes: false },
    stage: { staged: () => [...party, foe], sideOf: (id: string) => (id === foe ? 'enemy' : 'party'), artOf: (id: string) => id, camera: {} },
    menuOpen: () => false,
    ...(o.moreLinks === undefined ? {} : { moreLinks: o.moreLinks }),
    sleep: () => Promise.resolve(),
  } as unknown as EventCtx;
}

/** The links of a chapter by group, foes by id (the chain's declared shape). */
async function declared(id: string): Promise<string[][]> {
  const out: string[][] = [];
  let g = getChapter(id)!.enemyGroupRef;
  for (;;) {
    out.push(g.enemies.map((e) => e.id));
    if (g.nextGroupId === undefined) return out;
    g = (await findEnemyGroup(g.nextGroupId))!;
  }
}

describe('what each chapter declares (rule 14, from the sources)', () => {
  it.each(ROWS)('$id: $game, $links link(s), the "pose" victory kind (the party poses: the sources withhold it only at Zanarkand and after Bahamut, Shuyin and the Via Infinito bosses)', async ({ id, game, links, last }) => {
    expect(getChapter(id)!.game).toBe(game);
    expect(getChapterMeta(id)?.victoryPose ?? 'pose').toBe('pose');
    const ls = await declared(id);
    expect(ls).toHaveLength(links);
    expect(ls.at(-1)).toContain(last);
  });

  it("Chapter XVII (Sin's Fins and Core, not treated) chains THREE links: the left Fin, the right Fin, then Genais and the Core; Cid stands beside each Fin and is never drawn", async () => {
    expect(await declared('sin-fins-core')).toEqual([['left-fin', 'cid'], ['right-fin', 'cid'], ['sinspawn-genais', 'sin-core']]);
  });

  it("the Mirror Aeons chapter's two links are two plates: the second names the Cavern's (a swap under a white pulse), the first the road's", async () => {
    const g1 = getChapter('mirror-aeons')!.enemyGroupRef;
    expect(g1.plate).toBeUndefined();
    expect((await findEnemyGroup(g1.nextGroupId!))!.plate).toBe('cavern-stolen-fayth');
    expect((await findEnemyGroup(g1.nextGroupId!))!.bossId).toBe('dark-yojimbo');
  });
});

describe('the victory beat at a seam of a chain, and at the end', () => {
  it("the Mirror Aeons chapter's first link (another formation follows) cues nothing and leaves the HUD in; the second, the last, cues the one title and takes the HUD out for the results", () => {
    setDemoChapter('mirror-aeons');
    const port = new RecordingPort();
    const party = ['tidus', 'yuna', 'auron'];
    expect(stageVictory(ctxOf(port, 'dark-sandy', party, { moreLinks: true }), 'pose', 900)).toBe(0);
    expect(port.log).toEqual([]);
    expect(port.hud()).toBe(1);
    expect(stageVictory(ctxOf(port, 'dark-yojimbo', party, { moreLinks: false }), 'pose', 900)).toBeGreaterThanOrEqual(900);
    expect(port.log[0]).toBe('ending:title');
    expect(port.hud()).toBe(0);
  });

  it("the cheer's floor reads each chapter's OWN game's table: FFX's clips (Tidus 3,666.7, Auron 4,000) in Evrae, Sin's face and the Mirror Aeons chapter; Chapter XVI's White Mage Yuna and Dark Knight Rikku play the rows decoded for Chapter IV's dresses, so the cheer is FFX-2's 3,400 ms, never FFX's 3,666.7 or 4,000", () => {
    for (const id of ['evrae-airship', 'sin-face', 'mirror-aeons']) {
      setDemoChapter(id);
      expect(stageVictory(ctxOf(new RecordingPort(), 'x', id === 'evrae-airship' ? ['tidus', 'wakka', 'rikku'] : ['tidus', 'yuna', 'auron']), 'pose', 900), id).toBeGreaterThanOrEqual(3600);
    }
    setDemoChapter('ffx2-ixion-djose');
    setPaceGame('ffx2');
    expect(stageVictory(ctxOf(new RecordingPort(), 'x2-ixion', ['yuna-white-mage', 'rikku-dark-knight', 'paine-dark-knight']), 'pose', 900)).toBe(3400); // Paine Dark Knight has no row and plays the house curves; the longest of the two rows decoded for the other two is 3,400 ms
  });

  it('the first link leaves the layer alone; every later link clears it', () => {
    const port = new RecordingPort();
    const ctx = ctxOf(port, 'dark-sandy', ['tidus'], { moreLinks: false });
    stageLinkBegins(ctx);
    expect(port.clears).toBe(0);
    port.ending({ game: 'ffx', scale: 1, calm: false, tame: false, kind: 'title', boss: 'dark-sandy' });
    stageLinkBegins(ctx);
    expect(port.clears).toBe(1);
    expect(port.hud()).toBe(1);
  });
});

/** The REAL chain of a chapter (real engine, presenter and chain loop; the recording staging port) at its shipped HP, on the row's seed. */
async function playChain(row: Row) {
  const seed = row.seed;
  setDemoChapter(row.id);
  setPaceGame(row.game);
  const chapter = getChapter(row.id)!;
  const setup = setupForChapter(chapter, seed);
  await registerBattleContent();
  const engine: BattleEngine = row.game === 'ffx' ? new FFXEngine({ autoResolveMinigames: true }) : new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const port = new RecordingPort();
  const stage = new FakeStage(setup.party.members.map((m) => m.id), chapter.enemyGroupRef.enemies.map((e) => e.id));
  const atSwap: Array<{ id: string; art: string; ending: string[] }> = [];
  const realSetArt = stage.setArt.bind(stage);
  stage.setArt = async (foe: string, art: string): Promise<void> => {
    atSwap.push({ id: foe, art, ending: port.log.filter((e) => e.startsWith('ending:')) });
    return realSetArt(foe, art);
  };
  const presenter = new BattlePresenter({ stage, audio: new FakeAudio(), sleep: () => Promise.resolve(), staging: port });
  presenter.setSpeed('normal');
  const cap = setCappedAutoPlay(presenter, intendedStrategy);
  const seen: BattleEvent[] = [];
  const play = presenter.play.bind(presenter);
  presenter.play = (events: readonly BattleEvent[], ...rest: unknown[]) => {
    seen.push(...events);
    return (play as (e: readonly BattleEvent[], ...r: unknown[]) => ReturnType<typeof play>)(events, ...rest);
  };
  const hudAtLinkStart: number[] = [];
  const headAtLinkStart: Array<string | undefined> = [];
  // each link's foes stand on the field the way the real stage stands them (a stub that stages nothing hides the last-blow freeze in every later link)
  const restage = async (state: BattleState): Promise<void> => {
    for (const known of [...stage.actors.keys()]) stage.removeCombatant(known);
    for (const [slot, pid] of state.activeIds.entries()) await stage.addCombatant(pid, { artId: pid, side: 'party', slot });
    for (const [slot, eid] of state.enemyIds.entries()) await stage.addCombatant(eid, { artId: eid, side: 'enemy', slot });
  };
  const result = await runEncounterChain({
    chapter, presenter, engine, stage: { stage: restage }, group: chapter.enemyGroupRef, setup, seed, findGroup: findEnemyGroup, audio: new FakeAudio(),
    onLink: ({ links: n }) => {
      port.log.push(`link:${n}`);
      hudAtLinkStart.push(port.hud());
      headAtLinkStart.push(headlineEnemy(engine.state(), getChapter(row.id)!.enemyGroupRef.bossId)?.id);
    },
  });
  return { result, port, seen, atSwap, hudAtLinkStart, headAtLinkStart, cap };
}

describe('the real chains, one layer', () => {
  for (const row of ROWS) {
    it(`${row.id}: no ending cue before the last link, one clear per later link, one freeze and one title on ${row.last}, the HUD in at every link's start, no form change, no held breath`, async () => {
      const { result, port, seen, atSwap, hudAtLinkStart, cap } = await playChain(row);
      const { links, last } = row;
      expect(result.links, `decisions ${cap.decisions()}, capped ${cap.capped()}`).toBe(links);
      expect(result.outcome.kind).toBe('victory');
      const at = (s: string): number => port.log.indexOf(s);
      for (const [i, e] of port.log.entries()) if (e.startsWith('ending:')) expect(i, `${e} before the last link`).toBeGreaterThan(at(`link:${links}`)); // a seam cues no freeze, title or pull-back: only the last link ends
      expect(port.log.filter((e) => e === 'ending:freeze')).toHaveLength(1);
      expect(port.endings.filter((e) => e.kind === 'freeze').map((e) => e.boss), "the freeze is on the last link's foe, never a mid-fight one").toEqual([last]);
      expect(port.endings.filter((e) => e.kind === 'title').map((e) => e.boss), "the one title names the last link's foe").toEqual([last]);
      expect(port.log.filter((e) => e === 'ending:pullback')).toEqual([]); // the `pose` kind: the party poses, no silent pull-back
      expect(port.clears).toBe(links - 1);
      expect(port.log.lastIndexOf('clear')).toBeLessThan(at('ending:title'));
      expect(hudAtLinkStart).toEqual(new Array(links).fill(1));
      expect(seen.filter((e) => e.type === 'form-change'), 'defect class 5: a single-form foe has no form change for the freeze guard to meet').toEqual([]);
      expect(atSwap.filter((s) => s.ending.length > 0), 'a painting swap at which an ending cue stood').toEqual([]);
      if (row.game === 'ffx') expect(port.log.filter((e) => e === 'opening:change')).toEqual([]); // the Change plate is FFX-2's
      expect(port.log.filter((e) => e.startsWith('breath:'))).toEqual([]); // every chapter holds the staged breath
    }, 600_000);

    it(`${row.id}: the F1 ribbon names ${row.heads.join(', then ')} at the first menu of each link`, async () => {
      const { headAtLinkStart } = await playChain(row);
      expect(headAtLinkStart).toEqual(row.heads);
    }, 600_000);
  }
});
