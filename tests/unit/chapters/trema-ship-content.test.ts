/**
 * Chapter XIII (Trema): the pause card, the guide, the tactic and the departures, in both
 * chapter shapes. The guide and the card must stay true for every option on the options sheet,
 * so each is checked for the Paragon link and for Trema alone. The tactic is run on the real
 * engine (AGENTS.md rule 3).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleSetup } from '../../../src/battle/common/types.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { TREMA_META, tremaMetaFor } from '../../../src/data/chapter-meta-trema.ts';
import { FFX2_TREMA_GUIDE, tremaGuideFor } from '../../../src/data/guides/ffx2-trema.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { TREMA_SHAPE_ALONE, TREMA_SHAPE_OVERSOUL_LINK, TREMA_SHAPE_PARAGON_LINK, type TremaShape } from '../../../src/data/trema-shape.ts';
import { guideForState } from '../../../src/engine/tactics/guide.ts';
import { tacticFor } from '../../../src/engine/tactics/index.ts';
import { ffx2Trema } from '../../../src/engine/tactics/ffx2-trema.ts';
import { HELD_MARK, departureKindOf, departurePoses } from '../../../src/engine/BattlePresenterDepartures.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { FFX2_TREMA } from '../../../src/data/chapter-ffx2-trema.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { group, newEngine } from '../helpers/tremaDrive.ts';
import { FakeStage, noSleep } from '../helpers/FakeStage.ts';

const OVERSOUL_LIKE: TremaShape = { paragonLink: true, paragonBigBang: false, paragonId: 'paragon', tremaId: 'trema' };
const SHAPES = [
  ['Oversoul Paragon link (shipped)', TREMA_SHAPE_OVERSOUL_LINK],
  ['Paragon link', TREMA_SHAPE_PARAGON_LINK],
  ['Paragon with no Big Bang', OVERSOUL_LIKE],
  ['Trema alone', TREMA_SHAPE_ALONE],
] as const;

const words = (t: string): number => t.trim().split(/\s+/).filter(Boolean).length;
const art = (p: string): boolean => existsSync(new URL(`../../../public/art/${p}`, import.meta.url));

describe('the pause card', () => {
  it('is listed, as its chapter is (2026-09-25), with the installed hero plate B', () => {
    expect(UNLISTED_CHAPTER_META).not.toContain(TREMA_META);
    expect(CHAPTER_META.at(-2)).toBe(TREMA_META); // Chapter XIV's card follows (listed the same day)
    expect(TREMA_META.heroArt).toBe('pause/ch13-trema');
    expect(getChapterMeta('ffx2-trema')).toBe(TREMA_META);
    expect(TREMA_META).toMatchObject({ numeral: 'XIII', gameLabel: 'FFX-2', title: 'Trema', location: 'Via Infinito — Cloister 100' });
  });

  it.each(SHAPES)('%s: the house shape (the chapter-meta suite\'s rules)', (_n, shape) => {
    const m = tremaMetaFor(shape);
    expect(words(m.quote.text)).toBeLessThan(18);
    expect(words(m.handwritten)).toBeGreaterThanOrEqual(4);
    expect(words(m.handwritten)).toBeLessThanOrEqual(6);
    expect(words(m.subtitle)).toBeGreaterThanOrEqual(2);
    expect(words(m.subtitle)).toBeLessThanOrEqual(4);
    expect(m.blurb.match(/[.!?](?:\s|$)/g)).toHaveLength(2);
    expect(art(m.heroArtFallback)).toBe(true);
    for (const s of m.snapshots) {
      expect(art(s.image), s.image).toBe(true);
      expect(words(s.caption)).toBeLessThanOrEqual(5);
    }
    expect(new Set(m.objectives.map((o) => o.id)).size).toBe(3);
  });

  it('only a Paragon link names Paragon: the objective, the blurb and the snapshot', () => {
    const link = tremaMetaFor(TREMA_SHAPE_PARAGON_LINK);
    const alone = tremaMetaFor(TREMA_SHAPE_ALONE);
    expect(link.objectives[0].rule).toEqual({ kind: 'link-reached', link: 2 });
    expect(alone.objectives.some((o) => o.rule.kind === 'link-reached')).toBe(false);
    expect(JSON.stringify(alone)).not.toMatch(/paragon/i);
  });

  it('the quote is a line the story plays', () => {
    const script = readFileSync(new URL('../../../src/story/scripts/ffx2-trema.ts', import.meta.url), 'utf8');
    expect(script).toContain(TREMA_META.quote.text);
  });
});

describe('the guide', () => {
  it.each(SHAPES)('%s: 3 to 5 rules, each with a one-line short and a citation', (_n, shape) => {
    const g = tremaGuideFor(shape);
    expect(g.rules.length).toBeGreaterThanOrEqual(3);
    expect(g.rules.length).toBeLessThanOrEqual(5);
    const cite = /^(ffx|ffx2)-[a-z0-9-]+ §/;
    for (const r of g.rules) {
      expect(r.short.length).toBeLessThanOrEqual(RULE_SHORT_MAX);
      expect(r.cite).toMatch(cite);
    }
    for (const h of g.hints) expect(h.cite).toMatch(cite);
    for (const p of g.phases) expect(p.cite).toMatch(cite);
  });

  it('Big Bang is named only for a Paragon that has it; Paragon only with a link', () => {
    const says = (s: TremaShape): string => JSON.stringify(tremaGuideFor(s));
    expect(says(TREMA_SHAPE_PARAGON_LINK)).toMatch(/Big Bang/);
    expect(says(OVERSOUL_LIKE)).not.toMatch(/Big Bang/);
    // Oversoul Paragon (shipped) has no Big Bang counter (research §12.2): no "never Darkness" rule, no
    // counter line; Big Bang is named only as a move it makes when left alone or near the end.
    const oversoul = tremaGuideFor(TREMA_SHAPE_OVERSOUL_LINK);
    expect(says(TREMA_SHAPE_OVERSOUL_LINK)).not.toMatch(/answers[^.'"]*with Big Bang|never Darkness/i);
    expect(oversoul.rules.map((r) => r.short)).toContain('Paragon waits, then answers every hit');
    expect(oversoul.bossIds).toEqual(['trema', 'paragon']);
    expect(says(TREMA_SHAPE_ALONE)).not.toMatch(/Big Bang|Paragon/);
    // m5: the boss ids follow the shape too, so Trema alone claims no Paragon.
    expect(tremaGuideFor(TREMA_SHAPE_ALONE).bossIds).toEqual(['trema']);
    expect(tremaGuideFor(TREMA_SHAPE_PARAGON_LINK).bossIds).toEqual(['trema', 'paragon']);
    expect(says(TREMA_SHAPE_ALONE)).not.toMatch(/paragon/i);
  });

  it('the registered guide is the shipped shape\'s, and it is found from either boss on an FFX-2 board', () => {
    expect(FFX2_TREMA_GUIDE).toEqual(tremaGuideFor(TREMA_SHAPE_OVERSOUL_LINK));
    for (const id of ['paragon', 'trema']) {
      const state = { game: 'ffx2', combatants: { [id]: { id, side: 'enemy', alive: true, hp: 1, statuses: {}, stats: { maxHp: 1 } } }, log: [] };
      expect(guideForState(state as never)?.id).toBe('ffx2-trema');
      expect(guideForState({ ...state, game: 'ffx' } as never)).toBeNull();
    }
  });
});

describe('the tactic, on the real engine', () => {
  type Pick = { actor: string; kind: string; id?: string; targets: readonly string[] };

  /** The tactic's picks over several seeds (Paragon can wipe the party before anyone acts on some). */
  function picksOn(groupId: string, n: number, party: FFX2PartyBuild = viaInfinitoBuild): Pick[] {
    const out: Pick[] = [];
    for (let seed = 1; seed <= 12 && out.length < n; seed++) {
      const engine = newEngine();
      const setup: BattleSetup = { game: 'ffx2', party, enemies: group(groupId), triggers: [], seed, condition: 'normal', canEscape: false };
      engine.setSeed(seed);
      engine.init(setup);
      for (let i = 0; i < 4000 && out.length < n; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick(Math.max(1, d.nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        expect(tacticFor(engine)).toBe(ffx2Trema);
        const pick = ffx2Trema(d.actorId, d.commands, engine);
        const itchy = 'itchy' in (engine.state().combatants[d.actorId] as { statuses: object }).statuses;
        // Itchy leaves only a spherechange (§2.8): the tactic has no line there and hands the turn on.
        if (!pick && itchy) {
          engine.submit({ ...d.commands.find((c) => c.enabled)!.command } as never);
          continue;
        }
        expect(pick, `${groupId} ${d.actorId}`).not.toBeNull();
        out.push({ actor: d.actorId, kind: pick!.kind, id: (pick as { id?: string }).id, targets: pick!.targets });
        engine.submit(pick!);
      }
    }
    return out;
  }

  it('Paragon: the Dark Knights swing plain Attacks, never Darkness', () => {
    const picks = picksOn('ffx2-cloister-paragon', 12);
    expect(picks.some((p) => p.id === 'x2-dark-knight-darkness')).toBe(false);
    expect(picks.some((p) => p.actor !== 'rikku' && p.kind === 'attack')).toBe(true);
  });

  it('shipped (Oversoul Paragon, sourced kit): a Stamina Tonic opens, the Dark Knights swing plain Attacks', () => {
    const picks = picksOn(FFX2_TREMA.enemyGroupRef.id, 12, FFX2_TREMA.buildRef as FFX2PartyBuild);
    expect(picks.find((p) => p.actor === 'rikku')?.id).toBe('x2-stamina-tonic');
    expect(picks.some((p) => p.id === 'x2-dark-knight-darkness')).toBe(false);
    expect(picks.some((p) => p.actor !== 'rikku' && p.kind === 'attack')).toBe(true);
  });

  it('shipped kit on Trema: a Soul Spring drains him first, Three Stars follows, the Dark Knights use Darkness', () => {
    const picks = picksOn('ffx2-cloister-trema', 16, FFX2_TREMA.buildRef as FFX2PartyBuild);
    expect(picks.find((p) => p.actor === 'rikku')?.id).toBe('x2-soul-spring');
    expect(picks.some((p) => p.id === 'x2-three-stars')).toBe(true);
    expect(picks.some((p) => p.id === 'x2-gunner-target-mp')).toBe(false);
    expect(picks.some((p) => p.id === 'x2-dark-knight-darkness')).toBe(true);
  });

  it('Trema: Rikku goes after his MP first, and the Dark Knights use Darkness', () => {
    const picks = picksOn('ffx2-cloister-trema', 12);
    expect(picks.find((p) => p.actor === 'rikku')?.kind).toBe('spherechange');
    expect(picks.some((p) => p.id === 'x2-gunner-target-mp')).toBe(true);
    expect(picks.some((p) => p.id === 'x2-dark-knight-darkness')).toBe(true);
  });
});

