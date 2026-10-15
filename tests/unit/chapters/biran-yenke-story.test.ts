/**
 * The hidden Biran and Yenke chapter's story layer (`src/story/scripts/biran-yenke.ts`; FFX only [AGENTS.md rule 14]): the scenes lint clean, every mid-battle beat is wired to a trigger that
 * can fire and fits its budget, no beat is spoken by a Ronso who has fallen, and the voices keep to the writing bible (`research/writing-bible.md` §1.7 for Kimahri, §2.1 for FFX).
 *
 * The chapter is deliberately NOT in `src/story/registry.ts` (that file's keys are the listed chapters, as the Gui and the Experiment stories are not either), so the audits that file runs for
 * the registered chapters are repeated here for this one.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEvent, Command } from '../../../src/battle/common/types.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { MAX_QUIP_WORDS, lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { MID_SCRIPT_BUDGET_MS, blockingSteps, midBattleDeadlineMs, scriptDurationMs } from '../../../src/story/registry.ts';
import { biranYenkeScripts } from '../../../src/story/scripts/biran-yenke.ts';
import { BIRAN, YENKE, content, intendedLine, type Line } from '../helpers/ronsoDuel.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';

const chapter = getChapter('biran-yenke')!;
const scripts = chapter.scriptsRef;
const fielded = new Set(['kimahri', BIRAN, YENKE]);
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');
const speakers = (script: StoryScript): string[] => lines(script).flatMap((s) => (s.type === 'say' ? [(s as { who: string }).who] : []));
/** A Ronso speaker id is the combatant's name without the "-ronso". */
const combatantOf = (speaker: string): string | undefined => (speaker === 'biran' ? BIRAN : speaker === 'yenke' ? YENKE : undefined);

/** Play the duel to its end under `line` and return the log (the triggers ride in it as `script-trigger` events). */
function playLog(line: Line, seed: number): readonly BattleEvent[] {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ ...setupForChapter(chapter, seed) });
  for (let i = 0; i < 20_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    engine.submit(line(engine, d) ?? { kind: 'defend', targets: [] });
  }
  return engine.state().log;
}

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and the results first after it; no victory quips', () => {
    expect(scripts).toBe(biranYenkeScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post[0]!.type).toBe('results');
    expect(scripts.victoryQuips).toEqual({});
  });

  it('lints clean: every scene and every beat', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)] as Array<[string, StoryScript]>) {
      expect(lintScript(script), name).toEqual([]);
    }
  });

  it('the sizes: pre about ten lines, post about seven', () => {
    expect(lines(scripts.pre).length).toBeGreaterThanOrEqual(8);
    expect(lines(scripts.pre).length).toBeLessThanOrEqual(12);
    expect(lines(scripts.post).length).toBeGreaterThanOrEqual(5);
    expect(lines(scripts.post).length).toBeLessThanOrEqual(9);
  });

  it('the scenes play the mountain\'s bed (the fight\'s too), and the post scene opens in silence', () => {
    const cue = scripts.pre.find((s) => s.type === 'music');
    expect(cue && cue.type === 'music' ? cue.track : null).toBe('scene-gagazet');
    const post = scripts.post.find((s) => s.type === 'music');
    expect(post && post.type === 'music' ? post.track : 'none').toBeNull();
  });
});

