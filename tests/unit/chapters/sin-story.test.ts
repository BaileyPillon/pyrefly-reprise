/**
 * **Sin's two story layers** (Chapters XVII and XVIII, FFX only): the house rules every chapter's scripts
 * obey (`src/story/registry.ts`, `tests/unit/story-triggers.test.ts`), applied here because the two
 * chapters are unlisted and the registry only walks the listed ones, plus proof on the real FFX engine that
 * the triggers fire.
 *
 * Game case: FFX only [AGENTS.md rule 14]: no FFX-2 speaker appears, and Brother is the FFX `'brother'`.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleSetup, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { MAX_QUIP_WORDS, lintScript, type ChapterScripts, type StoryScript } from '../../../src/story/dsl.ts';
import { MID_SCRIPT_BUDGET_MS, SEAM_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { SIN_FINS_CORE_SEAMS, sinFinsCoreScripts } from '../../../src/story/scripts/sin-fins-core.ts';
import { sinFaceScripts } from '../../../src/story/scripts/sin-face.ts';

const CHAPTERS: ReadonlyArray<readonly [id: string, scripts: ChapterScripts, seams: readonly string[]]> = [
  ['sin-fins-core', sinFinsCoreScripts, SIN_FINS_CORE_SEAMS],
  ['sin-face', sinFaceScripts, []],
];

/** The FFX cast on the Fahrenheit (writing-bible §1; plan §3.5): existing portraits, Brother's plate, stage lines. */
const FFX_SPEAKERS = new Set(['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku', 'cid', 'brother', 'narrator', 'none']);

function speakers(script: StoryScript): string[] {
  return script.flatMap((s) => (s.type === 'say' ? [s.who, ...(s.fallback ?? []).map((f) => f.who)] : []));
}

describe.each(CHAPTERS)('%s: the story layer', (id, scripts, seams) => {
  it('is the chapter record\'s own scripts', () => {
    expect(getChapter(id)?.scriptsRef).toBe(scripts);
  });

  it('pre ends by opening the battle, post shows the results', () => {
    expect(scripts.pre.at(-1)?.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
  });

  it('every line passes the house lint (60 x 2, one ellipsis, CHK-007)', () => {
    const all: Array<[string, StoryScript]> = [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)];
    for (const [name, script] of all) expect(lintScript(script), name).toEqual([]);
  });

  it('speaks with the FFX cast only: no FFX-2 speaker, Brother as the FFX pilot', () => {
    const all = [scripts.pre, scripts.post, ...Object.values(scripts.midScripts)].flatMap(speakers);
    for (const who of all) expect(FFX_SPEAKERS.has(who), who).toBe(true);
    expect(all).not.toContain('brother-x2');
  });

  it('every trigger has id === script and a script; no script is unreachable', () => {
    for (const t of scripts.mid) {
      expect(t.script, t.id).toBe(t.id);
      expect(scripts.midScripts[t.id], t.id).toBeDefined();
    }
    const referenced = new Set(scripts.mid.map((t) => t.script));
    for (const name of Object.keys(scripts.midScripts)) expect(referenced.has(name), name).toBe(true);
  });

  it('every mid-battle line is timed, and every beat fits its budget (a seam gets the seam budget)', () => {
    for (const [name, script] of Object.entries(scripts.midScripts)) {
      for (const step of script) if (step.type === 'say') expect(step.auto, `${name}: ${step.text}`).toBeGreaterThan(0);
      const budget = seams.includes(name) ? SEAM_BUDGET_MS : MID_SCRIPT_BUDGET_MS;
      expect(scriptDurationMs(script), name).toBeLessThanOrEqual(budget);
    }
  });

  it('victory quips are the Grim tier: at most ten words each', () => {
    for (const [who, lines] of Object.entries(scripts.victoryQuips)) {
      for (const line of lines) expect(line.split(/\s+/).length, `${who}: ${line}`).toBeLessThanOrEqual(MAX_QUIP_WORDS);
    }
  });
});