describe('the departures: beaten, left standing', () => {
  it('Paragon and Trema are held; no painted KO is ever fetched for them', () => {
    expect(departureKindOf('paragon')).toBe('held');
    expect(departureKindOf('trema')).toBe('held');
    expect(departurePoses('paragon', { idle: 'i.png', ko: 'k.png' }).ko).toBe('i.png');
  });

  it('a held Paragon takes its standing painting, is never dissolved or removed at the blow; victory still plays', async () => {
    const stage = new FakeStage(['yuna', 'rikku', 'paine'], ['paragon']);
    const presenter = new BattlePresenter({ stage, sleep: noSleep });
    const fake = stage.actor('paragon') as unknown as { userData?: Record<string, unknown> };
    fake.userData = {}; // a PaintedActor has one (Object3D); the fake does not
    await presenter.play([
      { type: 'ko', targetId: 'paragon', seq: 0 } as BattleEvent,
      { type: 'victory', seq: 1 } as BattleEvent,
    ]);
    expect(stage.calls).toContain('pose=hurt:paragon');
    expect((stage.actor('paragon') as unknown as { userData?: Record<string, unknown> }).userData?.[HELD_MARK]).toBe(true);
    expect(stage.calls.some((c) => c.endsWith(':paragon') && /^(dissolve|remove|moveTo|fade)/.test(c))).toBe(false);
  });
});
