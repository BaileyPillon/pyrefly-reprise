/**
 * CAMERA LAB at release 39 (branch camera-lab-r39; a test harness): the shots a menu can lead to, which the art governor measures ahead of the
 * cut (`anticipate.ts`, `LabDirector.anticipate`), so the 3x and 4x masters of a close shot are resident when the cut lands.
 * Game case (rule 14): both games, as a test; FFX-2 never cuts under an open menu, so it asks for the action and enemy-turn shots only.
 */
import { describe, expect, it } from 'vitest';
import { likelyShots } from '../../src/engine/lab/anticipate.ts';
import type { GrammarContext } from '../../src/engine/lab/shotChoice.ts';
import type { ShotKind } from '../../src/engine/lab/LabTypes.ts';

const ctx = (over: Partial<GrammarContext> = {}): GrammarContext => ({ game: 'ffx', style: 'clair', targetCut: true, bossId: 'seymour', allPartyRear: false, ...over });
const input = { actorId: 'tidus', enemies: ['seymour', 'mortiorchis'], party: ['tidus', 'yuna', 'kimahri'] } as const;
const kinds = (list: ReturnType<typeof likelyShots>): ShotKind[] => list.map((s) => s.kind);

describe('camera lab: the shots a menu can lead to', () => {
  it('FFX, Clair Obscur: the skill list, a target cut on each enemy, the action shots and the enemy turns', () => {
    const list = likelyShots('ffx', input, ctx());
    const k = kinds(list);
    expect(k).toContain('hero-close');
    expect(list.filter((s) => s.kind === 'target').map((s) => s.subject)).toEqual(['seymour', 'mortiorchis']);
    for (const need of ['lunge-side', 'caster-low', 'item-close', 'impact-wide', 'enemy-front', 'colossus'] as const) expect(k).toContain(need);
    // each shot once
    const keys = list.map((s) => `${s.kind}|${s.subject}|${s.target}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('FFX, Persona keeps its frame under the list and the target: no hero-close, no target cut', () => {
    const k = kinds(likelyShots('ffx', input, ctx({ style: 'persona' })));
    expect(k).not.toContain('hero-close');
    expect(k).not.toContain('target');
    expect(k).toContain('lunge-side');
  });

  it('TARGET CUT off asks for no target shot', () => {
    expect(kinds(likelyShots('ffx', input, ctx({ targetCut: false })))).not.toContain('target');
  });

  it('FFX-2 asks for the action and enemy-turn shots only: it never cuts under an open menu (D-316)', () => {
    const k = kinds(likelyShots('ffx2', { ...input, actorId: 'yuna', enemies: ['bahamut'] }, ctx({ game: 'ffx2', bossId: 'bahamut' })));
    expect(k).not.toContain('hero-close');
    expect(k).not.toContain('target');
    for (const need of ['lunge-side', 'caster-low', 'impact-wide', 'enemy-front', 'colossus'] as const) expect(k).toContain(need);
  });

  it('with every party figure able to show her back the enemy turn is the Clair Obscur shot behind the party', () => {
    expect(kinds(likelyShots('ffx2', { ...input, actorId: 'yuna', enemies: ['bahamut'] }, ctx({ game: 'ffx2', bossId: 'bahamut', allPartyRear: true })))).toContain('enemy-behind-party');
  });

  it('no enemy standing: only what the actor itself can ask for, never a throw', () => {
    expect(() => likelyShots('ffx', { actorId: 'tidus', enemies: [], party: ['tidus'] }, ctx())).not.toThrow();
    expect(kinds(likelyShots('ffx', { actorId: 'tidus', enemies: [], party: ['tidus'] }, ctx()))).toEqual(['hero-close']);
  });
});
