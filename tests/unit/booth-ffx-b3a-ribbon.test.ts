// @vitest-environment jsdom
/**
 * THE F1 BOSS RIBBON NAMES THE DECLARED BOSS (release 71, branch `booth-ffx-b3a`; review MAJOR 1 of 2026-10-30; shared plumbing, both games, presentation only).
 *
 * Chapter VII stages Guado Guardian A in slot 0 and declares Seymour (`EnemyGroupDef.bossId`, PR-0243). The card, the opening caption and the preload passed the declared boss to `headlineEnemy`; the F1 ribbon
 * (`HudF1.sync`) did not, and printed "Guado Guardian A" (a blind bar, 2,000 HP) from the first menu until the summon removed the Guardians. The builder's test of the card passed `bossId` itself, so the ribbon was never
 * read. The fix: `BattlePresenter.run` names the running link's declared boss (`engine/HeadlineBoss.ts`) and `HudF1.sync` asks for it. Pinned here:
 *
 *  1. THE REAL HUD LAYER (`HudF1`, not a stand-in for its rule) behind the REAL presenter on a REAL fight of Chapter VII: at every sync from the first menu to the victory the ribbon, when it is drawn, names Seymour;
 *  2. the ribbon and the card name the same foe at the first menu of EVERY treated chapter, of both games, and a chapter that declares no boss is unchanged from the first-foe rule (so Chapters I, II, IX, X and the FFX-2 chapters did not
 *     move, and a later batch cannot move one without declaring a boss);
 *  3. a link that declares none clears the last link's, so a chain's later link or the next battle never inherits it; a declared boss that is not on the field names nothing (the first-foe rule answers).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BattleEngine, BattleState, Command, MinigameResult } from '../../src/battle/common/types.ts';
import { headlineEnemy } from '../../src/battle/common/headlineEnemy.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { headlineBoss, setHeadlineBoss } from '../../src/engine/HeadlineBoss.ts';
import { TREATED_CHAPTERS, setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { FFXEngine } from '../../src/battle/ffx/engine.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import type { EnemyGroupDef } from '../../src/battle/common/types.ts';
import { HudF1, type HudF1Host } from '../../src/ui/hudf1/HudF1.ts';
import { setHudF1Mode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { FakeAudio, FakeStage } from './helpers/FakeStage.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';

const VII = 'seymour-anima-macalania';

beforeEach(() => {
  document.body.innerHTML = '';
  setHudF1Mode('f1');
  setTreatedScope('all');
  setHeadlineBoss(undefined);
});
afterEach(() => {
  setHudF1Mode(null);
  setTreatedScope(null);
  setDemoChapter(undefined);
  setHeadlineBoss(undefined);
  document.body.innerHTML = '';
});

/** The real F1 layer in a real DOM, mounted the way the HUD mounts it (Sensor-blind rule left out: the NAME is under test), behind the one door the presenter speaks to a HUD through. */
class RibbonHud implements HudPort {
  readonly seen: Array<{ shown: boolean; name: string; declared: string | undefined }> = [];
  private readonly stage = document.createElement('div');
  private readonly f1: HudF1;
  constructor(game: 'ffx' | 'ffx2' = 'ffx') {
    const root = document.createElement('div');
    root.append(this.stage);
    document.body.append(root);
    this.f1 = new HudF1(game);
    const host: HudF1Host = { game, root, stage: this.stage, cmdStack: () => null, cmdBlock: () => null, helpText: () => '', heroRow: () => null };
    this.f1.mount(host);
  }
  /** What the ribbon prints now: its name, and whether it is drawn at all. */
  read(): { shown: boolean; name: string } {
    const ribbon = this.stage.querySelector<HTMLElement>('.f1-ribbon')!;
    return { shown: !ribbon.hasAttribute('hidden'), name: ribbon.querySelector('.f1-ribbon__name')!.textContent ?? '' };
  }
  sync(state: BattleState): void {
    this.f1.sync(state);
    this.seen.push({ ...this.read(), declared: headlineBoss() });
  }
  feed(state: BattleState): { shown: boolean; name: string } {
    this.f1.sync(state);
    return this.read();
  }
  mount(): void {}
  unmount(): void {
    this.f1.unmount();
  }
  onEvent(): void {}
  async chooseCommand(): Promise<Command> {
    throw new Error('RibbonHud: the run is auto-played; no menu should open');
  }
  async openMinigame(): Promise<MinigameResult> {
    throw new Error('RibbonHud: minigames are auto-resolved in this run');
  }
  setVisible(): void {}
  setProjector(): void {}
}

async function engineFor(id: string): Promise<{ engine: BattleEngine; setup: ReturnType<typeof setupForChapter> }> {
  const chapter = getChapter(id)!;
  const setup = setupForChapter(chapter, 1);
  await registerBattleContent();
  const engine: BattleEngine = chapter.game === 'ffx2' ? new FFX2Engine({ ...ffx2EngineOptions(), minigames: false }) : new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return { engine, setup };
}

