/**
 * **Chapter IX — the four mid-battle callouts** (D-068, draft option C-1),
 * `docs/plans/yojimbo-story-draft.md` lines 86-99, built as written after
 * Bailey read them (2026-09-25: "Read, build as written (Recommended)").
 *
 * Every trigger is proved by running the real engine with the chapter's own
 * `mid` triggers to the moment the draft names, then checking the
 * `script-trigger` event the presenter plays [AGENTS.md hard rule 3]. Nothing
 * greps.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: an enemy Overdrive gauge,
 * Ronso Rage Doom and aeons are FFX's. The last block pins that the two new
 * optional condition fields never fire in the FFX-2 evaluator.
 */

import { describe, expect, it } from 'vitest';
import type {
  BattleEngine,
  BattleEvent,
  BattleState,
  Command,
  Decision,
  FFXCombatant,
  MidBattleTrigger,
} from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { evaluateTriggers as evaluateFfx2Triggers } from '../../../src/battle/ffx2/triggers.ts';
import * as rules from '../../../src/battle/ffx/ai/yojimbo-rules.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { yojimboCavernBuild } from '../../../src/data/ffx/builds/yojimbo-cavern.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { lintScript, type SayStep } from '../../../src/story/dsl.ts';
import { MID_SCRIPT_BUDGET_MS, midScript, midScriptDurations } from '../../../src/story/registry.ts';
import { YOJIMBO, ZANMATO, yojimboCavernScripts } from '../../../src/story/scripts/yojimbo-cavern.ts';

const { mid, midScripts } = yojimboCavernScripts;

/** The draft's table, lines 94-97, verbatim. */
const DRAFT = [
  { id: 'yojimbo-long-blade', who: 'lulu', text: 'He draws the long blade now. Be quick.' },
  { id: 'yojimbo-zanmato-next', who: 'auron', text: 'Next turn, he kills us all. Move.' },
  { id: 'yojimbo-doomed', who: 'kimahri', text: 'Five breaths. Then gone.' },
  { id: 'yojimbo-aeon-takes-zanmato', who: 'yuna', text: 'Thank you. Rest now.' },
] as const;

// ---------------------------------------------------------------------------
// Engine harness (the chapter's own formation, build and triggers)
// ---------------------------------------------------------------------------

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

function newEngine(seed: number, triggers: MidBattleTrigger[] = mid): BattleEngine {
  const group = ENEMY_GROUPS_BY_ID['yojimbo-cavern'];
  if (!group) throw new Error('yojimbo-cavern missing from the data layer');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: yojimboCavernBuild, enemies: group, triggers, seed, condition: 'normal', canEscape: false });
  return engine;
}

type Input = Extract<Decision, { kind: 'player-input' }>;
const defend = (): Command => ({ kind: 'defend', targets: [] });

function drive(engine: BattleEngine, choose: (d: Input) => Command, stop: (e: BattleEngine) => boolean, max = 4000): void {
  for (let i = 0; i < max; i++) {
    if (stop(engine)) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') engine.submit(choose(d));
  }
}

function yojimbo(engine: BattleEngine): FFXCombatant {
  return engine.state().combatants[YOJIMBO] as FFXCombatant;
}

function setGauge(engine: BattleEngine, value: number): void {
  const od = yojimbo(engine).overdrive;
  if (!od) throw new Error('no gauge');
  od.gauge = value;
}

function makeInvincible(engine: BattleEngine): void {
  const st = engine.state();
  for (const id of [...st.activeIds, ...st.reserveIds]) {
    const c = st.combatants[id];
    if (!c) continue;
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
  }
}

const log = (engine: BattleEngine): readonly BattleEvent[] => engine.state().log;
const fired = (engine: BattleEngine, name: string): number[] =>
  log(engine).flatMap((e, i) => (e.type === 'script-trigger' && e.name === name ? [i] : []));

/** Index of the first event after `from` of `type`, or the log's length. */
function nextOf(events: readonly BattleEvent[], from: number, type: BattleEvent['type']): number {
  const i = events.findIndex((e, k) => k > from && e.type === type);
  return i < 0 ? events.length : i;
}

/** The first Yojimbo gauge change that crosses `at`, from below. */
function crossing(engine: BattleEngine, at: number): number {
  return log(engine).findIndex(
    (e) => e.type === 'overdrive-gauge' && e.who === YOJIMBO && e.from < at && e.to >= at,
  );
}

// ---------------------------------------------------------------------------
// The lines
// ---------------------------------------------------------------------------

