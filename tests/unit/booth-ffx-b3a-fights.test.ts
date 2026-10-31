/**
 * THE THREE FIGHTS OF BATCH 3a UNDER THE PRO STAGING (release 71, branch `booth-ffx-b3a`; Chapter VII `seymour-anima-macalania`, Chapter X `seymour-natus`, Chapter IX `yojimbo-cavern`; FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter).
 * The real engine, the real presenter, the chapter's own party and formation and the shipped tactic, and a recording staging port that keeps the ending marks the way `EndingView` does (the shape of `booth-yunalesca-forms` for Chapter II).
 *
 * What is particular to these three, and pinned here:
 *  - Chapter VII has THREE acts in one link: the Guado Guardians are KO'd by the summon, Anima arrives and is dismissed, and Seymour comes back (`part-restored` / `part-destroyed`, `forms.ts#revealEnemy`): none of that is the last blow, and the one freeze falls on Seymour, who lies down as a body AFTER it;
 *  - Chapter X's Mortibody is KO'd and returns (`BattlePresenterReturns`) while Natus stands: nothing it does is the last blow either;
 *  - Chapter IX's Yojimbo has NO ko painting and leaves by being recalled (`dismissed`, with Daigoro) while Lady Ginnem and Daigoro stand untargetable on the field: the freeze is the victory's, not "the last foe by the field";
 *  - none of the three is a chain (one formation, one link), none changes form (no `form-change`), none is `victoryPose: 'hold'` (the cheer path: a quiet title, no pull-back).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BattleEngine, BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { headlineEnemy } from '../../src/battle/common/headlineEnemy.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import { POSE_REGISTRATION } from '../../src/engine/PoseRegistration.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { DEPARTURE_KINDS, departureKindOf, departurePoses } from '../../src/engine/BattlePresenterDepartures.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { stageFreeze } from '../../src/engine/BattlePresenterStaging.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import { FFXEngine } from '../../src/battle/ffx/engine.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { describeIf, itIf } from './booth-r70-withdrawn.ts';
import { setStagingMode } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import { takeDefeatNote } from '../../src/engine/pro/staging/DefeatNote.ts';
import { emptyEnd, endFrame, type EndMarks } from '../../src/engine/pro/staging/EndingPlan.ts';
import type { BreathCue, EndingCue, OpeningCue, StagingPort } from '../../src/engine/pro/staging/StagingPort.ts';
import { FakeAudio, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';

/** A staging port that keeps what `EndingView` keeps (the marks), and writes its cues into the stage's own call log so the test reads one timeline. */
class RecordingPort implements StagingPort {
  readonly log: string[] = [];
  calls: string[] | null = null;
  marks: EndMarks = emptyEnd();
  breath(cue: BreathCue): void {
    this.calls?.push(`breath:${cue.kind}`);
    this.log.push(`breath:${cue.kind}`);
  }
  opening(cue: OpeningCue): void {
    this.calls?.push(`opening:${cue.kind}`);
    this.log.push(`opening:${cue.kind}`);
  }
  ending(cue: EndingCue): void {
    this.calls?.push(`ending:${cue.kind}`);
    this.log.push(`ending:${cue.kind}`);
    if (cue.kind === 'freeze') this.marks.freezeAt = 0;
    else if (cue.kind === 'title') this.marks.titleAt = 0;
    else if (cue.kind === 'pullback') this.marks.pullAt = 0;
    else if (cue.kind === 'fall') this.marks.fallAt = 0;
  }
  clear(): void {
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

interface Case {
  id: string;
  /** The foe the killing blow falls on. */
  last: string;
  /** The foes that leave the field BEFORE the last blow (the Guardians; Yojimbo's companions leave WITH him, after the freeze). */
  before: string[];
  /** What the departure of `last` writes into the stage's call log (it comes after the freeze). */
  departs: RegExp;
  /** The foe the card and the ribbon name. */
  headline: string;
}
const CASES: Case[] = [
  { id: 'seymour-anima-macalania', last: 'seymour-macalania', before: ['guado-guardian-a', 'guado-guardian-b'], departs: /^lieDown:seymour-macalania$/, headline: 'seymour-macalania' },
  { id: 'seymour-natus', last: 'seymour-natus', before: [], departs: /^dissolve=1:seymour-natus$/, headline: 'seymour-natus' },
  { id: 'yojimbo-cavern', last: 'yojimbo', before: [], departs: /^fade=0:yojimbo$/, headline: 'yojimbo' },
];

interface Played {
  out: { kind: string };
  port: RecordingPort;
  stage: FakeStage;
  events: BattleEvent[];
  foes: string[];
  decisions: number;
}

async function play(id: string): Promise<Played> {
  setDemoChapter(id);
  const chapter = getChapter(id)!;
  const setup = setupForChapter(chapter, 1);
  await registerBattleContent();
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  // every event the engine emits, as the presenter gets it
  const events: BattleEvent[] = [];
  const realSubmit = engine.submit.bind(engine);
  engine.submit = (command) => {
    const out = realSubmit(command);
    events.push(...out);
    return out;
  };
  const realNext = engine.nextDecision.bind(engine);
  engine.nextDecision = () => {
    const d = realNext();
    if (d.kind === 'resolved') events.push(...d.events); // the enemy turns, the summon, the counters: the engine resolves them on its own
    return d;
  };
  const foes = chapter.enemyGroupRef.enemies.map((e) => e.id);
  const stage = new FakeStage(setup.party.members.map((m) => m.id), foes);
  const port = new RecordingPort();
  port.calls = stage.calls;
  const presenter = new BattlePresenter({ stage, audio: new FakeAudio(), sleep: () => Promise.resolve(), staging: port, victoryPose: getChapterMeta(id)?.victoryPose ?? 'pose' });
  presenter.setSpeed('normal');
  const cap = setCappedAutoPlay(presenter, intendedStrategy);
  const out = await presenter.run(engine as BattleEngine, {});
  return { out, port, stage, events, foes, decisions: cap.decisions() };
}

// Chapter IX left the treated list in the r70 verdicts: its case is skipped while it is off the list and runs again with the line (`describeIf`).
for (const c of CASES) describeIf(c.id)(`the real fight of ${c.id}`, () => {
  it('wins with the shipped tactic; the one freeze falls on the last blow after every other foe has gone, then the quiet title, and nothing else of the ending (the cheer kind has no pull-back)', async () => {
    const p = await play(c.id);
    expect(p.out.kind, `decisions ${p.decisions}`).toBe('victory');
    const calls = p.stage.calls;
    const ending = calls.filter((e) => e.startsWith('ending:'));
    expect(ending).toEqual(['ending:freeze', 'ending:title']);
    const at = (what: string | RegExp): number => calls.findIndex((e) => (typeof what === 'string' ? e === what : what.test(e)));
    const lastAt = (what: RegExp): number => calls.map((e, i) => (what.test(e) ? i : -1)).reduce((a, b) => Math.max(a, b), -1); // a departure is the LAST of its kind (an arrival fades a foe in at the start)
    expect(at('ending:freeze')).toBeGreaterThan(-1);
    expect(at('ending:title')).toBeGreaterThan(at('ending:freeze'));
    expect(p.port.log.at(-1)).toBe('ending:title');
    expect(p.port.hud()).toBe(0); // the title took the HUD out for the results
    // the freeze is the last blow's: it comes after the departure of every OTHER foe that left in this fight (a guardian, a returned Mortibody), and before the last foe leaves
    for (const f of c.before) {
      expect(lastAt(new RegExp(`^remove:${f}$`)), `${f} has gone`).toBeGreaterThan(-1);
      expect(at('ending:freeze'), `the freeze comes after ${f} has gone`).toBeGreaterThan(lastAt(new RegExp(`^remove:${f}$`)));
    }
    expect(lastAt(c.departs), 'the last foe leaves after the freeze').toBeGreaterThan(at('ending:freeze'));
    // no FFX-2 Change plate ever, no pull-back, no held breath (nothing of these three is a `BigMove`)
    expect(p.port.log.filter((e) => e === 'opening:change')).toEqual([]);
    expect(p.port.log.filter((e) => e === 'ending:pullback')).toEqual([]);
    expect(p.port.log.filter((e) => e.startsWith('breath:'))).toEqual([]);
    // one formation, no form change (the guard of `booth-yunalesca-forms` has nothing to catch here)
    expect(p.events.filter((e) => e.type === 'form-change')).toEqual([]);
  }, 120_000);

  it('plays a chapter that is not a chain and not the hold kind (one link, the cheer path: `victoryPose` is not `hold`)', () => {
    const chapter = getChapter(c.id)!;
    expect(chapter.game).toBe('ffx');
    expect((chapter.enemyGroupRef as { links?: unknown }).links).toBeUndefined();
    expect(getChapterMeta(c.id)?.victoryPose).not.toBe('hold'); // research/ffx-vs-ffx2-presentation.md 2.1: only Zanarkand withholds the pose in FFX
  });

  it('names its own boss on the card and the opening caption (`headlineEnemy` handed the declared boss of Chapter VII, else the first foe on the field that is not a part); the RIBBON is read through the real HudF1 in `booth-ffx-b3a-ribbon.test.ts`, because this call passes `bossId` itself', async () => {
    const chapter = getChapter(c.id)!;
    const setup = setupForChapter(chapter, 1);
    await registerBattleContent();
    const engine = new FFXEngine({ autoResolveMinigames: true });
    engine.setSeed(setup.seed);
    engine.init(setup);
    const boss = headlineEnemy(engine.state() as Readonly<BattleState>, chapter.enemyGroupRef.bossId);
    expect(boss?.id).toBe(c.headline);
  });

  it("a defeat names the foe's last move on the card and drops the dim and the caption in (the FFX defeat card of Chapter I)", async () => {
    setDemoChapter(c.id);
    const port = new RecordingPort();
    const stage = new FakeStage(['tidus', 'yuna', 'auron'], [c.last]);
    const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve(), staging: port, victoryPose: 'pose' });
    presenter.setSpeed('normal');
    const seq = (e: Record<string, unknown>, i: number): BattleEvent => ({ ...e, seq: i }) as unknown as BattleEvent;
    await presenter.play([
      seq({ type: 'action-start', actorId: c.last, command: { kind: 'ability' }, abilityId: 'x-last-move', abilityName: 'Last Move', targets: ['tidus'] }, 0),
      seq({ type: 'action-end', actorId: c.last }, 1),
      seq({ type: 'defeat', result: {} }, 2),
    ]);
    expect(takeDefeatNote()).toEqual({ cause: 'Last Move' });
    expect(port.log.at(-1)).toBe('ending:fall');
  });
});

