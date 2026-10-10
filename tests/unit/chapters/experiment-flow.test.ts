/**
 * The Experiment's chain in the real flow loop (`runEncounterChain`): Act I to Act II, and what the loop does between them. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The driver's call of 2026-10-10: the party is restored at the seam but there is no "SAVE SPHERE" card (there is no Save Sphere at Djose), so Act II sets
 * `restoresPartyOnEntry` (the engine's restore and the retry checkpoint) together with `noSaveSphereCard` (the flow re-stages plainly, as every other chained link does).
 * The real FFX-2 engine and the real `runEncounterChain`; the presenter is a script of outcomes, because what is under test is what the loop does between links.
 * Chapter XI is the control: its two Save Sphere links still show the card.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleSetup, BattleState } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain, type EncounterChainOptions } from '../../../src/app/screens/BattleEncounterChain.ts';
import { resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import type { BattleOutcome, BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import type { Chapter } from '../../../src/data/encounters.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { FFX2_EXPERIMENT } from '../../../src/data/chapter-ffx2-experiment.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX2_GROUPS_BY_ID } from '../../../src/data/ffx2/index.ts';
import {
  DJOSE_EXPERIMENT_1,
  DJOSE_EXPERIMENT_2,
  EXPERIMENT_ENEMY_ID,
  EXPERIMENT_PROTOTYPE_ID,
  experimentActOneGroup,
  experimentActTwoGroup,
} from '../../../src/data/ffx2/enemies/experiment.ts';

const GIRLS = ['yuna', 'rikku', 'paine'];

type Kind = 'victory' | 'defeat';

/** A presenter that answers each link with the next scripted outcome. */
function scriptedPresenter(kinds: Kind[]) {
  const rec = { synced: 0, fought: [] as string[][] };
  const presenter = {
    syncHud: () => {
      rec.synced++;
    },
    run: async (engine: BattleEngine): Promise<BattleOutcome> => {
      rec.fought.push(engine.state().enemyIds.slice());
      const kind = kinds.shift() ?? 'defeat';
      return { kind, result: {} } as unknown as BattleOutcome;
    },
  };
  return { presenter: presenter as unknown as BattlePresenter, rec };
}