describe('Chapter VII: the ribbon names Seymour, the declared boss, through a real fight (the review MAJOR: it named Guado Guardian A)', () => {
  it('the real HudF1 behind the real presenter prints Seymour whenever it is drawn, from the first sync to the victory, and never a Guardian', async () => {
    setDemoChapter(VII);
    const chapter = getChapter(VII)!;
    expect(chapter.enemyGroupRef.bossId).toBe('seymour-macalania'); // the premise: the formation declares him, and slot 0 is a Guardian
    expect(chapter.enemyGroupRef.enemies[0]!.id).toBe('guado-guardian-a');
    const { engine, setup } = await engineFor(VII);
    const stage = new FakeStage(setup.party.members.map((m) => m.id), chapter.enemyGroupRef.enemies.map((e) => e.id));
    const hud = new RibbonHud();
    const presenter = new BattlePresenter({ stage, audio: new FakeAudio(), sleep: () => Promise.resolve(), hud, victoryPose: getChapterMeta(VII)?.victoryPose ?? 'pose' });
    presenter.setSpeed('normal');
    const cap = setCappedAutoPlay(presenter, intendedStrategy);
    const out = await presenter.run(engine, { bossId: chapter.enemyGroupRef.bossId }); // what `BattleEncounterChain` passes for the link
    expect(cap.capped()).toBe(false);
    expect(out.kind).toBe('victory');
    const drawn = hud.seen.filter((s) => s.shown);
    expect(drawn.length).toBeGreaterThan(10); // many syncs: every burst of the three acts
    expect(hud.seen[0]).toMatchObject({ shown: true, name: 'Seymour' }); // the first sync: the first menu
    expect([...new Set(drawn.map((s) => s.name))]).toEqual(['Seymour']);
  }, 120_000);

  it('the first state of the engine, fed to the ribbon, prints the name the battle-start card prints (`headlineEnemy` with the declared boss)', async () => {
    setDemoChapter(VII);
    const { engine } = await engineFor(VII);
    const state = engine.state() as BattleState;
    const hud = new RibbonHud();
    setHeadlineBoss(undefined);
    expect(hud.feed(state).name).toBe('Guado Guardian A'); // the bare ribbon: the first foe in the formation (the defect, kept as the control)
    setHeadlineBoss('seymour-macalania');
    expect(hud.feed(state).name).toBe(headlineEnemy(state, 'seymour-macalania')!.name);
    expect(hud.read().name).toBe('Seymour');
  });
});

describe('every treated chapter, both games: the ribbon names what the card names, and a chapter that declares no boss did not move', () => {
  const IDS = Object.keys(TREATED_CHAPTERS);

  it.each(IDS)('%s', async (id) => {
    setDemoChapter(id);
    const chapter = getChapter(id)!;
    expect(chapter.game).toBe(TREATED_CHAPTERS[id]!.game);
    const { engine } = await engineFor(id);
    const state = engine.state() as BattleState;
    const declared = chapter.enemyGroupRef.bossId;
    const hud = new RibbonHud(chapter.game === 'ffx2' ? 'ffx2' : 'ffx');
    setHeadlineBoss(declared); // what the presenter does as the link begins
    const ribbon = hud.feed(state);
    const card = headlineEnemy(state, declared);
    const firstFoe = headlineEnemy(state);
    expect(ribbon.shown).toBe(true);
    expect(ribbon.name).toBe(card!.name);
    if (declared === undefined) expect(ribbon.name).toBe(firstFoe!.name); // unchanged from the rule it shipped with
    else expect(declared).toBe(card!.id);
    // the change is exactly the declared-boss chapters', and Chapter VII is one of them
    if (ribbon.name !== firstFoe!.name) expect(declared).toBeDefined();
    if (id === VII) expect(ribbon.name).not.toBe(firstFoe!.name);
  }, 60_000);
});

describe('the declared boss is the running link\'s, nobody else\'s', () => {
  it('the presenter names the link\'s declared boss as the link begins, and a link that declares none clears it', async () => {
    const { engine: vii } = await engineFor(VII);
    const { engine: x } = await engineFor('seymour-natus');
    const stage = new FakeStage(['tidus', 'yuna', 'auron'], []);
    const presenter = new BattlePresenter({ stage, audio: new FakeAudio(), sleep: () => Promise.resolve() });
    presenter.setSpeed('normal');
    setCappedAutoPlay(presenter, intendedStrategy, 0); // abort at the first menu: only the start of each link is under test
    expect(headlineBoss()).toBeUndefined();
    await presenter.run(vii, { bossId: 'seymour-macalania' });
    expect(headlineBoss()).toBe('seymour-macalania');
    await presenter.run(x, {}); // a later link, or the next battle, that declares none
    expect(headlineBoss()).toBeUndefined();
  }, 60_000);

  it('a declared boss that is not on the field (removed, hidden, a part, or another battle\'s) names nothing: the first foe on the field is the ribbon', () => {
    const foe = (id: string, name: string, over: Record<string, unknown> = {}): unknown => ({ id, name, side: 'enemy', hp: 100, stats: { maxHp: 100 }, removed: false, flags: {}, ...over });
    const state = (extra: Record<string, unknown>): BattleState =>
      ({ enemyIds: ['a', 'b'], combatants: { a: foe('a', 'First Foe'), b: foe('b', 'Declared Boss', extra) } }) as unknown as BattleState;
    setDemoChapter('seymour-flux'); // the layer draws only for a chapter the gate names
    const hud = new RibbonHud();
    setHeadlineBoss('b');
    expect(hud.feed(state({})).name).toBe('Declared Boss'); // on the field: the declared boss wins over slot 0
    expect(hud.feed(state({ removed: true })).name).toBe('First Foe');
    expect(hud.feed(state({ flags: { hidden: true } })).name).toBe('First Foe');
    expect(hud.feed(state({ flags: { isPart: true } })).name).toBe('First Foe');
    setHeadlineBoss('some-other-battles-boss');
    expect(hud.feed(state({})).name).toBe('First Foe');
  });
});

