/**
 * Chapter X (Seymour Natus): the pause card, the guide, the tactic, the music and the
 * departures. The tactic and the departures are run on the real engine (AGENTS.md rule 3); the
 * departures through the real `BattlePresenter` on a `FakeStage`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14], except the Chapter I pin at the end, which only
 * proves Chapter I did not move.
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, BattleEvent, Command, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import type { Chapter } from '../../../src/data/encounters.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../../src/data/ffx/index.ts';
import { CHAPTERS, SEYMOUR_FLUX, getChapter } from '../../../src/data/encounters.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { NATUS_META } from '../../../src/data/chapter-meta-natus.ts';
import { SEYMOUR_NATUS } from '../../../src/data/chapter-seymour-natus.ts';
import { SEYMOUR_NATUS_GUIDE } from '../../../src/data/guides/seymour-natus.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { guideForState } from '../../../src/engine/tactics/guide.ts';
import { seymourNatus, tacticFor, SEYMOUR_NATUS_BOSS_IDS } from '../../../src/engine/tactics/index.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { departureKindOf, departurePoses } from '../../../src/engine/BattlePresenterDepartures.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { seymourNatusScripts } from '../../../src/story/scripts/seymour-natus.ts';
import { FakeStage, noSleep } from '../helpers/FakeStage.ts';

const words = (t: string): number => t.trim().split(/\s+/).filter(Boolean).length;
const art = (p: string): boolean => existsSync(new URL(`../../../public/art/${p}`, import.meta.url));
const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function newEngine(ch: Chapter, seed: number): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: ch.buildRef as FFXPartyBuild, enemies: ch.enemyGroupRef, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

describe('the pause card', () => {
  it('is registered and unlisted, as its chapter is, with the installed hero plate B', () => {
    expect(UNLISTED_CHAPTER_META).toContain(NATUS_META);
    expect(CHAPTER_META).not.toContain(NATUS_META);
    expect(CHAPTERS.some((c) => c.id === 'seymour-natus')).toBe(false);
    expect(getChapterMeta('seymour-natus')).toBe(NATUS_META);
    expect(NATUS_META).toMatchObject({ numeral: 'X', gameLabel: 'FFX', title: 'Seymour Natus', heroArt: 'pause/ch10-seymour-natus' });
    expect(NATUS_META.location).toBe(SEYMOUR_NATUS.location);
    const manifest = JSON.parse(readFileSync(new URL('../../../public/art/manifest.json', import.meta.url), 'utf8')) as { pause: string[] };
    expect(manifest.pause).toContain('ch10-seymour-natus');
    expect(art('pause/ch10-seymour-natus.png')).toBe(true);
  });

  it("the house shape (the chapter-meta suite's rules, which run only on listed chapters)", () => {
    const m = NATUS_META;
    expect(words(m.quote.text)).toBeLessThan(18);
    expect(words(m.handwritten)).toBeGreaterThanOrEqual(4);
    expect(words(m.handwritten)).toBeLessThanOrEqual(6);
    expect(words(m.subtitle)).toBeGreaterThanOrEqual(2);
    expect(words(m.subtitle)).toBeLessThanOrEqual(4);
    expect(m.blurb.match(/[.!?](?:\s|$)/g)).toHaveLength(2);
    expect(art(m.heroArtFallback)).toBe(true);
    for (const s of m.snapshots) {
      expect(art(s.image), s.image).toBe(true);
      expect(words(s.caption)).toBeGreaterThanOrEqual(2);
      expect(words(s.caption)).toBeLessThanOrEqual(5);
    }
    expect(new Set(m.objectives.map((o) => o.id)).size).toBe(3);
    expect(m.objectives.map((o) => o.rule)).toContainEqual({ kind: 'survived-ability', ability: 'natus-flare' });
  });

  it('the quote is a line the story plays, and the music keys are the cues the chapter plays', () => {
    const script = readFileSync(new URL('../../../src/story/scripts/seymour-natus.ts', import.meta.url), 'utf8');
    expect(script).toContain(NATUS_META.quote.text);
    const fromScripts = [...seymourNatusScripts.pre, ...seymourNatusScripts.post]
      .flatMap((s) => (s.type === 'music' && s.track ? [s.track] : []));
    const keys = new Set([SEYMOUR_NATUS.music.scene, SEYMOUR_NATUS.music.battle, ...fromScripts, 'victory-ffx']);
    expect([...NATUS_META.musicKeys].sort()).toEqual([...keys].filter(Boolean).sort());
  });
});

describe('music: B15, the named stand-in until a Natus cue is picked by ear', () => {
  it("the record's battle cue is Chapter VII's, FFX only, and the story starts it before the battle", () => {
    expect(SEYMOUR_NATUS.music.battle).toBe('boss-seymour-macalania');
    expect(SEYMOUR_NATUS.music.scene).toBe('scene-gagazet');
    const pre = seymourNatusScripts.pre;
    const cue = pre.findIndex((s) => s.type === 'music' && s.track === 'boss-seymour-macalania');
    expect(cue).toBeGreaterThan(0);
    expect(cue).toBeLessThan(pre.findIndex((s) => s.type === 'battleStart'));
  });
});

describe('the guide', () => {
  it('3 to 5 rules, each with a one-line short and a citation', () => {
    const g = SEYMOUR_NATUS_GUIDE;
    expect(g.rules.length).toBeGreaterThanOrEqual(3);
    expect(g.rules.length).toBeLessThanOrEqual(5);
    const cite = /^ffx-seymour-natus-highbridge §/;
    for (const r of g.rules) {
      expect(r.short.length).toBeLessThanOrEqual(RULE_SHORT_MAX);
      expect(r.cite).toMatch(cite);
    }
    for (const h of g.hints) expect(h.cite).toMatch(cite);
    for (const p of g.phases) expect(p.cite).toMatch(cite);
    expect(g.bossIds).toEqual([...SEYMOUR_NATUS_BOSS_IDS]);
  });

  it("is found from either boss on an FFX board, never on FFX-2, and the party's Bahamut does not steal it (N-G6)", () => {
    const c = (id: string, side: string) => ({ id, side, alive: true, hp: 1, statuses: {}, stats: { maxHp: 1 } });
    for (const id of ['seymour-natus', 'mortibody']) {
      const state = { game: 'ffx', combatants: { [id]: c(id, 'enemy'), bahamut: c('bahamut', 'party') }, log: [] };
      expect(guideForState(state as never)?.id).toBe('seymour-natus');
      expect(guideForState({ ...state, game: 'ffx2' } as never)?.id).not.toBe('seymour-natus');
    }
  });
});

describe('the tactic, on the real engine and the chapter record', () => {
  type Pick = { actor: string; kind: string; id?: string; targets: readonly string[] };

  function picks(seed: number, n: number): Pick[] {
    const engine = newEngine(SEYMOUR_NATUS, seed);
    const out: Pick[] = [];
    for (let i = 0; i < 4000 && out.length < n; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      expect(tacticFor(engine)).toBe(seymourNatus);
      const pick = seymourNatus(d.actorId, d.commands as AvailableCommand[], engine);
      expect(pick, d.actorId).not.toBeNull();
      out.push({ actor: d.actorId, kind: pick!.kind, id: (pick as { id?: string }).id, targets: pick!.targets });
      engine.submit(pick as Command);
    }
    return out;
  }

  it("Yuna's first turn sends Bahamut (B3 = b, strategy 3), and Bahamut's one turn is his Overdrive", () => {
    const p = picks(1, 12);
    expect(p.find((x) => x.actor === 'yuna')).toMatchObject({ kind: 'summon', id: 'bahamut' });
    expect(p.find((x) => x.actor === 'bahamut')?.kind).toBe('overdrive');
  });

  it('Talk is taken, Kimahri makes way for Auron, and no seed of the first twenty ever casts Haste (strategy 7)', () => {
    const all = Array.from({ length: 20 }, (_, i) => picks(i + 1, 40)).flat();
    expect(all.some((x) => x.kind === 'trigger' && x.id === 'talk')).toBe(true);
    expect(all.some((x) => x.actor === 'kimahri' && x.kind === 'switch')).toBe(true);
    expect(all.some((x) => x.id === 'haste')).toBe(false);
    expect(all.filter((x) => x.kind === 'attack').every((x) => x.targets[0] === 'seymour-natus')).toBe(true);
  });

  it('the presenter reaches it through intendedStrategy (the auto-battle and the advisor)', () => {
    const engine = newEngine(SEYMOUR_NATUS, 3);
    let d = engine.nextDecision();
    while (d.kind !== 'player-input' && d.kind !== 'battle-over') d = engine.nextDecision();
    expect(d.kind).toBe('player-input');
    if (d.kind !== 'player-input') return;
    expect(intendedStrategy(d.actorId, d.commands, engine)).toEqual(seymourNatus(d.actorId, d.commands, engine));
  });
});

/** The engine's events up to just past the first Mortibsorption, with the swings aimed at the mount. */
function eventsToFirstDrain(ch: Chapter, mount: string): BattleEvent[] {
  for (let seed = 1; seed <= 40; seed++) {
    const engine = newEngine(ch, seed);
    for (let i = 0; i < 8000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const cmd = intendedStrategy(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] };
      const aim = d.commands.some((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(mount));
      engine.submit(cmd.kind === 'attack' && aim ? { kind: 'attack', targets: [mount] } : cmd);
    }
    const log = engine.state().log;
    const heal = log.findIndex((e) => e.type === 'heal' && e.targetId === mount && e.cause === 'mortibsorption');
    if (heal >= 0) return log.slice(0, heal + 1);
  }
  throw new Error(`no Mortibsorption in 40 seeds for ${ch.id}`);
}