async function ffx2Engine(setup: BattleSetup): Promise<FFX2Engine> {
  await registerBattleContent();
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** The chapter's opening setup with every girl at 1 HP and 0 MP, so a restore shows. */
function battered(chapter: Chapter, seed: number): BattleSetup {
  const setup = setupForChapter(chapter, seed);
  const party = setup.party as Extract<BattleSetup['party'], { game: 'ffx2' }>;
  const members = party.members.map((m) => ({ ...m, hp: 1, mp: 0 })) as typeof party.members;
  return { ...setup, party: { ...party, members } };
}

function hpMp(engine: BattleEngine): Array<[number, number, number, number]> {
  const s = engine.state() as BattleState;
  return GIRLS.map((id) => {
    const c = s.combatants[id] as unknown as { hp: number; mp: number; stats: { maxHp: number; maxMp: number } };
    return [c.hp, c.stats.maxHp, c.mp, c.stats.maxMp];
  });
}

interface Run {
  outcome: BattleOutcome;
  links: number;
  checkpoint: Awaited<ReturnType<typeof runEncounterChain>>['checkpoint'];
  cards: Array<{ link: number; group: string }>;
  staged: string[][];
  music: string[];
  fought: string[][];
  synced: number;
  engine: FFX2Engine;
}

async function chain(chapter: Chapter, kinds: Kind[], extra: Partial<EncounterChainOptions> = {}, setup = battered(chapter, 7)): Promise<Run> {
  const engine = await ffx2Engine(setup);
  const { presenter, rec } = scriptedPresenter(kinds);
  const cards: Run['cards'] = [];
  const staged: string[][] = [];
  const music: string[] = [];
  const result = await runEncounterChain({
    chapter,
    presenter,
    engine,
    stage: { stage: async (s) => void staged.push(s.enemyIds.slice()) },
    group: chapter.enemyGroupRef,
    setup,
    seed: 7,
    findGroup: findEnemyGroup,
    audio: { playMusic: (name: string) => void music.push(name) },
    saveSphere: async (swap, info) => {
      cards.push({ link: info.link, group: info.group.id });
      await swap();
    },
    ...extra,
  });
  return { ...result, cards, staged, music, fought: rec.fought, synced: rec.synced, engine };
}

describe('the seam between the acts: restored, checkpointed, and no Save Sphere card', () => {
  it('Act I won: Act II is staged plainly, the card callback is never called, and the girls stand at full HP and MP', async () => {
    const run = await chain(FFX2_EXPERIMENT, ['victory', 'victory']);
    expect(run.outcome.kind).toBe('victory');
    expect(run.links).toBe(2);
    expect(run.cards).toEqual([]);
    // The two formations were fought, in order, and the second was staged once, by the plain re-stage.
    expect(run.fought).toEqual([[EXPERIMENT_PROTOTYPE_ID], [EXPERIMENT_ENEMY_ID]]);
    expect(run.staged).toEqual([[EXPERIMENT_ENEMY_ID]]);
    // The engine's own restore ran on entry (it reads `restoresPartyOnEntry`, not the card): every girl was at 1 HP and 0 MP going in.
    for (const [hp, maxHp, mp, maxMp] of hpMp(run.engine)) expect([hp, mp]).toEqual([maxHp, maxMp]);
    // The HUD is synced once at each link head, and once more after the re-stage (the plain path syncs at the head of the next link only).
    expect(run.synced).toBeGreaterThanOrEqual(2);
  });

  it('the music follows the formations: the boss theme, then the Vegnagun theme at Act II (the cues the data declares)', async () => {
    const run = await chain(FFX2_EXPERIMENT, ['victory', 'victory']);
    expect(run.music).toEqual(['boss-ffx2-aeon', 'boss-vegnagun']);
  });

  it('Act II is still the retry checkpoint: win Act I, lose Act II, and the checkpoint is Act II, link 2, entered on the carried setup', async () => {
    const run = await chain(FFX2_EXPERIMENT, ['victory', 'defeat']);
    expect(run.outcome.kind).toBe('defeat');
    expect(run.links).toBe(2);
    expect(run.cards).toEqual([]);
    expect(run.checkpoint?.group.id).toBe(DJOSE_EXPERIMENT_2);
    expect(run.checkpoint?.link).toBe(2);
    expect(run.checkpoint?.setup.enemies.id).toBe(DJOSE_EXPERIMENT_2);
    expect(run.checkpoint?.setup.condition).toBe('scripted');
  });

  it('a loss in Act I leaves no checkpoint: the retry starts the chapter over', async () => {
    const run = await chain(FFX2_EXPERIMENT, ['defeat']);
    expect(run.outcome.kind).toBe('defeat');
    expect(run.links).toBe(1);
    expect(run.checkpoint).toBeNull();
    expect(run.cards).toEqual([]);
  });

  it('a retry from the checkpoint opens Act II (link 2) at full HP and MP, with no card needed to do it', async () => {
    const first = await chain(FFX2_EXPERIMENT, ['victory', 'defeat']);
    const setup = resumeSetup(first.checkpoint!, 1007);
    expect(setup.seed).toBe(1008);
    const engine = await ffx2Engine(setup);
    expect(engine.state().enemyIds).toEqual([EXPERIMENT_ENEMY_ID]);
    for (const [hp, maxHp, mp, maxMp] of hpMp(engine)) expect([hp, mp]).toEqual([maxHp, maxMp]);
    // The flow resumes AT the checkpoint's link: a win there ends the chapter, and the card is not called for it either.
    const resumed = await chain(FFX2_EXPERIMENT, ['victory'], { group: first.checkpoint!.group, startLink: first.checkpoint!.link, setup, priorWon: [] }, setup);
    expect(resumed.outcome.kind).toBe('victory');
    expect(resumed.links).toBe(2);
    expect(resumed.cards).toEqual([]);
  });
});

describe('the data behind it', () => {
  it('Act II carries both flags (the restore and the quiet entry); Act I carries neither', () => {
    expect(experimentActOneGroup.id).toBe(DJOSE_EXPERIMENT_1);
    expect(experimentActOneGroup.restoresPartyOnEntry).toBeUndefined();
    expect(experimentActOneGroup.noSaveSphereCard).toBeUndefined();
    expect(experimentActTwoGroup.id).toBe(DJOSE_EXPERIMENT_2);
    expect(experimentActTwoGroup.restoresPartyOnEntry).toBe(true);
    expect(experimentActTwoGroup.noSaveSphereCard).toBe(true);
  });

  it('the flag is the Experiment\'s alone: no other registered formation, in either game, sets it', () => {
    const flagged = [...Object.values(FFX_GROUPS_BY_ID), ...Object.values(FFX2_GROUPS_BY_ID)].filter((g) => g.noSaveSphereCard === true).map((g) => g.id);
    expect(flagged).toEqual([DJOSE_EXPERIMENT_2]);
  });

  it('and it only ever rides with the restore: a formation that skips the card is a formation that restores', () => {
    for (const g of [...Object.values(FFX_GROUPS_BY_ID), ...Object.values(FFX2_GROUPS_BY_ID)]) {
      if (g.noSaveSphereCard === true) expect(g.restoresPartyOnEntry, g.id).toBe(true);
    }
  });
});

describe('the control: Chapter XI still shows its Save Sphere card at each of its two links', () => {
  const XI = getChapter('ffx2-fallen-aeons')!;

  it('win Shiva and the Sisters, lose to Anima: the card is called for the Sisters (link 2) and Anima (link 3), as before', async () => {
    const run = await chain(XI, ['victory', 'victory', 'defeat']);
    expect(run.cards.map((c) => c.link)).toEqual([2, 3]);
    expect(run.checkpoint?.link).toBe(3);
  });
});