describe('through the chain runner, the way the screen plays a chapter: the link\'s first HUD sync comes BEFORE `presenter.run`', () => {
  async function playChain(id: string, hud: RibbonHud, cover?: { sphereSync: number[] }): Promise<{ links: number; kind: string; firstSync: number[] }> {
    setDemoChapter(id);
    const chapter = getChapter(id)!;
    const { engine, setup } = await engineFor(id);
    const stage = new FakeStage(setup.party.members.map((m) => m.id), chapter.enemyGroupRef.enemies.map((e) => e.id));
    const presenter = new BattlePresenter({ stage, audio: new FakeAudio(), sleep: () => Promise.resolve(), hud, victoryPose: getChapterMeta(id)?.victoryPose ?? 'pose' });
    presenter.setSpeed('normal');
    setCappedAutoPlay(presenter, intendedStrategy);
    const firstSync: number[] = [];
    const result = await runEncounterChain({
      chapter, presenter, engine, stage: { stage: () => Promise.resolve() }, group: chapter.enemyGroupRef, setup, seed: 1, audio: new FakeAudio(),
      // with `cover`, the second formation of the chain is the Save Sphere kind (the Mirror aeons' acts and the Fallen aeons' later links are): its cover re-stages and syncs the HUD for the new link BEFORE the loop names it
      findGroup: cover ? async (gid) => { const g = await findEnemyGroup(gid); return g && g.bossId ? ({ ...g, restoresPartyOnEntry: true } as EnemyGroupDef) : g; } : findEnemyGroup,
      ...(cover ? { saveSphere: async (swap: () => Promise<void>) => { cover.sphereSync.push(hud.seen.length); await swap(); } } : {}),
      onLink: () => firstSync.push(hud.seen.length), // the index of the first HUD sync of this link
    });
    return { links: result.links, kind: result.outcome.kind, firstSync };
  }

  it('Chapter VII: the very first sync of the chapter already names Seymour (a ribbon synced before the link was named would flash the Guardian under the opening)', async () => {
    const hud = new RibbonHud();
    const out = await playChain(VII, hud);
    expect(out.kind).toBe('victory');
    expect(out.links).toBe(1);
    expect(hud.seen[out.firstSync[0]!]).toEqual({ shown: true, name: 'Seymour', declared: 'seymour-macalania' });
    expect([...new Set(hud.seen.filter((s) => s.shown).map((s) => s.name))]).toEqual(['Seymour']);
  }, 120_000);

  it('a chain of two formations that declare different bosses (Sinspawn Gui, a hidden chapter, forced to the F1 HUD): each link\'s first sync already holds THAT link\'s declared boss', async () => {
    const hud = new RibbonHud();
    const out = await playChain('sinspawn-gui', hud);
    const chapter = getChapter('sinspawn-gui')!;
    const second = await findEnemyGroup(chapter.enemyGroupRef.nextGroupId!);
    expect(chapter.enemyGroupRef.bossId).toBeDefined();
    expect(second?.bossId).toBeDefined();
    expect(second!.bossId).not.toBe(chapter.enemyGroupRef.bossId);
    expect(hud.seen[out.firstSync[0]!]!.declared).toBe(chapter.enemyGroupRef.bossId);
    if (out.links >= 2) expect(hud.seen[out.firstSync[1]!]!.declared).toBe(second!.bossId); // reached only when the shipped tactic wins fight 1
  }, 180_000);

  it('a link entered under the Save Sphere cover (the acts of the Mirror aeons, the later links of the Fallen aeons): the cover syncs the HUD for the new link BEFORE the loop names its boss, so the store is named first (the second fight of Sinspawn Gui, given the cover)', async () => {
    const hud = new RibbonHud();
    const cover = { sphereSync: [] as number[] };
    const second = (await findEnemyGroup(getChapter('sinspawn-gui')!.enemyGroupRef.nextGroupId!))!;
    const out = await playChain('sinspawn-gui', hud, cover);
    expect(out.links).toBeGreaterThanOrEqual(2);
    expect(cover.sphereSync).toHaveLength(1);
    expect(hud.seen[cover.sphereSync[0]!]!.declared).toBe(second.bossId); // the sync inside the cover: the first of that link
  }, 180_000);
});
