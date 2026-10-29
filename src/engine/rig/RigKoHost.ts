/**
 * WHAT A POSE-DRAWN RIG TELLS THE KNOCK-OUT RUN (rigs-v3, 2026-10-29; both games, shared plumbing; pure: no `three`, no DOM).
 *
 * The painting set's KO is one continuous fall (`KoFall.ts`, run by `fx/mix/living.ts`): the standing painting tips about its toe edge toward the side the lying painting's head lies, up to
 * 80 degrees, slides until the two heads meet, and the lying painting takes over from there (a 75 ms cross, a cut inside the smear window, under a dust puff); a revive plays it backwards and the
 * body stands up. A rig drawn by pose (a part's image per key: `RigFold.ts`) had none of it: the carrier loads only the idle painting, so the run saw one plane and played nothing (`koMode`: `samePlane`
 * is a cut), and the rig's own `ko` key move turned the pieces of the standing pose to 45 degrees, cut to the lying drawing at the half way, left it hanging 40 px over the floor and let it down
 * (the clips of 2026-10-29: "the rig lands in about 3 frames by a cut from standing to lying").
 *
 * The rig's parts hang under the idle plane's group, which copies the idle plane's mesh every frame (`RigFigure.sync`: "a KO's topple, a prone lay"), so a tip the run puts on the idle plane turns the
 * rig's standing pieces with it. What was missing is the lying half: the run needs the lying BODY's head and span, and a way to change the rig's key at the cut instead of at the start. That is this:
 * {@link RigKoHost}, handed to the run by `RigActor.rigKo` for a figure whose `ko` key draws the lying painting's pieces ({@link drawsKoByPose}).
 */
import type { RigData } from './RigData.ts';
import { compileKey } from './RigKeys.ts';
import { RigSkeleton } from './RigSkeleton.ts';
import { readSilhouettes } from './RigSilhouette.ts';

/** The lying key's body in the idle plane's own fractions (u across from the left, t down from the top). */
export interface RigKoLying {
  /** The head's box, the size of the standing head's, centred on the lying key's head landmark; undefined with no head landmark (the run then meets middle to middle). */
  head: [number, number, number, number] | undefined;
  /** The painted span of the lying key (the gate's box), 0..1 across the plane. */
  u0: number;
  u1: number;
}

export interface RigKoHost {
  /** The lying key's body, for a standing head box (`PoseMeta.head` of the idle painting) or undefined. */
  lying(standHead: readonly [number, number, number, number] | undefined): RigKoLying;
  /** The key a request for `name` resolves to, or null for a name the rig knows nothing of (it stays as it is). */
  keyFor(name: string): string | null;
  /** The rig's key goes to `key` NOW: no life layer, no move between two keys, the parts flip and the bones snap (the cut of the fall; the first frame of a standing key in a revive). */
  flip(key: string): void;
}

/** The names a rig gives its head landmark, best first (the harness's own list: `critic/runner/lib/continuity-rig.mjs` RIG_DEFAULTS). */
const HEAD_NAMES = ['headCenter', 'head'] as const;

/** True when the `ko` key shows the lying painting's pieces: at least three parts swap to an image of their own for it (a bone-only fall, Lulu's, is not this: the idle's pieces bent). */
export function drawsKoByPose(data: Pick<RigData, 'keys'>): boolean {
  const parts = data.keys.get('ko')?.parts;
  return parts !== undefined && Object.values(parts).filter((p) => p.show !== false && p.image !== undefined).length >= 3;
}

/**
 * The host of a rig, or null when its `ko` key is not drawn by pose. `keyFor` and `flip` are the actor's (`RigActor.moveKey` with `immediate`); the lying head is a landmark of the `ko` key
 * posed on a skeleton of its own, solved once, so the run never touches the one the figure is drawn from.
 */
export function makeRigKoHost(data: RigData, keyFor: (name: string) => string | null, flip: (key: string) => void): RigKoHost | null {
  if (!drawsKoByPose(data)) return null;
  const ko = data.keys.get('ko')!;
  let head: { x: number; y: number } | null | undefined;
  const headOf = (): { x: number; y: number } | null => {
    if (head !== undefined) return head;
    const sk = new RigSkeleton(data);
    sk.solve(compileKey(data, ko));
    head = null;
    for (const n of HEAD_NAMES) {
      const p = sk.landmark(n);
      if (p) {
        head = { x: p.x, y: p.y };
        break;
      }
    }
    return head;
  };
  const box = readSilhouettes(data.gate).get('ko')?.box;
  const { w, h } = data.image;
  return {
    lying(standHead): RigKoLying {
      const p = headOf();
      const hu = p ? p.x / w : undefined;
      const ht = p ? p.y / h : undefined;
      const hw = standHead ? standHead[2] - standHead[0] : 0.1;
      const hh = standHead ? standHead[3] - standHead[1] : 0.06;
      const span: [number, number] = box ? [box[0] / w, box[2] / w] : hu !== undefined ? [hu - 0.25, hu + 0.25] : [0.25, 0.75];
      return {
        head: hu !== undefined && ht !== undefined ? [hu - hw / 2, ht - hh / 2, hu + hw / 2, ht + hh / 2] : undefined,
        u0: span[0],
        u1: span[1],
      };
    },
    keyFor,
    flip,
  };
}
