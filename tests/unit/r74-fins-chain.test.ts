/**
 * THE CHAIN OF CHAPTER XVII UNDER THE PRO STAGING (r74-fins, 2026-11-02; FFX only, rule 14: Cid's Trigger Command, the airship range, aeons: `research/ffx-sin.md` section 0.3). The paper preflight of `booth-leblanc` (`docs/plans/booth-leblanc-review.md`,
 * section 4) asks of every chapter that joins: does it chain, which victory kind, do its foes yield, does one foe change its painting inside the fight. Chapter XVII is the longest chain that joins in one piece: THREE links on one party state, with no rest
 * between them (D-270): the Left Fin (Cid beside it, never drawn), the Right Fin, then Sinspawn Genais with Sin's Core on Sin's back. `booth-b4-last-chain` declared its shape while the chapter was out; this runs it.
 *
 * Pinned, with the REAL engine, presenter, party, shipped tactic and chain loop and a recording staging port that keeps the ending marks the way `EndingView` does (the shape of `booth-b4-last-chain`): no ending cue before the last link (a fin torn away
 * between links is not an ending), one clear per later link, the one freeze on the last link's foe and the one title naming it, the HUD in at the start of every link, the ribbon naming the right foe at each, no form change anywhere (defect class 5), no
 * Change plate in FFX, no held breath (the chapter holds it) and Cid never named by a cue. **The fight is the SHIPPED one** (no foe weakened): the intended line wins it on the seed below.
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
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
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

const ID = 'sin-fins-core';
/** The seed the intended line wins the shipped fight on, all three links. */
const SEED = 1;
/** The links by foe (the chain's declared shape) and the foe the ribbon names at each link's first menu. */
const LINKS = [['left-fin', 'cid'], ['right-fin', 'cid'], ['sinspawn-genais', 'sin-core']] as const;
const HEADS = ['left-fin', 'right-fin', 'sinspawn-genais'] as const;

/** A staging port that keeps what `EndingView` keeps (the marks), so the test reads what the player would see: `hud` is the HUD's opacity a minute after the last cue. */
class RecordingPort implements StagingPort {
  readonly log: string[] = [];
  /** Each ending cue with the foe it names (a freeze or a title at a mid-fight foe, or at Cid, must fail, not only a wrong count). */
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

/** The links of the chapter by group, foes by id (the chain's declared shape). */
async function declared(): Promise<string[][]> {
  const out: string[][] = [];
  let g = getChapter(ID)!.enemyGroupRef;
  for (;;) {
    out.push(g.enemies.map((e) => e.id));
    if (g.nextGroupId === undefined) return out;
    g = (await findEnemyGroup(g.nextGroupId))!;
  }
}

describe('what the chapter declares (rule 14, from the sources)', () => {
  it('is an FFX chapter, three links: the left Fin, the right Fin, then Genais and the Core; Cid stands beside each Fin and is never drawn', async () => {
    expect(getChapter(ID)!.game).toBe('ffx');
    expect(await declared()).toEqual(LINKS.map((l) => [...l]));
  });

  it('has the "pose" victory kind (the party poses: the sources withhold it only at Zanarkand and after Bahamut, Shuyin and the Via Infinito bosses), and its music is FFX\'s', () => {
    expect(getChapterMeta(ID)?.victoryPose ?? 'pose').toBe('pose');
    expect(getChapter(ID)!.music.victory).toBe('victory-ffx');
  });
});

describe('the victory beat at a seam of the chain, and at the end', () => {
  it("a fin's death (another formation follows) cues nothing and leaves the HUD in; the Core's, the last, cues the one title and takes the HUD out for the results", () => {
    setDemoChapter(ID);
    const port = new RecordingPort();
    const party = ['tidus', 'yuna', 'auron'];
    expect(stageVictory(ctxOf(port, 'left-fin', party, { moreLinks: true }), 'pose', 900)).toBe(0);
    expect(stageVictory(ctxOf(port, 'right-fin', party, { moreLinks: true }), 'pose', 900)).toBe(0);
    expect(port.log).toEqual([]);
    expect(port.hud()).toBe(1);
    expect(stageVictory(ctxOf(port, 'sin-core', party, { moreLinks: false }), 'pose', 900)).toBeGreaterThanOrEqual(900);
    expect(port.log[0]).toBe('ending:title');
    expect(port.hud()).toBe(0);
  });

  it("the cheer's floor reads FFX's table (Tidus 3,666.7 ms, Auron 4,000), never FFX-2's 3,400", () => {
    setDemoChapter(ID);
    expect(stageVictory(ctxOf(new RecordingPort(), 'sin-core', ['tidus', 'wakka', 'rikku']), 'pose', 900)).toBeGreaterThanOrEqual(3600);
  });

  it('the first link leaves the layer alone; every later link clears it', () => {
    const port = new RecordingPort();
    const ctx = ctxOf(port, 'right-fin', ['tidus'], { moreLinks: false });
    stageLinkBegins(ctx);
    expect(port.clears).toBe(0);
    port.ending({ game: 'ffx', scale: 1, calm: false, tame: false, kind: 'title', boss: 'left-fin' });
    stageLinkBegins(ctx);
    expect(port.clears).toBe(1);
    expect(port.hud()).toBe(1);
  });
});

/** The REAL chain of the chapter (real engine, presenter and chain loop; the recording staging port) at its shipped HP, on the seed. */
async function playChain() {
  setDemoChapter(ID);
  setPaceGame('ffx');
  const chapter = getChapter(ID)!;
  const setup = setupForChapter(chapter, SEED);
  await registerBattleContent();
  const engine: BattleEngine = new FFXEngine({ autoResolveMinigames: true });
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
    chapter, presenter, engine, stage: { stage: restage }, group: chapter.enemyGroupRef, setup, seed: SEED, findGroup: findEnemyGroup, audio: new FakeAudio(),
    onLink: ({ links: n }) => {
      port.log.push(`link:${n}`);
      hudAtLinkStart.push(port.hud());
      headAtLinkStart.push(headlineEnemy(engine.state(), getChapter(ID)!.enemyGroupRef.bossId)?.id);
    },
  });
  return { result, port, seen, atSwap, hudAtLinkStart, headAtLinkStart, cap };
}

