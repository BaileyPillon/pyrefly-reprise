/**
 * rigs-v2 (2026-10-29; Tidus FFX only, Rikku Dark Knight FFX-2 only): the two party configs the new pilots are cut from (`tools/rig/subjects/<id>-v2.json`) agree with the engine's switch (`PARTY_RIG_SUBJECTS`: the
 * rig subject, the game), with the keypoints they read, and with the key changes `move_audit.py` replays. Files only: no art, no Python, no browser.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PARTY_RIG_SUBJECTS } from '../../../src/engine/motion/PartyRigsSwitch.ts';
import { ROOT } from './pose-gate-fixtures.ts';

interface Party {
  keypoints: string;
  poses: string[];
  order: string[];
  parts: Record<string, { fx?: boolean; skin: { type: string } }>;
  key_motion: Record<string, { ms: number; fadeMs: number }>;
  idle_key: { ms: number; fadeMs: number };
  underlap: number;
  underlap_idle: number;
  fx?: Record<string, unknown>;
}
interface Config {
  subject: string;
  scale: number;
  costume: { pose: string };
  party: Party;
}

const read = <T>(rel: string): T => JSON.parse(readFileSync(join(ROOT, rel), 'utf8')) as T;
const AUDIT = readFileSync(join(ROOT, 'tools/rig/lane/party/move_audit.py'), 'utf8');

describe.each([
  ['tidus', 'tidus-v2', 'tidus-x', 'ffx'],
  ['rikku-dark-knight', 'rikku-dark-knight-v2', 'rikku-dark-knight-x', 'ffx2'],
])('%s: the v2 config (%s)', (subject, name, first, game) => {
  const cfg = read<Config>(`tools/rig/subjects/${name}.json`);
  const kp = read<Record<string, Record<string, number[]>>>(cfg.party.keypoints);
  const pilot = read<Config>(`tools/rig/subjects/${first}.json`);

  it('is the subject the engine\'s switch names, for the game the switch names', () => {
    expect(cfg.subject).toBe(subject);
    expect(Object.hasOwn(PARTY_RIG_SUBJECTS, cfg.subject)).toBe(true);
    expect(PARTY_RIG_SUBJECTS[cfg.subject]).toBe(game);
  });

  it('reads the first pilot\'s keypoints (the paintings\' geometry is the same: only the colour changed), and every pose it cuts has points', () => {
    expect(cfg.party.keypoints).toBe(pilot.party.keypoints);
    expect(existsSync(join(ROOT, cfg.party.keypoints))).toBe(true);
    expect(Object.keys(kp)).toContain('idle');
    for (const p of cfg.party.poses) expect(Object.keys(kp), p).toContain(p);
  });

  it('gives every key its move: a length, and a cut (fadeMs 0: two paintings\' pieces never cross-fade into soup)', () => {
    for (const p of cfg.party.poses) {
      const m = cfg.party.key_motion[p];
      expect(m, p).toBeDefined();
      expect(m!.ms, p).toBeGreaterThan(0);
      expect(m!.ms, p).toBeLessThanOrEqual(600);
      expect(m!.fadeMs, p).toBe(0);
    }
    expect(cfg.party.idle_key.fadeMs).toBe(0);
  });

  it('overlaps the pieces of a pose 28 px under their neighbours and keeps the idle\'s own pieces at 5: at 10 the pieces enclose joints, the gate watches them and refuses the rig (experiment tidus-v2y)', () => {
    expect(cfg.party.underlap).toBe(28);
    expect(cfg.party.underlap_idle).toBeLessThanOrEqual(8);
  });

  it('keeps the draw order a partition of its parts, and the effects part (a painted ring and swirl that are no body part) only for Tidus', () => {
    expect([...cfg.party.order].sort()).toEqual(Object.keys(cfg.party.parts).sort());
    const fx = Object.entries(cfg.party.parts).filter(([, p]) => p.fx).map(([n]) => n);
    expect(fx).toEqual(subject === 'tidus' ? ['fx'] : []);
  });

  it('never asks the audit for a key the config does not cut, and never for a pose the chapter does not play (FFX-2 has no victory in Chapter IV and no Defend row)', () => {
    const lines = AUDIT.split('\n').filter((l) => l.trim().startsWith(`"${game}":`));
    expect(lines.length).toBe(1);
    const pairs = lines[0]!.slice(lines[0]!.indexOf('"', lines[0]!.indexOf(':')) + 1).split('"')[0]!.split(',');
    const keys = new Set(['idle', ...cfg.party.poses]);
    for (const pair of pairs) for (const k of pair.split('>')) expect(keys.has(k), `${pair}: ${k}`).toBe(true);
    if (game === 'ffx2') expect(pairs.join(',')).not.toMatch(/victory|defend/);
    if (game === 'ffx') expect(pairs).toEqual(expect.arrayContaining(['idle>ready', 'ready>attack', 'attack>follow', 'follow>idle', 'hurt>ko', 'idle>defend']));
  });
});