describe('the four callouts are the draft’s lines, word for word (D-068, C-1)', () => {
  it('four triggers, each id its own script, each armed once', () => {
    expect(mid.map((t) => t.id)).toEqual(DRAFT.map((d) => d.id));
    for (const t of mid) {
      expect(t.script).toBe(t.id);
      expect(t.once).toBe(true);
    }
    expect(getChapter('yojimbo-cavern')?.scriptsRef.mid).toBe(mid);
  });

  it('each script is one line by the draft’s speaker, under the house lint and 10 words', () => {
    for (const d of DRAFT) {
      const script = midScripts[d.id]!;
      expect(script).toHaveLength(1);
      const line = script[0] as SayStep;
      expect(line).toMatchObject({ type: 'say', who: d.who, text: d.text });
      expect(line.auto, d.id).toBeGreaterThan(0); // never waits on Confirm mid-fight
      expect(lintScript(script)).toEqual([]);
      expect(d.text.split(/\s+/).length).toBeLessThanOrEqual(10);
      expect(midScript('yojimbo-cavern', d.id)).toBe(script);
    }
  });

  it('every callout fits the 8 s mid-battle budget', () => {
    const rows = midScriptDurations('yojimbo-cavern');
    expect(rows).toHaveLength(4);
    for (const r of rows) {
      expect(r.budget).toBe(MID_SCRIPT_BUDGET_MS);
      expect(r.ms, r.name).toBeLessThanOrEqual(r.budget);
    }
  });

  it('the story file’s mirrored ids equal the battle layer’s', () => {
    expect(YOJIMBO).toBe(rules.YOJIMBO_ID);
    expect(ZANMATO).toBe(rules.YOJIMBO_ZANMATO);
    // "at 50 %" and "full" are the sourced bands, research §4.1 [verified: 3 sources].
    expect(mid[0]!.when).toEqual({ type: 'overdrive', who: YOJIMBO, at: rules.BAND_WAKIZASHI });
    expect(mid[1]!.when).toEqual({ type: 'overdrive', who: YOJIMBO });
    expect(rules.BAND_ZANMATO).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// The engine, to each trigger
// ---------------------------------------------------------------------------

describe('Lulu, when the gauge crosses 50 % (the Wakizashi joins his pool)', () => {
  it('fires once, after the change that crosses 50, before the next turn opens, and never earlier', () => {
    const engine = newEngine(21);
    makeInvincible(engine);
    drive(engine, defend, (e) => crossing(e, 60) >= 0 || e.state().result !== null);
    const at = crossing(engine, 50);
    expect(at, 'the gauge crossed 50').toBeGreaterThan(0);
    const hits = fired(engine, 'yojimbo-long-blade');
    expect(hits).toHaveLength(1);
    expect(hits[0]!).toBeGreaterThan(at);
    expect(hits[0]!).toBeLessThan(nextOf(log(engine), at, 'turn-start'));
    // Below 50 the pool never held the Wakizashi, and the line never played.
    expect(log(engine).slice(0, at).some((e) => e.type === 'script-trigger')).toBe(false);
  });

  it('fires on a party action too, when the +3 for targeting him carries the gauge over', () => {
    const engine = newEngine(22);
    makeInvincible(engine);
    let struckAt = -1;
    drive(engine, () => {
      if (struckAt < 0) {
        setGauge(engine, 49); // just under the band, at the party's first input
        struckAt = log(engine).length;
        return { kind: 'attack', targets: [YOJIMBO] };
      }
      return defend();
    }, () => (struckAt >= 0 && fired(engine, 'yojimbo-long-blade').length > 0) || engine.state().result !== null, 200);
    const at = crossing(engine, 50);
    const change = log(engine)[at] as Extract<BattleEvent, { type: 'overdrive-gauge' }>;
    expect(change).toMatchObject({ from: 49, to: 52, cause: 'targeted' });
    const attack = log(engine).findIndex((e, i) => i >= struckAt && e.type === 'action-start');
    expect((log(engine)[attack] as Extract<BattleEvent, { type: 'action-start' }>).actorId).not.toBe(YOJIMBO);
    const hits = fired(engine, 'yojimbo-long-blade');
    expect(hits).toHaveLength(1);
    expect(hits[0]!).toBeGreaterThan(at);
    expect(hits[0]!).toBeLessThan(nextOf(log(engine), attack, 'turn-start'));
  });
});

describe('Auron, when the gauge is full ("Zanmato next turn")', () => {
  it('fires once when the gauge reaches 100, before Zanmato lands, and not again at the second fill', () => {
    const engine = newEngine(23);
    makeInvincible(engine);
    setGauge(engine, 96);
    // Two fills: the first Zanmato resets the gauge to 0 (B2), then it is filled again.
    let zanmatos = 0;
    drive(engine, defend, (e) => {
      zanmatos = log(e).filter((ev) => ev.type === 'action-start' && ev.abilityId === ZANMATO).length;
      if (zanmatos === 1 && (yojimbo(e).overdrive?.gauge ?? 0) < 90) setGauge(e, 99);
      return zanmatos >= 2 || e.state().result !== null;
    });
    expect(zanmatos).toBe(2);
    const full = crossing(engine, 100);
    const hits = fired(engine, 'yojimbo-zanmato-next');
    expect(hits).toHaveLength(1);
    expect(hits[0]!).toBeGreaterThan(full);
    const firstZanmato = log(engine).findIndex((e) => e.type === 'action-start' && e.abilityId === ZANMATO);
    expect(hits[0]!).toBeLessThan(firstZanmato);
  });
});

describe('Kimahri, when Doom lands on Yojimbo (count 5, research §2.1)', () => {
  it('fires once, right after the Doom status lands, in that same action', () => {
    const engine = newEngine(24);
    makeInvincible(engine);
    let doomed = false;
    drive(engine, (d) => {
      if (!doomed && d.actorId === 'kimahri') {
        doomed = true;
        return { kind: 'overdrive', id: 'doom', targets: [YOJIMBO] };
      }
      return defend();
    }, () => fired(engine, 'yojimbo-doomed').length > 0 || engine.state().result !== null);
    const landed = log(engine).findIndex((e) => e.type === 'status-add' && e.targetId === YOJIMBO && e.status === 'doom');
    expect(landed).toBeGreaterThan(0);
    const hits = fired(engine, 'yojimbo-doomed');
    expect(hits).toHaveLength(1);
    expect(hits[0]!).toBeGreaterThan(landed);
    expect(hits[0]!).toBeLessThan(nextOf(log(engine), landed, 'turn-start'));
  });
});

describe('Yuna, when an aeon takes Zanmato (research §5.3)', () => {
  /** Who Zanmato's damage landed on: the AI passes `[]` and the row's targeting resolves it. */
  function zanmatoHits(engine: BattleEngine, z: number): string[] {
    const end = nextOf(log(engine), z, 'action-end');
    return log(engine)
      .slice(z, end)
      .flatMap((e) => (e.type === 'damage' ? [e.targetId] : []));
  }

  function zanmatoOn(summon: boolean, seed: number): BattleEngine {
    const engine = newEngine(seed);
    makeInvincible(engine);
    let summoned = !summon;
    drive(engine, (d) => {
      if (!summoned && d.actorId === 'yuna') { summoned = true; return { kind: 'summon', id: 'bahamut', targets: [] }; }
      return defend();
    }, () => summoned && (!summon || engine.state().aeonId !== null));
    setGauge(engine, 100);
    drive(engine, defend, (e) => {
      const z = log(e).findIndex((ev) => ev.type === 'action-start' && ev.abilityId === ZANMATO);
      return (z >= 0 && nextOf(log(e), z, 'turn-start') < log(e).length) || e.state().result !== null;
    });
    return engine;
  }

  it('fires once after Zanmato lands on the aeon, before the next turn opens', () => {
    const engine = zanmatoOn(true, 25);
    const z = log(engine).findIndex((e) => e.type === 'action-start' && e.abilityId === ZANMATO);
    expect(z).toBeGreaterThan(0);
    expect(zanmatoHits(engine, z)).toEqual(['bahamut']);
    const hits = fired(engine, 'yojimbo-aeon-takes-zanmato');
    expect(hits).toHaveLength(1);
    expect(hits[0]!).toBeGreaterThan(z);
    expect(hits[0]!).toBeLessThan(nextOf(log(engine), z, 'turn-start'));
  });

  it('stays silent when Zanmato lands on the party itself', () => {
    const engine = zanmatoOn(false, 26);
    const z = log(engine).findIndex((e) => e.type === 'action-start' && e.abilityId === ZANMATO);
    expect(z).toBeGreaterThan(0);
    expect(zanmatoHits(engine, z)).toEqual(['lulu', 'kimahri', 'yuna']);
    expect(fired(engine, 'yojimbo-aeon-takes-zanmato')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// FFX only: the two new condition fields never fire in the FFX-2 evaluator
// ---------------------------------------------------------------------------

describe('FFX only [rule 14]: `onAeon` and `overdrive.at` never fire in FFX-2', () => {
  it('the X-2 evaluator ignores both, even on a matching ability', () => {
    const state = { triggers: mid, firedTriggerIds: [] as string[], turn: 1 } as unknown as BattleState;
    const emitted: unknown[] = [];
    evaluateFfx2Triggers(state, [], { abilityUsed: { who: YOJIMBO, ability: ZANMATO } }, (e) => { emitted.push(e); });
    expect(emitted).toEqual([]);
  });
});