describe('the real chain, one layer', () => {
  it("no ending cue before the last link, one clear per later link, one freeze and one title on the last link's foe (never Cid), the HUD in at every link's start, no form change, no Change plate, no held breath", async () => {
    const { result, port, seen, atSwap, hudAtLinkStart, cap } = await playChain();
    expect(result.links, `decisions ${cap.decisions()}, capped ${cap.capped()}`).toBe(3);
    expect(result.outcome.kind).toBe('victory');
    const at = (s: string): number => port.log.indexOf(s);
    for (const [i, e] of port.log.entries()) if (e.startsWith('ending:')) expect(i, `${e} before the last link`).toBeGreaterThan(at('link:3')); // a seam cues no freeze, title or pull-back: only the last link ends
    expect(port.log.filter((e) => e === 'ending:freeze')).toHaveLength(1);
    const names = port.endings.filter((e) => e.kind === 'freeze' || e.kind === 'title').map((e) => e.boss);
    expect(names, "the freeze and the title name the Core, the foe whose death ends the last link (never a Fin, Genais or Cid)").toEqual(['sin-core', 'sin-core']);
    expect(port.endings.map((e) => e.boss)).not.toContain('cid');
    expect(port.log.filter((e) => e === 'ending:pullback')).toEqual([]); // the `pose` kind: the party poses, no silent pull-back
    expect(port.clears).toBe(2);
    expect(port.log.lastIndexOf('clear')).toBeLessThan(at('ending:title'));
    expect(hudAtLinkStart).toEqual([1, 1, 1]);
    expect(seen.filter((e) => e.type === 'form-change'), 'defect class 5: a single-form foe has no form change for the freeze guard to meet').toEqual([]);
    expect(atSwap.filter((s) => s.ending.length > 0), 'a painting swap at which an ending cue stood').toEqual([]);
    expect(port.log.filter((e) => e === 'opening:change')).toEqual([]); // the Change plate is FFX-2's
    expect(port.log.filter((e) => e.startsWith('breath:'))).toEqual([]); // the chapter holds the staged breath
  }, 600_000);

  it('the F1 ribbon names the left Fin, then the right Fin, then Genais at the first menu of each link', async () => {
    const { headAtLinkStart } = await playChain();
    expect(headAtLinkStart).toEqual([...HEADS]);
  }, 600_000);
});