async function mountAfterFirstDrain(ch: Chapter, host: string, mount: string): Promise<{ onStage: boolean; alpha?: number; calls: string[] }> {
  const events = eventsToFirstDrain(ch, mount);
  expect(events.at(-1)).toMatchObject({ type: 'heal', targetId: mount });
  const stage = new FakeStage(['tidus', 'yuna', 'kimahri', 'auron', 'wakka', 'lulu', 'rikku'], [host, mount]);
  await new BattlePresenter({ stage, sleep: noSleep }).play(events);
  const actor = stage.actor(mount) as unknown as { alpha: number } | undefined;
  return { onStage: actor !== undefined, alpha: actor?.alpha, calls: stage.calls.filter((c) => c.endsWith(`:${mount}`)) };
}

describe('the departures (research §4.4 and §4.5; the O-2 A strip; docs/plans/natus-ship-review.md)', () => {
  it('Natus is sent as a fiend is; Mortibody returns, and has no painted KO to fetch', () => {
    expect(departureKindOf('seymour-natus')).toBe('dissolve');
    expect(departureKindOf('mortibody')).toBe('returns');
    expect(departurePoses('mortibody', { idle: 'i.png', ko: 'k.png' }).ko).toBe('i.png');
  });

  it('after its first Mortibsorption, Mortibody is back on the stage at full alpha, never removed', async () => {
    const r = await mountAfterFirstDrain(SEYMOUR_NATUS, 'seymour-natus', 'mortibody');
    expect(r.onStage).toBe(true);
    expect(r.alpha).toBe(1);
    expect(r.calls).toContain('dissolve=1:mortibody');
    expect(r.calls).toContain('fade=1:mortibody');
    expect(r.calls.some((c) => c.startsWith('remove:'))).toBe(false);
  });

  it('Chapter I did not move: Mortiorchis is still sent and removed (the finding is reported, not fixed here)', async () => {
    expect(getChapter('seymour-flux')).toBe(SEYMOUR_FLUX);
    expect(departureKindOf('mortiorchis')).toBe('dissolve');
    const r = await mountAfterFirstDrain(SEYMOUR_FLUX, 'seymour-flux', 'mortiorchis');
    expect(r.onStage).toBe(false);
  });
});