describe('Chapter XVIII keeps its "Yes." beat unused (plan §3.3: the request is Yuna\'s)', () => {
  it('Yuna never answers with a bare "Yes."', () => {
    const yuna = sinFaceScripts.pre.filter((s) => s.type === 'say' && s.who === 'yuna');
    expect(yuna.some((s) => s.type === 'say' && s.text.trim() === 'Yes.')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// On the real engine: the triggers fire where they are meant to
// ---------------------------------------------------------------------------

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

type Input = Extract<Decision, { kind: 'player-input' }>;

/** Drive up to `max` decisions, collecting every event; `choose` answers each player turn. */
function run(setup: BattleSetup, choose: (d: Input, flags: Record<string, unknown>, hp: (id: string) => void) => Command, max = 400): BattleEvent[] {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup);
  const events: BattleEvent[] = [];
  const flags = engine.state().flags as Record<string, unknown>;
  // Test-only: set one enemy to 1 HP, so a single swing proves the KO trigger (the precedent mutates flags, `sinUnits.ts`).
  const toOne = (id: string): void => {
    (engine.state().combatants[id] as { hp: number }).hp = 1;
  };
  for (let i = 0; i < max; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') events.push(...engine.submit(choose(d, flags, toOne)));
    else if (d.kind === 'resolved') events.push(...d.events);
  }
  return events;
}

const fired = (events: BattleEvent[]): string[] =>
  events.flatMap((e) => (e.type === 'script-trigger' ? [e.name] : []));

describe('the triggers fire on the real FFX engine', () => {
  it('Chapter XVII: Tidus\'s first Close in plays his ask, and the Left Fin\'s KO plays the seam', () => {
    const chapter = getChapter('sin-fins-core')!;
    let asked = false;
    const events = run(setupForChapter(chapter, 1), (d, flags, toOne) => {
      // The range is package F's to publish; until it merges the order rows are offered disabled, so the test
      // stands the ship FAR the way F's setup will (plan §2.3), and proves only the story wiring.
      if (flags['airship.range'] === undefined) flags['airship.range'] = 'far';
      const close = d.commands.find((c) => c.enabled && c.command.kind === 'trigger' && c.command.id === 'close-in');
      if (d.actorId === 'tidus' && close && !asked) {
        asked = true;
        return { ...close.command, targets: [] } as Command;
      }
      if (asked) {
        flags['airship.range'] = 'near'; // as Cid will fly it (F's script); a stub Cid does not
        toOne('left-fin');
      }
      const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes('left-fin'));
      return swing ? ({ ...swing.command, targets: ['left-fin'] } as Command) : { kind: 'defend', targets: [] };
    });
    const names = fired(events);
    expect(names).toContain('order-tidus-in');
    expect(names).toContain('left-fin-down');
  });

  it('Chapter XVIII: Sin\'s first pull plays the one callout, once', () => {
    const chapter = getChapter('sin-face')!;
    const events = run(setupForChapter(chapter, 1), () => ({ kind: 'defend', targets: [] }), 120);
    expect(fired(events).filter((n) => n === 'sin-first-pull')).toHaveLength(1);
  });

  it('the formations the triggers name are the chapters\' own', () => {
    expect(ENEMY_GROUPS_BY_ID['sin-left-fin']?.enemies.map((e) => e.id)).toContain('left-fin');
    expect(ENEMY_GROUPS_BY_ID['sin-genais-core']?.enemies.map((e) => e.id)).toEqual(expect.arrayContaining(['sinspawn-genais', 'sin-core']));
  });
});

describe('the story triggers only add beats: the fight underneath is unchanged', () => {
  // A trigger evaluates published state and emits a `script-trigger` event; it draws no RNG and writes no
  // state. So the chapter's own setup (with its `mid`) and the bare formation (no triggers, as the link-4
  // bench runs it) must give the same event log once the `script-trigger` events are set aside.
  const policy = (d: Input): Command => {
    const swing = d.commands.find((c) => c.enabled && (c.command.kind === 'attack' || c.label === 'Lancet') && c.validTargets.length > 0);
    return swing ? ({ ...swing.command, targets: [swing.validTargets[0]!] } as Command) : { kind: 'defend', targets: [] };
  };
  // `seq` numbers every event, the trigger's included, so it is set aside with them.
  const strip = (events: BattleEvent[]): string =>
    JSON.stringify(events.filter((e) => e.type !== 'script-trigger').map((e) => ({ ...e, seq: undefined })));

  for (const id of ['sin-face', 'sin-fins-core']) {
    it(`${id}: seeds 1 to 4, with and without the triggers`, () => {
      const chapter = getChapter(id)!;
      for (let seed = 1; seed <= 4; seed++) {
        const withBeats = run(setupForChapter(chapter, seed), policy, 1500);
        const bare = run({ ...setupForChapter(chapter, seed), triggers: [] }, policy, 1500);
        expect(strip(withBeats), `${id} seed ${seed}`).toBe(strip(bare));
      }
    });
  }
});