describe('Chapter VII: three acts in one link, and the body', () => {
  it('the engine really runs the acts in the fight above (the summon puts Anima on the field, the Guardians leave the stage with it, Anima is KO\'d and dismissed, Seymour comes back and is the last KO), and none of it cues an ending beat before the last blow', async () => {
    const p = await play('seymour-anima-macalania');
    const kos = p.events.filter((e) => e.type === 'ko').map((e) => (e as { targetId: string }).targetId);
    expect(kos).toContain('anima-macalania'); // act two ends with her KO; the Guardians leave the stage silently when she is summoned (no `ko` event of theirs reaches the presenter, so no beat of the ending can fall on them)
    expect(p.stage.calls.some((e) => e === 'remove:guado-guardian-a') && p.stage.calls.some((e) => e === 'remove:guado-guardian-b')).toBe(true);
    expect(p.stage.calls.indexOf('remove:guado-guardian-b')).toBeLessThan(p.stage.calls.indexOf('ending:freeze'));
    expect(p.events.some((e) => e.type === 'part-destroyed' && (e as { partId?: string }).partId === 'anima-macalania')).toBe(true);
    expect(kos.at(-1)).toBe('seymour-macalania'); // the last KO of the fight is Seymour's
    expect(p.events.some((e) => e.type === 'part-restored' && (e as { partId?: string }).partId === 'anima-macalania')).toBe(true);
    expect(p.stage.calls.filter((e) => e.startsWith('ending:'))).toEqual(['ending:freeze', 'ending:title']);
  }, 120_000);

  it('Seymour leaves a body (`body`: lies down where he fell; D-046), the Guardians walk off (`yields`), Anima is dissolved by the default: the freeze is on his blow and the lying-down comes after it', () => {
    expect(departureKindOf('seymour-macalania')).toBe('body');
    expect(departureKindOf('guado-guardian-a')).toBe('yields');
    expect(departureKindOf('guado-guardian-b')).toBe('yields');
    expect(Object.keys(DEPARTURE_KINDS)).not.toContain('anima-macalania');
  });
});

