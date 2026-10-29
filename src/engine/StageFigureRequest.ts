/**
 * What the stage asks of `PaintedActor` for one combatant, as a pure function (lane "prebuild", 2026-10-24; both games, shared presentation plumbing; no game number or rule moves).
 *
 * `PaintedStage.add` used to compute this inline, from the stage's own options. The demo's fight prebuild (`app/demo/prebuildFigures.ts`) builds the figures of a fight BEHIND the title and the picker and
 * parks them (`FigureCache.ts`); for the battle's own `add` to find the parked figure it must ask the SAME question, so the question is one function that both call: the same inputs give the same request, and a
 * fingerprint of the request says whether a parked figure answers it. Nothing here builds a figure, reads the DOM or touches three: it returns options.
 *
 * Layering: no DOM, no `three` (rule 1). The options hold functions (the placeholder painters); the fingerprint leaves them out.
 */
import type { AnyCombatant, GameId } from '../battle/common/types.ts';
import type { SceneSlots } from '../scenes/index.ts';
import { worldHeightFor } from './BattlePresenterArt.ts';
import { departurePoses } from './BattlePresenterDepartures.ts';
import { figureHeight, partyStature, sceneOwnHeight } from './PartyStature.ts';
import { anchorFor, type PartAnchor } from './PartAnchors.ts';
import * as SA from './StageAnchors.ts';
import { bodyFacingOption, figureLightOf, poseScalingOf } from './StageFacing.ts';
import { edgeFeatherFor } from './ActorEdgeFeather.ts';
import { paintBossSilhouette, paintPlaceholderFigure } from './ProceduralArt.ts';
import { figureBloomMasked } from './BloomMask.ts';
import { contactShadowStyle } from './ContactShadow.ts';
import { figureStreamCeilingMs } from './LoadDiet.ts';
import type { FigureRequest } from './rig/RigStage.ts';

/** The part of the stage this reads: its scene's slots and ground, the rim and rig switches, the game of the state it last staged. */
export interface FigureEnv {
  readonly slots: SceneSlots;
  readonly rim?: { color: number | string; dir: [number, number] } | undefined;
  readonly rigs?: (() => boolean) | undefined;
  readonly groundLuma: number | null;
  /** `lastState?.game` of the stage (the party's stature is a FFX-only rule). */
  readonly game: GameId | undefined;
}

/** The resolved painting of a combatant (`BattlePresenterArt.resolveArt`). */
export interface ResolvedArt {
  readonly artId: string;
  readonly poses: Readonly<Record<string, string>>;
}

export interface FigureSpec {
  readonly request: FigureRequest;
  readonly kind: 'party' | 'enemy';
  readonly artId: string;
  readonly poses: Readonly<Record<string, string>>;
  readonly size: ReturnType<typeof figureHeight>;
  readonly anchor: PartAnchor | undefined;
  /** The shared-height world height of this combatant (before the scene's own heights), which the framing plan reads. */
  readonly shared: number;
  /** The question asked, as a string: equal strings are equal requests. */
  readonly fingerprint: string;
}

/** Stable per-id seed so a placeholder figure looks the same every boot. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 997;
}

function shadowOf(groundLuma: number | null): { opacity: number; color: number } {
  const s = contactShadowStyle(groundLuma);
  return { opacity: s.opacity, color: s.color };
}

/** The kind the stage draws a combatant as. */
export function figureKind(c: Pick<AnyCombatant, 'side'>): 'party' | 'enemy' {
  return c.side === 'enemy' ? 'enemy' : 'party';
}

