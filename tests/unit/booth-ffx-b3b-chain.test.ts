/**
 * THE CHAINED AND FORM-CHANGING FIGHTS OF BATCH 3b UNDER THE PRO STAGING (release 71, branch `booth-ffx-b3b`; FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter). The paper preflight of `booth-leblanc`
 * (`docs/plans/booth-leblanc-review.md`, section 4) asks of every chapter that joins: does it chain, which victory kind, do its foes yield, does one foe change its painting inside the fight. Chapter III chains SEVEN links (Braska's Final Aeon in two forms with the two
 * Yu Pagodas, five possessed aeons, Yu Yevon) and Chapter XIV THREE (Isaaru's Grothia, Pterya and Spathi, Yuna alone), each on one presenter and one staging layer, so every `victory()` beat runs at a seam (the critical the review of Leblanc found, C1: a title and a
 * sunk HUD left standing for the next link); Chapter XII is one link. Chapter III's first link also changes its foe's painting inside the fight (`braskas-final-aeon-1` to `-2` at `draws-sword`), the Chapter II case (a lone foe that "dies" into its next form must not
 * read as the last foe).
 *
 * Pinned, with the REAL engines, presenter, party, shipped tactic and chain loop and a recording staging port that keeps the ending marks the way `EndingView` does: no ending cue before the last link, one clear per later link, the one title last, the HUD in at the start
 * of every link; the form change cues no freeze and no title and leaves the HUD in; the FFX Overdrive opening plays and the FFX-2 Change plate never does; nothing is a held breath; and the beat's own pieces (a seam returns 0, the cheer's floor reads FFX's table).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
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

/** A staging port that keeps what `EndingView` keeps (the marks), so the test reads what the player would see: `hud` is the HUD's opacity a minute after the last cue. */
class RecordingPort implements StagingPort {
  readonly log: string[] = [];
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

/**
 * The three chapters: the id, how many links chain, the foe each last link names (rule 14: all FFX; the sources withhold the pose at Zanarkand only), and whether the shipped tactic uses an Overdrive in this fight (Omnis is a puzzle fight:
 * the tactic never fills the gauge there, so the FFX Overdrive opening is read in a browser, job J2).
 */
const CHAPTERS = [
  { id: 'braskas-final-aeon', links: 7, last: 'yu-yevon', overdrive: true, heads: ['braskas-final-aeon', 'possessed-valefor', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-bahamut', 'yu-yevon'] },
  { id: 'seymour-omnis', links: 1, last: 'seymour-omnis', overdrive: false, heads: ['seymour-omnis'] },
  { id: 'isaaru-via-purifico', links: 3, last: 'spathi', overdrive: true, heads: ['isaaru', 'isaaru', 'isaaru'] },
] as const;

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

/** A bare presenter context for the pure beats: the FFX party and one foe on the field. */
function ctxOf(port: StagingPort, foe: string, o: { moreLinks?: boolean; party?: string[] } = {}): EventCtx {
  const party = o.party ?? ['tidus', 'yuna', 'auron'];
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

describe('what each chapter declares (rule 14, from the sources)', () => {
  it.each(CHAPTERS)('$id: FFX, $links link(s), the "pose" victory kind (the party cheers: only Zanarkand withholds it)', async ({ id, links }) => {
    const chapter = getChapter(id)!;
    expect(chapter.game).toBe('ffx');
    expect(getChapterMeta(id)?.victoryPose ?? 'pose').toBe('pose');
    let n = 1;
    let g = chapter.enemyGroupRef;
    while (g.nextGroupId !== undefined) {
      g = (await findEnemyGroup(g.nextGroupId))!;
      n++;
    }
    expect(n).toBe(links);
    expect(g.enemies.map((e) => e.id)).toContain(CHAPTERS.find((c) => c.id === id)!.last);
  });
});

describe('the victory beat at a seam of a chain, and at the end', () => {
  it.each(CHAPTERS)('$id: a link that chains on cues nothing and holds nothing beyond today\'s beat; the last link cues the one title', ({ id, last }) => {
    setDemoChapter(id);
    const port = new RecordingPort();
    const seam = ctxOf(port, last, { moreLinks: true });
    expect(stageVictory(seam, 'pose', 900)).toBe(0);
    expect(stageVictory(seam, 'hold', 900)).toBe(0);
    expect(port.log).toEqual([]);
    expect(port.hud()).toBe(1);
    const end = ctxOf(port, last, { moreLinks: false });
    expect(stageVictory(end, 'pose', 900)).toBeGreaterThanOrEqual(900);
    expect(port.log[0]).toBe('ending:title');
    expect(port.hud()).toBe(0); // the one title takes the HUD out for the results
  });

  it("the cheer's floor reads FFX's table: Tidus (3,666.7 ms), Yuna (3,200) and Auron (4,000) have decoded clips, so the beat of Chapters III and XII holds for Auron's, and Chapter XIV's, Yuna alone, for hers; never FFX-2's 3,000 or 3,400 ms rows", () => {
    for (const { id, last } of CHAPTERS.filter((c) => c.id !== 'isaaru-via-purifico')) {
      setDemoChapter(id);
      expect(stageVictory(ctxOf(new RecordingPort(), last), 'pose', 900), id).toBe(4000);
    }
    setDemoChapter('isaaru-via-purifico');
    expect(stageVictory(ctxOf(new RecordingPort(), 'spathi', { party: ['yuna'] }), 'pose', 900)).toBe(3200);
  });

  it('the first link leaves the layer alone; every later link clears it (the same rule for all seven links of Chapter III)', () => {
    const port = new RecordingPort();
    const ctx = ctxOf(port, 'braskas-final-aeon', { moreLinks: false });
    stageLinkBegins(ctx);
    expect(port.clears).toBe(0);
    for (let link = 2; link <= 7; link++) {
      port.ending({ game: 'ffx', scale: 1, calm: false, tame: false, kind: 'title', boss: 'x' });
      stageLinkBegins(ctx);
      expect(port.clears, `link ${link}`).toBe(link - 1);
      expect(port.hud(), `link ${link}`).toBe(1);
    }
  });
});

async function playChain(id: string, seed: number) {
  setDemoChapter(id);
  const chapter = getChapter(id)!;
  const setup = setupForChapter(chapter, seed);
  await registerBattleContent();
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const port = new RecordingPort();
  const stage = new FakeStage(setup.party.members.map((m) => m.id), chapter.enemyGroupRef.enemies.map((e) => e.id));
  // what the player sees at the instant a figure's painting is swapped: the ending cues so far, and the HUD
  const atSwap: Array<{ id: string; art: string; ending: string[]; hud: number }> = [];
  const realSetArt = stage.setArt.bind(stage);
  stage.setArt = async (foe: string, art: string): Promise<void> => {
    atSwap.push({ id: foe, art, ending: port.log.filter((e) => e.startsWith('ending:')), hud: port.hud() });
    return realSetArt(foe, art);
  };
  const presenter = new BattlePresenter({ stage, audio: new FakeAudio(), sleep: () => Promise.resolve(), staging: port });
  presenter.setSpeed('normal');
  const cap = setCappedAutoPlay(presenter, intendedStrategy);
  const hudAtLinkStart: number[] = [];
  const headAtLinkStart: Array<string | undefined> = [];
  // each link's foes stand on the field the way the real stage stands them (a stub that stages nothing leaves every later link's killing blow with no figure to freeze on: the finding of `booth-b2-cross-lane`)
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
      headAtLinkStart.push(headlineEnemy(engine.state())?.id); // the enemy the F1 ribbon follows (`HudF1.sync`: the first visible foe that is not a part) and the card names
    },
  });
  return { result, port, atSwap, hudAtLinkStart, headAtLinkStart, cap };
}

describe('the real chains, one layer', () => {
  it.each(CHAPTERS)('$id: no ending cue before the last link, one clear per later link, the one title last, the HUD in at every link\'s start, the FFX Overdrive opening and no Change plate or held breath', async ({ id, links, overdrive, heads }) => {
    const { result, port, hudAtLinkStart, headAtLinkStart, cap } = await playChain(id, 1);
    expect(result.links, `decisions ${cap.decisions()}, capped ${cap.capped()}`).toBe(links);
    expect(result.outcome.kind).toBe('victory');
    const at = (s: string): number => port.log.indexOf(s);
    expect(port.log.filter((e) => e === 'ending:title')).toHaveLength(1);
    for (const [i, e] of port.log.entries()) if (e.startsWith('ending:')) expect(i, `${e} before the last link`).toBeGreaterThan(at(`link:${links}`)); // no freeze, title or pull-back at a seam: only the last link ends
    expect(port.log.filter((e) => e === 'ending:freeze')).toHaveLength(1); // the last blow of the last link freezes once
    expect(port.log.filter((e) => e === 'ending:pullback')).toEqual([]); // the `pose` kind: the party cheers, no silent pull-back
    expect(port.clears).toBe(links - 1);
    if (links > 1) expect(port.log.lastIndexOf('clear')).toBeGreaterThan(at(`link:${links}`));
    expect(port.log.lastIndexOf('clear')).toBeLessThan(at('ending:title'));
    expect(hudAtLinkStart).toEqual(new Array(links).fill(1));
    // who the boss ribbon names at each link's first menu: Braska's Final Aeon, then each possessed aeon, then Yu Yevon (the Pagodas stand behind, never first); Omnis (the four discs are parts, skipped); and in Chapter XIV Isaaru, who stands on the field
    // untargetable with no bar (slot 0, so first), the chapter's own title; his aeon is the one fought. The ribbon's bar is hidden there: all four are Scan-immune, so `hpKnown` never answers true.
    expect(headAtLinkStart).toEqual(heads);
    if (overdrive) expect(port.log.filter((e) => e === 'opening:overdrive').length).toBeGreaterThan(0);
    expect(port.log.filter((e) => e === 'opening:change')).toEqual([]);
    expect(port.log.filter((e) => e.startsWith('breath:'))).toEqual([]);
  }, 600_000);

  it("Chapter III's first link changes Braska's Final Aeon's painting inside the fight: the form change cues no freeze and no title and leaves the HUD in", async () => {
    const { atSwap, port } = await playChain('braskas-final-aeon', 1);
    const forms = atSwap.filter((s) => s.id === 'braskas-final-aeon');
    expect(forms.map((s) => s.art)).toEqual(['braskas-final-aeon-2']);
    for (const s of forms) {
      expect(s.ending, s.art).toEqual([]);
      expect(s.hud, s.art).toBe(1);
    }
    expect(port.log.indexOf('link:1')).toBeGreaterThanOrEqual(0);
  }, 600_000);
});