describe('Chapter X: Natus stands while Mortibody dies and comes back', () => {
  it('Mortibody is a part of Natus and returns after its death; Natus is sent like a fiend (no row): nothing of Mortibody is the last blow, and the freeze is Natus\'s', () => {
    expect(departureKindOf('mortibody')).toBe('returns');
    expect(departureKindOf('seymour-natus')).toBe('dissolve');
    expect(getChapter('seymour-natus')!.enemyGroupRef.enemies.find((e) => e.id === 'mortibody')?.flags?.isPart).toBe(true);
  });
});

describe('Chapter IX: Yojimbo has no knock-out painting', () => {
  it('there is no ko row for Yojimbo in the pose registration, none for Lady Ginnem or Daigoro either, and Yojimbo is recalled (`dismissed`) with Daigoro; `departurePoses` leaves the map alone because it has no `ko` to point away', () => {
    expect(POSE_REGISTRATION['yojimbo-cavern']?.['idle']).toBeDefined();
    expect(POSE_REGISTRATION['yojimbo-cavern']?.['ko']).toBeUndefined();
    expect(POSE_REGISTRATION['ginnem']?.['ko']).toBeUndefined();
    expect(POSE_REGISTRATION['daigoro']?.['ko']).toBeUndefined();
    expect(departureKindOf('yojimbo')).toBe('dismissed');
    const poses = { idle: 'idle.png', hurt: 'hurt.png', attack: 'attack.png', cast: 'cast.png' };
    expect(departurePoses('yojimbo', poses)).toBe(poses);
  });

  it('the treated pieces that read a knock-out painting read only the PARTY\'s: the KO mark and wash (`ProFieldMarks`: "for every party member who is down") and the knock-out cut (`koCutWindow`, held with the moments); a foe that is recalled draws neither', () => {
    // the field's marks are the party's (their source says so); the moments are held for the chapter, so no knock-out cut plays here at all
    expect(treatedHold('yojimbo-cavern', 'moments')).toMatch(/Lifts when/);
    expect(treatedHold('yojimbo-cavern', 'cam')).toBeDefined();
  });
});

