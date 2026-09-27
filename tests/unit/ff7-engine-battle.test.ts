/**
 * An FF7 battle end to end through the engine: the Limit gauge from damage
 * taken, Braver and Big Shot, KO, victory and its rewards, defeat, determinism
 * and JSON-safe events, and the layering rule for `src/battle/ff7/**`.
 * FF7 only. "core" is `research/ff7-battle-core.md`, "gs" `research/ff7-guard-scorpion.md`.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FF7_POLICIES, limitUnitsGained, runFf7Battle } from '../../src/battle/ff7/index.ts';
import { buildWith, DEFEND, gsSetup, newEngine, ofType, playUntil, REG, toNextMenu, u } from './helpers/ff7.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BOSS = 'guard-scorpion';

describe('the Limit gauge [core §7]', () => {
  it('fills from HP an enemy takes away: [[300 * lost / MaxHP] * 256 / LNum], Cloud LNum 140, Barret 129', () => {
    const e = newEngine(21);
    playUntil(e, () => DEFEND, () => e.state().turn > 40);
    const log = e.state().log;
    const gauge: Record<string, number> = { cloud: 0, barret: 0 };
    let checked = 0;
    for (let i = 0; i < log.length; i++) {
      const ev = log[i];
      if (ev?.type !== 'damage' || ev.sourceId !== BOSS) continue;
      const next = log[i + 1];
      const lnum = ev.targetId === 'cloud' ? 140 : 129;
      const max = u(e, ev.targetId).stats.maxHp;
      const want = Math.min(255, (gauge[ev.targetId] ?? 0) + limitUnitsGained(ev.amount, max, lnum));
      expect(next?.type).toBe('limit-gauge');
      if (next?.type === 'limit-gauge') {
        expect(next.value).toBe(want);
        expect(next.ready).toBe(want === 255);
        gauge[ev.targetId] = next.value;
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(3);
  });

  it('never fills from an ally (a Cure, a Potion) [core §7.1]', () => {
    const low = buildWith((b) => b.members.forEach((m) => (m.hp = 50)));
    const e = newEngine(1, {}, low);
    toNextMenu(e);
    const out = e.submit({ kind: 'item', id: 'potion', targets: ['cloud'] });
    expect(ofType(out, 'limit-gauge')).toHaveLength(0);
  });

  it('Braver 116 to 124 and Big Shot 105 to 113 on the tail-down boss; the gauge empties on use [core §7.2, §14]', () => {
    const full = buildWith((b) => b.members.forEach((m) => (m.limit.gauge = 255)));
    for (let seed = 1; seed <= 6; seed++) {
      const e = newEngine(seed, {}, full);
      for (let n = 0; n < 2; n++) {
        const who = toNextMenu(e);
        if (!who) break;
        const id = who === 'cloud' ? 'braver' : 'big-shot';
        const out = e.submit({ kind: 'limit', id, targets: [BOSS] });
        const hit = ofType(out, 'damage').find((d) => d.targetId === BOSS);
        const [lo, hi] = id === 'braver' ? [116, 124] : [105, 113];
        if (hit && !hit.crit) expect(hit.amount >= lo && hit.amount <= hi, `${id} ${hit.amount}`).toBe(true);
        expect(ofType(out, 'limit-gauge')[0]).toMatchObject({ actorId: who, value: 0, ready: false });
        expect(u(e, who).ff7.limit?.gauge).toBe(0);
      }
    }
  });

  it("a KO empties the gauge [core §7.2]", () => {
    const frail = buildWith((b) => b.members.forEach((m) => {
      m.hp = 1;
      m.limit.gauge = 200;
    }));
    const e = newEngine(3, {}, frail);
    playUntil(e, () => DEFEND, () => ofType(e.state().log, 'ko').length > 0);
    const ko = ofType(e.state().log, 'ko')[0];
    const after = e.state().log.filter((ev) => ev.type === 'limit-gauge' && ev.actorId === ko?.targetId).pop();
    expect(after).toMatchObject({ value: 0 });
    expect(u(e, ko?.targetId ?? '').ff7.limit?.gauge).toBe(0);
  });
});

describe('victory and defeat [core §11, gs §12]', () => {
  it('victory pays 100 EXP, 10 AP, 100 gil and the certain Assault Gun', () => {
    const run = runFf7Battle({ setup: gsSetup(1), registry: REG, policy: FF7_POLICIES.sensible });
    expect(run.result).toMatchObject({ outcome: 'victory', exp: 100, ap: 10, gil: 100, drops: [{ itemId: 'assault-gun', count: 1 }] });
    expect(run.result.turns).toBe(ofType(run.log, 'turn-start').length);
    expect(run.result.elapsedTicks).toBe(run.state.ticks);
    expect(run.log.at(-1)?.type).toBe('victory');
  });

  it('defeat when every party member is KO\'d', () => {
    const frail = buildWith((b) => b.members.forEach((m) => (m.hp = 1)));
    const e = newEngine(2, {}, frail);
    playUntil(e, () => DEFEND, () => e.state().result !== null);
    expect(e.state().result).toMatchObject({ outcome: 'defeat', exp: 0, ap: 0, gil: 0, drops: [] });
    expect(e.nextDecision().kind).toBe('battle-over');
    expect(ofType(e.state().log, 'defeat')).toHaveLength(1);
  });

  it('every policy ends every seed (no soft-lock), in every mode', () => {
    for (const mode of ['recommended', 'wait', 'active'] as const) {
      for (const policy of Object.values(FF7_POLICIES)) {
        for (let seed = 1; seed <= 10; seed++) {
          const run = runFf7Battle({ setup: gsSetup(seed), registry: REG, policy, atbMode: mode });
          expect(['victory', 'defeat']).toContain(run.result.outcome);
        }
      }
    }
  });
});

describe('determinism and events (plan §1.5)', () => {
  it('same seed and the same policy give the same log byte for byte; another seed does not', () => {
    const a = runFf7Battle({ setup: gsSetup(7), registry: REG, policy: FF7_POLICIES.sensible });
    const b = runFf7Battle({ setup: gsSetup(7), registry: REG, policy: FF7_POLICIES.sensible });
    const c = runFf7Battle({ setup: gsSetup(8), registry: REG, policy: FF7_POLICIES.sensible });
    expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
    expect(JSON.stringify(a.log)).not.toBe(JSON.stringify(c.log));
  });

  it('seq is the log index, and every event survives a JSON round trip', () => {
    const run = runFf7Battle({ setup: gsSetup(9), registry: REG, policy: FF7_POLICIES.naive });
    run.log.forEach((ev, i) => expect(ev.seq).toBe(i));
    expect(JSON.parse(JSON.stringify(run.log))).toEqual(run.log);
  });

  it('nextDecision is idempotent for player-input and battle-over', () => {
    const e = newEngine(4);
    toNextMenu(e);
    const log = e.state().log.length;
    expect(JSON.stringify(e.nextDecision())).toBe(JSON.stringify(e.nextDecision()));
    expect(e.state().log.length).toBe(log);
  });
});

describe('layering (AGENTS.md rule 1, rule 7)', () => {
  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
    });
  }
  const src = files(join(ROOT, 'src', 'battle', 'ff7'));

  it('src/battle/ff7 imports no DOM, no three, nothing from src/data, src/engine or src/ui, and never Math.random or Date', () => {
    for (const f of src) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/from 'three'|\bdocument\.|\bwindow\.|Math\.random|Date\.now|new Date\(/);
      expect(text, f).not.toMatch(/from '\.\.\/(\.\.\/)?(data|engine|ui)\//);
    }
  });

  it('every file is under 400 lines', () => {
    for (const f of src) expect(readFileSync(f, 'utf8').split('\n').length, f).toBeLessThan(400);
  });
});