describe('the mid-battle beats are wired, fit their budgets and are never spoken by the fallen', () => {
  it('every trigger id equals its script and resolves, and names a combatant the chapter really fields', () => {
    expect(scripts.mid.length).toBe(7);
    for (const t of scripts.mid) {
      expect(t.id, 'the engine emits the trigger id, so it must be the script ref').toBe(t.script);
      expect(scripts.midScripts[t.script], `no script for ${t.id}`).toBeDefined();
      expect(t.once, t.id).toBe(true);
      const who = 'who' in t.when ? t.when.who : undefined;
      if (who !== undefined) expect(fielded.has(who), `${t.id} names ${who}`).toBe(true);
    }
    expect(Object.keys(scripts.midScripts).sort()).toEqual(scripts.mid.map((t) => t.id).sort());
  });

  it('no beat is keyed on a fall: the answers to a fall are the survivor\'s own Berserk and Haste, so the second fall says nothing', () => {
    expect(scripts.mid.some((t) => t.when.type === 'ko')).toBe(false);
    const by = (id: string) => scripts.mid.find((t) => t.id === id)!.when;
    expect(by('biran-berserks')).toEqual({ type: 'ability-used', who: BIRAN, ability: 'biran-berserk' });
    expect(by('yenke-hastes')).toEqual({ type: 'ability-used', who: YENKE, ability: 'haste' });
  });

  it('a beat a Ronso speaks is keyed on his own move, so he is standing when it plays', () => {
    for (const t of scripts.mid) {
      for (const who of speakers(scripts.midScripts[t.script]!)) {
        const c = combatantOf(who);
        if (c === undefined) continue;
        expect(t.when.type === 'ability-used' && t.when.who === c, `${t.id}: ${who} speaks on someone else's move`).toBe(true);
      }
    }
  });

  it('on the real engine, over 60 seeds of the advisor\'s line and 20 of a line that drops Yenke first, every beat that plays has its Ronso speaker standing', () => {
    const killYenkeFirst: Line = (engine, d) => {
      const yenke = engine.state().combatants[YENKE];
      if (yenke && yenke.hp > 0) {
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'lancet');
        if (row) return { ...row.command, targets: [YENKE] } as Command;
      }
      return intendedLine(engine, d);
    };
    const fired = new Map<string, number>();
    for (const [line, n] of [[intendedLine, 60], [killYenkeFirst, 20]] as const) {
      for (let seed = 1; seed <= n; seed++) {
        const down = new Set<string>();
        for (const e of playLog(line, seed)) {
          if (e.type === 'ko') down.add(e.targetId);
          if (e.type !== 'script-trigger') continue;
          fired.set(e.name, (fired.get(e.name) ?? 0) + 1);
          for (const who of speakers(scripts.midScripts[e.name]!)) {
            const c = combatantOf(who);
            if (c !== undefined) expect(down.has(c), `seed ${seed}: ${e.name} spoken by a fallen ${who}`).toBe(false);
          }
        }
      }
    }
    // the advisor's line plays the first Bulldoze's beat every time; the lessons' beats and Biran's Berserk (the Yenke-first line) are heard
    expect(fired.get('ronso-first-bulldoze')).toBe(80);
    expect(fired.get('biran-mighty-guard-raised') ?? 0).toBeGreaterThan(0);
    expect((fired.get('yenke-white-wind-called') ?? 0) + (fired.get('yenke-white-wind-called-alone') ?? 0)).toBeGreaterThan(0);
    expect(fired.get('biran-berserks') ?? 0).toBeGreaterThan(0);
  }, 60_000);

  it('every beat fits the interrupt budget, waits on no Confirm, and holds each line for an explicit time; no line is over ten words', () => {
    for (const [id, script] of Object.entries(scripts.midScripts)) {
      expect(scriptDurationMs(script), id).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
      expect(midBattleDeadlineMs(script), id).toBe(MID_SCRIPT_BUDGET_MS);
      expect(blockingSteps(script), id).toEqual([]);
      for (const s of lines(script)) {
        expect(s.auto, s.text).toBeGreaterThan(0);
        expect(s.text.split(/\s+/).length, s.text).toBeLessThanOrEqual(MAX_QUIP_WORDS);
      }
    }
  });
});

describe('the voices keep to the writing bible', () => {
  const all = [...lines(scripts.pre), ...lines(scripts.post), ...Object.values(scripts.midScripts).flatMap(lines)];
  const kimahri = all.filter((s) => s.type === 'say' && (s as { who: string }).who === 'kimahri').map((s) => s.text);

  it('Kimahri: third person, three to eight words, one to three lines a scene (§1.7)', () => {
    expect(kimahri.length).toBeGreaterThanOrEqual(3);
    for (const t of kimahri) {
      const words = t.split(/\s+/).length;
      expect(words, t).toBeGreaterThanOrEqual(3);
      expect(words, t).toBeLessThanOrEqual(8);
      expect(t, 'he never says "I"').not.toMatch(/\bI\b|\bme\b|\bmy\b/);
    }
    for (const scene of [scripts.pre, scripts.post]) {
      const n = speakers(scene).filter((w) => w === 'kimahri').length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
    }
  });

  it('the Ronso call him hornless, and every speaker is someone the scene has', () => {
    const ronso = all.filter((s) => s.type === 'say' && ['biran', 'yenke'].includes((s as { who: string }).who)).map((s) => s.text).join('\n');
    expect(ronso).toMatch(/hornless/);
    const who = new Set(all.flatMap((s) => (s.type === 'say' ? [(s as { who: string }).who] : [])));
    for (const w of who) expect(['kimahri', 'yuna', 'biran', 'yenke', 'none']).toContain(w);
  });
});

