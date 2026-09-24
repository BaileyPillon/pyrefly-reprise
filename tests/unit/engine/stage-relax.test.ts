/**
 * The measured relaxation (`src/engine/StageRelax.ts`): the shared party/fiend
 * step every scene has always had, the `holdParty` switch Chapters 1-3 use
 * (PR-0002 A, D-041; FFX only), and the pinned/figure-less `fixed` actors
 * (Vegnagun's body and parts, D-044; FFX-2 only). Plumbing is both games.
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import {
  relaxActorsOf,
  relaxField,
  type RelaxActor,
  type RelaxField,
} from '../../../src/engine/StageRelax.ts';
import type { DepthRect } from '../../../src/engine/ScreenRects.ts';
import type { SceneSlots } from '../../../src/scenes/index.ts';

function camera(): PerspectiveCamera {
  const c = new PerspectiveCamera(32, 16 / 9, 0.1, 100);
  c.position.set(0, 2, 10);
  c.lookAt(0, 1, 0);
  c.updateMatrixWorld(true);
  return c;
}

/** A field whose screen rectangles follow each actor's world x (100 px a unit). */
function field(
  actors: Record<string, RelaxActor & { w: number; depth: number }>,
  slots: Partial<SceneSlots> = {},
  panels: RelaxField['panels'] = [],
): RelaxField {
  const map = new Map(Object.entries(actors));
  return {
    actors: map,
    rects: () => {
      const out = new Map<string, DepthRect>();
      for (const [id, a] of map) {
        out.set(id, { x: 800 + a.actor.position.x * 100 - a.w / 2, y: 300, w: a.w, h: 300, depth: a.depth });
      }
      return out;
    },
    panels,
    camera: camera(),
    canvasW: 1600,
    slots: { party: [[-2, 0, 1], [0, 0, 0], [-1, 0, -1]], enemy: [[2, 0, -4], [4, 0, -6]], ...slots },
  };
}

const at = (x: number, z = 0) => ({ position: new Vector3(x, 0, z) });

describe('relaxField', () => {
  it('shares the step between a party member and the fiend behind her (the default, as before 49789dd6)', () => {
    const yuna = at(0.2, 1.5);
    const boss = at(0.4, -4);
    const f = field({
      yuna: { kind: 'party', actor: yuna, w: 200, depth: 8 },
      boss: { kind: 'enemy', actor: boss, w: 220, depth: 14 },
    });
    relaxField(f, 14);
    expect(yuna.position.x).toBeLessThan(0.2);
    expect(boss.position.x).toBeGreaterThan(0.4);
  });

  it('holdParty: neither the party member nor the fiend behind her moves', () => {
    const yuna = at(0.2, 1.5);
    const boss = at(0.4, -4);
    const f = field(
      {
        yuna: { kind: 'party', actor: yuna, w: 200, depth: 8 },
        boss: { kind: 'enemy', actor: boss, w: 220, depth: 14 },
      },
      { holdParty: true },
    );
    expect(relaxField(f, 14)).toBe(true);
    expect(yuna.position.x).toBe(0.2);
    expect(boss.position.x).toBe(0.4);
  });

  it('holdParty still separates two fiends, and never moves a party member for a panel', () => {
    const tidus = at(-2, 1.5);
    const a = at(2.0, -4);
    const b = at(2.1, -6);
    const f = field(
      {
        tidus: { kind: 'party', actor: tidus, w: 200, depth: 8 },
        a: { kind: 'enemy', actor: a, w: 200, depth: 12 },
        b: { kind: 'enemy', actor: b, w: 200, depth: 14 },
      },
      { holdParty: true },
      [{ x: 0, y: 0, w: 700, h: 900 }],
    );
    relaxField(f, 14);
    expect(tidus.position.x).toBe(-2);
    expect(Math.abs(b.position.x - a.position.x)).toBeGreaterThan(0.1);
  });

  it('a fixed actor (pinned or figure-less) is never moved and never shoves anyone', () => {
    const paine = at(0.3, -1);
    const body = at(0.5, -9);
    const f = field({
      paine: { kind: 'party', actor: paine, w: 150, depth: 10 },
      body: { kind: 'enemy', actor: body, w: 500, depth: 18, fixed: true },
    });
    relaxField(f, 14);
    expect(body.position.x).toBe(0.5);
    expect(paine.position.x).toBe(0.3);
  });

  it("relaxActorsOf marks figure-less parts and pinned fiends fixed, and keeps a part's machine", () => {
    const staged = new Map([
      ['tidus', { kind: 'party' as const, actor: at(0, 1) }],
      ['body', { kind: 'enemy' as const, actor: at(7, -10), pinned: true }],
      ['bulwark-l', { kind: 'enemy' as const, actor: at(8, -10), anchor: {}, parentId: 'body' }],
      ['leg', { kind: 'enemy' as const, actor: at(3, -6), parentId: 'tail' }],
    ]);
    const out = relaxActorsOf(staged);
    expect(out.get('tidus')).toEqual({ kind: 'party', actor: staged.get('tidus')!.actor, fixed: false });
    expect(out.get('body')!.fixed).toBe(true);
    expect(out.get('bulwark-l')!.fixed).toBe(true);
    expect(out.get('bulwark-l')!.parentId).toBe('body');
    expect(out.get('leg')).toMatchObject({ fixed: false, parentId: 'tail' });
    expect(out.get('body')!.actor).toBe(staged.get('body')!.actor);
  });
});