describe('the freeze guard on each formation (a synthetic burst: the bare presenter context of `booth-yunalesca-forms`)', () => {
  /** A bare presenter context for the pure beat `stageFreeze`: the party and the named foes on the field, the burst the test chooses, the event in hand at `at`. */
  function ctxOf(port: StagingPort, foes: string[], events: BattleEvent[], at: number): EventCtx {
    return {
      deps: { staging: port },
      speed: () => 'normal',
      moments: { reducedMotion: false, reducedFlashes: false },
      stage: { staged: () => ['tidus', 'yuna', 'kimahri', ...foes], sideOf: (id: string) => (foes.includes(id) ? 'enemy' : 'party') },
      menuOpen: () => false,
      burst: { events, at },
      sleep: () => Promise.resolve(),
    } as unknown as EventCtx;
  }
  const ko = (targetId: string, seq: number): BattleEvent => ({ type: 'ko', targetId, seq }) as unknown as BattleEvent;
  const victory = (seq: number): BattleEvent => ({ type: 'victory', result: {}, seq }) as unknown as BattleEvent;

  it('Chapter VII: a Guardian KO\'d by the summon, or Anima KO\'d, while Seymour stands is not the last blow; Seymour with the victory behind him is', async () => {
    setDemoChapter('seymour-anima-macalania');
    const foes = ['guado-guardian-a', 'guado-guardian-b', 'seymour-macalania', 'anima-macalania'];
    for (const id of ['guado-guardian-a', 'guado-guardian-b', 'anima-macalania']) {
      const port = new RecordingPort();
      expect(stageFreeze(ctxOf(port, foes, [ko(id, 0)], 0), id), id).toBeUndefined();
      expect(port.log, id).toEqual([]);
    }
    const last = new RecordingPort();
    const wait = stageFreeze(ctxOf(last, foes, [ko('seymour-macalania', 0), victory(1)], 0), 'seymour-macalania');
    expect(wait).toBeInstanceOf(Promise);
    await wait;
    expect(last.log).toEqual(['ending:freeze']);
  });

  it('Chapter X: Mortibody KO\'d while Natus stands is not the last blow (it returns); Natus with the victory behind him is, once, even if Mortibody falls after him in the same burst', async () => {
    setDemoChapter('seymour-natus');
    const foes = ['seymour-natus', 'mortibody'];
    const mid = new RecordingPort();
    expect(stageFreeze(ctxOf(mid, foes, [ko('mortibody', 0)], 0), 'mortibody')).toBeUndefined();
    expect(mid.log).toEqual([]);
    const last = new RecordingPort();
    const ctx = ctxOf(last, foes, [ko('seymour-natus', 0), victory(1), ko('mortibody', 2)], 0);
    const wait = stageFreeze(ctx, 'seymour-natus');
    expect(wait).toBeInstanceOf(Promise);
    await wait;
    expect(stageFreeze({ ...ctx, burst: { events: [ko('seymour-natus', 0), victory(1), ko('mortibody', 2)], at: 2 } } as EventCtx, 'mortibody')).toBeUndefined(); // the second KO of the burst never freezes again
    expect(last.log).toEqual(['ending:freeze']);
  });

  itIf('yojimbo-cavern')('Chapter IX: Yojimbo\'s KO is the last blow because the victory follows, not because the field is empty (Lady Ginnem and Daigoro stand untargetable beside him, so "the last foe by the field" is never true); a KO with no victory behind it freezes nothing', async () => {
    setDemoChapter('yojimbo-cavern');
    const foes = ['yojimbo', 'ginnem', 'daigoro'];
    const none = new RecordingPort();
    expect(stageFreeze(ctxOf(none, foes, [ko('yojimbo', 0)], 0), 'yojimbo')).toBeUndefined();
    expect(none.log).toEqual([]);
    const last = new RecordingPort();
    const wait = stageFreeze(ctxOf(last, foes, [ko('yojimbo', 0), victory(1)], 0), 'yojimbo');
    expect(wait).toBeInstanceOf(Promise);
    await wait;
    expect(last.log).toEqual(['ending:freeze']);
  });
});