/** The request for `c`, whose art has been resolved: exactly what `PaintedStage.add` asks `tryRigFigure` / `PaintedActor.create` for. */
export function figureSpec(env: FigureEnv, c: AnyCombatant, art: ResolvedArt, worldHeight?: number): FigureSpec {
  const kind = figureKind(c);
  const { artId } = art;
  const poses = departurePoses(c.id, art.poses); // D-031 Evrae
  const heights = { party: env.slots.partyHeight ?? 1.82, enemy: env.slots.enemyHeight ?? 4.1 };
  const own = sceneOwnHeight(env.slots, c.id, artId); // a scene's per-combatant height, else the height of the form this painting is (`SceneStaging.formHeights`); ring and shadow follow it
  const shared = worldHeightFor(c, heights);
  // r3941-heights (FFX only): a hero stands at his own height next to Tidus's (`PartyStature.ts`); the shadow and the ring follow it.
  const size = figureHeight({ shared, own, given: worldHeight, stature: partyStature(env.game, c.side, c.id) });
  const k = size.ringScale;
  const anchor = anchorFor(env.slots.partAnchors, c.id);
  const ceiling = figureStreamCeilingMs({ startsDown: !c.alive, filmKeys: env.slots.poseCut === true }); // load diet: 0 for a figure the stream would serve wrongly (staged down; FF7's film keys)
  const request: FigureRequest = {
    id: c.id,
    artId,
    poses,
    ...(env.rigs ? { setting: env.rigs } : {}),
    opts: {
      name: c.id,
      ...(anchor ? SA.anchoredActorOptions(anchor) : {}),
      // The *body's* facing, from the side: party and aeons toward +x, enemies toward -x, unless the scene
      // turns them (FF7, `sideFacing`). Mirroring is a separate question, answered by each pose's sidecar;
      // art painted the way its body faces is drawn exactly as painted.
      ...bodyFacingOption(env.slots.sideFacing, c.side === 'enemy' ? 'enemy' : c.side === 'aeon' ? 'aeon' : 'party'),
      worldHeight: anchor ? SA.anchoredHeight(anchor) : size.height,
      crossfadeMs: env.slots.poseCut ? 0 : kind === 'party' ? 120 : 140, // FF7: a hard cut between its painted keys
      ...(ceiling > 0 ? { streamCeilingMs: ceiling } : {}), // load diet: the opening poses are waited for, the others for at most the ceiling and then stream in (`LoadDiet.ts`; `?loaddiet=off` waits for all)
      ...(env.slots.poseShiftPx?.[artId] ? { poseShiftPx: env.slots.poseShiftPx[artId] } : {}), // FF7: every key on the idle's stance
      poses,
      placeholder:
        kind === 'party'
          ? (): HTMLCanvasElement => paintPlaceholderFigure({ seed: hash(c.id), tint: '#6a7386' })
          : (): HTMLCanvasElement => paintBossSilhouette({ seed: hash(c.id) }),
      placeholderBaseline: kind === 'party' ? 0.965 : 0.985,
      matte: { mode: 'auto' },
      ...edgeFeatherFor(artId), // PR-0164 / PR-0212: paintings that touch their canvas edge
      rim: env.rim ? { color: env.rim.color, strength: 0.8, dir: env.rim.dir, width: 3.4 } : { strength: 0.7 },
      ...figureLightOf(env.slots.figureLight), // FF7: the core's green rim and bounce, the fringe trimmed
      groundShade: 0.24,
      ...poseScalingOf(env.slots), // FF7's long machine and upright keys (scene switches)
      bloomMask: figureBloomMasked(env.slots.figureBloomMaskArt, artId),
      shadow: anchor ? false : { radius: (kind === 'party' ? 0.62 : 1.5) * k, ...shadowOf(env.groundLuma) },
      breathe: { amplitude: 0.016, speed: 0.4 },
      sway: { amplitude: 0.009, speed: 0.22 },
      // The turn highlight: gold under a party member, a cooler ring under a
      // fiend, so whose turn it is reads even in a screenshot.
      turnRing:
        env.slots.turnRings === false
          ? false
          : {
              // FF7: no ring, its triangle marks the turn (scene switch)
              color: kind === 'party' ? 0xf0cf92 : 0xc8a0ff,
              radius: anchor ? SA.anchoredRingRadius(anchor) : (kind === 'party' ? 0.78 : 1.7) * k,
              opacity: kind === 'party' ? 0.85 : 0.7,
            },
    },
  };
  return { request, kind, artId, poses, size, anchor, shared, fingerprint: fingerprintOf(request, c, env.rigs?.() !== false) };
}

/** The request as a string: its options without their functions, the combatant's side and slot (the parking place is the figure's id, so the fingerprint need not repeat it), and the rig switch as it reads now. */
function fingerprintOf(request: FigureRequest, c: AnyCombatant, rigsOn: boolean): string {
  return JSON.stringify({ a: request.artId, p: request.poses, o: request.opts, s: c.side, rigs: rigsOn }, (_k, v) => (typeof v === 'function' ? undefined : v));
}
