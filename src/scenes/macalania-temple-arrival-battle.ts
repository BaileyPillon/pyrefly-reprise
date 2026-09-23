import { Vector3, type Group, type Mesh } from 'three';
import { makeLightPool } from '../engine/Lighting.ts';
import type { PaintedActor } from '../engine/PaintedActor.ts';
import type { ArrivalDirector, ArrivalStage } from '../engine/StageArrivals.ts';
import type { DepthRect } from '../engine/ScreenRects.ts';
import {
  ANIMA_ARRIVAL_CAMERA,
  ANIMA_ARRIVAL_MS,
  ANIMA_RISE_RENDER_ORDER,
  animaArrivalAt,
  animaRiseY,
  makeArrivalChains,
  makeFloorOccluder,
  type ArrivalChains,
} from './macalania-temple-arrival.ts';

// ---------------------------------------------------------------------------
// Anima's arrival in a REAL battle (FFX only)
// ---------------------------------------------------------------------------
//
// The same pure timeline the preview plays (`animaArrivalAt`), driven by the
// presenter's clock through `PaintedStage.arrive` instead of the debug
// screen's frame loop. Before this file the timeline was imported only by the
// preview, so in the game Anima was never staged at all: the engine revealed
// her at act two and the player fought an invisible boss (critic pass on
// 62b4927, CRITICAL 1).
//
// **What is built, and on whose word.** Bailey has NOT picked from the arrival
// options round (`docs/concepts/chapters/macalania/arrival/sheet.png`). This is
// the driver's recommendation, option A's staging with option B's name tag,
// recorded as INFERRED on its own tile in docs/target/targets.json ("built to
// the driver's recommendation A + B's tag, awaiting Bailey"), never approved.
//
// What differs from the preview, each for a reason:
// - **The Guardians' violet death is not drawn here.** In a real battle the
//   engine KOs every living Guardian before it reveals her
//   (`macalania-rules.ts#summonAnima`, research §5.2), and the presenter's own
//   `ko` beat has already taken them off the field when this starts.
// - **Seymour steps back relative to where the formation solver put him**, by
//   the preview's own offset (`SEYMOUR_STEP_BACK` minus his authored slot), and
//   greys by tint, not by `setDim`, because the targeting highlight owns
//   `setDim` and would put him back in the light on the first cursor move.
// - **B's tags are timed**, shown from `tagOn` for {@link TAG_HOLD_MS} and then
//   faded. A persistent "Cannot be targeted" belongs to the targeting HUD.

/** How long B's tags stay up after they land, in ms. */
export const TAG_HOLD_MS = 3200;

/** Seymour, stepped out of the light: a cool grey multiply on his painting. */
const STEPPED_BACK_TINT = 0x8d90a0;

/** One timeline step, in ms of the presenter's clock (about a frame at 60 Hz). */
const STEP_MS = 16;

/**
 * Anima's world height in a real battle, as a multiple of the stage's boss
 * height. The stage sizes every boss at `enemyHeight` (4.1 by default) and a
 * part at 0.55 of it, which made her the smallest figure on the field. She is
 * "towering" (research §9.4 note 1) and no source gives the Macalania model's
 * size, so this is a presentation estimate, labelled as one: taller than
 * Seymour, and still inside the `anima` rig's frame (checked in the browser).
 */
export const ANIMA_BATTLE_HEIGHT_RATIO = 1.2;

/** Concept B's tags, shared with the debug screen. */
export const MACALANIA_TAG_CSS = `
.mac-tag{position:fixed;pointer-events:none;z-index:40;transform:translate(-50%,-100%);transition:opacity .45s ease;opacity:0}
.mac-tag.is-on{opacity:1}
.mac-tag__plate{font:700 13px/1 var(--ig-font-display,system-ui,sans-serif);letter-spacing:.3em;text-transform:uppercase;
  padding:9px 14px;white-space:nowrap;background:rgba(10,14,24,.84);color:#c9ccd6;border:1px solid rgba(160,166,180,.35)}
.mac-tag--gold .mac-tag__plate{font:italic 700 26px/1 var(--ig-font-serif,Georgia,serif);letter-spacing:0;text-transform:none;
  color:#f3e7c4;background:transparent;border:0;border-bottom:2px solid #d9b45a;padding:4px 16px}
.mac-reticle{position:fixed;pointer-events:none;z-index:39;border:0;opacity:0;transition:opacity .45s ease}
.mac-reticle.is-on{opacity:1}
.mac-reticle i{position:absolute;width:22px;height:22px;border-color:rgba(170,176,190,.7);border-style:solid;border-width:0}
.mac-reticle i:nth-child(1){left:0;top:0;border-left-width:2px;border-top-width:2px}
.mac-reticle i:nth-child(2){right:0;top:0;border-right-width:2px;border-top-width:2px}
.mac-reticle i:nth-child(3){left:0;bottom:0;border-left-width:2px;border-bottom-width:2px}
.mac-reticle i:nth-child(4){right:0;bottom:0;border-right-width:2px;border-bottom-width:2px}
`;

/** The three DOM pieces of B's tag. */
export interface MacalaniaTags {
  root: HTMLElement;
  reticle: HTMLElement;
  seymour: HTMLElement;
  anima: HTMLElement;
  setOn(on: boolean): void;
  /** Place them from two screen boxes (viewport CSS px); a null box hides that tag. */
  place(seymour: BoxLike | null, anima: BoxLike | null): void;
}

/** Left, top, right, bottom in viewport CSS px. */
export interface BoxLike {
  l: number;
  t: number;
  r: number;
  b: number;
}

/** Build B's tags under `parent`. Browser only. */
export function mountMacalaniaTags(parent: HTMLElement): MacalaniaTags {
  const root = document.createElement('div');
  root.dataset['role'] = 'macalania-tags';
  root.innerHTML =
    `<style>${MACALANIA_TAG_CSS}</style>` +
    '<div class="mac-reticle"><i></i><i></i><i></i><i></i></div>' +
    '<div class="mac-tag"><div class="mac-tag__plate">Cannot be targeted</div></div>' +
    '<div class="mac-tag mac-tag--gold"><div class="mac-tag__plate">Anima</div></div>';
  parent.appendChild(root);
  const reticle = root.querySelector<HTMLElement>('.mac-reticle')!;
  const [seymour, anima] = [...root.querySelectorAll<HTMLElement>('.mac-tag')] as [HTMLElement, HTMLElement];
  return {
    root,
    reticle,
    seymour,
    anima,
    setOn(on): void {
      for (const el of [reticle, seymour, anima]) el.classList.toggle('is-on', on);
    },
    place(s, a): void {
      if (s) {
        const pad = 10;
        Object.assign(reticle.style, {
          left: `${s.l - pad}px`,
          top: `${s.t - pad}px`,
          width: `${s.r - s.l + pad * 2}px`,
          height: `${s.b - s.t + pad * 2}px`,
        });
        Object.assign(seymour.style, { left: `${(s.l + s.r) / 2}px`, top: `${s.t - pad - 8}px` });
      }
      // Concept B: her name sits low on her left flank, under a gold rule.
      if (a) Object.assign(anima.style, { left: `${a.l + (a.r - a.l) * 0.28}px`, top: `${a.t + (a.b - a.t) * 0.72}px` });
    },
  };
}

const boxOf = (r: DepthRect | null): BoxLike | null => (r ? { l: r.x, t: r.y, r: r.x + r.w, b: r.y + r.h } : null);

/** Anima's planes to `order` (the painted planes are the only 10s / 12s on her). */
function setPlaneOrder(actor: PaintedActor, order: number): void {
  actor.traverse((o) => {
    const m = o as Mesh;
    if (m.isMesh && (m.renderOrder === 10 || m.renderOrder === ANIMA_RISE_RENDER_ORDER)) m.renderOrder = order;
  });
}

/**
 * The director `buildMacalaniaTempleScene` publishes for `anima-macalania`.
 *
 * @param group the scene's own node: the occluder, the chains and the crack
 *   light are parented to it, and built only when the arrival plays, so the
 *   preview (which builds its own) is untouched.
 * @param seymourId whose tag reads "Cannot be targeted" and who steps back.
 * @param stepBack where the preview steps him to, and from which authored slot.
 */
export function makeAnimaArrivalDirector(
  group: Group,
  seymourId: string,
  stepBack: { to: [number, number, number]; fromSlot: number },
): ArrivalDirector {
  let chains: ArrivalChains | null = null;
  let occluder: Mesh | null = null;
  let crack: Mesh | null = null;

  const disposeProps = (): void => {
    chains?.dispose();
    chains = null;
    for (const m of [occluder, crack]) {
      if (!m) continue;
      m.removeFromParent();
      m.geometry.dispose();
      (m.material as { dispose(): void }).dispose();
    }
    occluder = null;
    crack = null;
  };

  return {
    worldHeight: (defaults) => defaults.enemy * ANIMA_BATTLE_HEIGHT_RATIO,

    async play(stage: ArrivalStage) {
      disposeProps();
      const anima = stage.actor;
      const height = anima.height;
      const at = anima.position.clone();
      const seymour = stage.other(seymourId);
      const home = seymour?.position.clone() ?? null;
      const authored = stage.enemySlot(stepBack.fromSlot);
      const away =
        home && authored
          ? home.clone().add(new Vector3(stepBack.to[0] - authored[0], 0, stepBack.to[2] - authored[2]))
          : null;

      chains = makeArrivalChains([at.x, 0, at.z], height);
      group.add(chains.group);
      crack = makeLightPool({ color: 0xa066ff, radius: 3.0, opacity: 0 });
      crack.position.set(at.x, 0.02, at.z + 0.3);
      group.add(crack);
      occluder = makeFloorOccluder();
      group.add(occluder);

      const tags = stage.overlayRoot && !stage.instant ? mountMacalaniaTags(stage.overlayRoot) : null;
      const fired = new Set<number>();

      const apply = (ms: number): void => {
        const s = animaArrivalAt(ms);
        ANIMA_ARRIVAL_CAMERA.forEach((c, i) => {
          if (ms < c.atMs || fired.has(i)) return;
          fired.add(i);
          if (stage.instant) stage.camera.snapTo(c.rig);
          else void stage.camera.moveTo(c.rig, c.ms, c.easing);
        });
        anima.position.y = animaRiseY(s.rise, height, 0);
        chains?.setGrow(s.chains);
        if (crack) (crack.material as { opacity: number }).opacity = 0.9 * s.crack;
        if (seymour && home && away) {
          seymour.position.lerpVectors(home, away, s.stepBack);
          const k = s.stepBack;
          const white = { r: 1, g: 1, b: 1 };
          const grey = { r: ((STEPPED_BACK_TINT >> 16) & 255) / 255, g: ((STEPPED_BACK_TINT >> 8) & 255) / 255, b: (STEPPED_BACK_TINT & 255) / 255 };
          const mix = (a: number, b: number): number => Math.round((a + (b - a) * k) * 255);
          seymour.setTint((mix(white.r, grey.r) << 16) | (mix(white.g, grey.g) << 8) | mix(white.b, grey.b));
        }
        if (s.occluding && occluder && !occluder.visible) occluder.visible = true;
        if (!s.occluding && occluder?.visible) {
          occluder.visible = false;
          setPlaneOrder(anima, 10);
          if (anima.shadow) anima.shadow.visible = true;
        }
        if (tags) {
          tags.setOn(s.tagOn);
          if (s.tagOn) tags.place(boxOf(stage.rect(seymourId)), boxOf(stage.rect(stage.id)));
        }
      };

      // She starts wholly under the ice, drawn after the depth-only floor.
      setPlaneOrder(anima, ANIMA_RISE_RENDER_ORDER);
      if (anima.shadow) anima.shadow.visible = false;
      anima.position.y = animaRiseY(0, height, 0);
      anima.setAlpha(1);

      if (stage.instant) {
        apply(ANIMA_ARRIVAL_MS.end);
      } else {
        // Control returns while the camera is still settling (the timeline's
        // own A5 beat); the tags' tail runs on after that, below.
        for (let t = 0; t < ANIMA_ARRIVAL_MS.controlReturns; t += STEP_MS) {
          apply(t);
          await stage.sleep(STEP_MS);
        }
        apply(ANIMA_ARRIVAL_MS.end);
      }

      let tagsGone = false;
      const dropTags = (): void => {
        if (tagsGone || !tags) return;
        tagsGone = true;
        tags.setOn(false);
        setTimeout(() => tags.root.remove(), 500);
      };
      if (tags) {
        const until = performance.now() + TAG_HOLD_MS;
        const follow = (): void => {
          if (tagsGone) return;
          if (performance.now() >= until) return dropTags();
          tags.place(boxOf(stage.rect(seymourId)), boxOf(stage.rect(stage.id)));
          requestAnimationFrame(follow);
        };
        requestAnimationFrame(follow);
      }

      // When she leaves the field (dismissed at 0 HP, act three), the chains go
      // with her and Seymour walks back into the light.
      return () => {
        dropTags();
        disposeProps();
        if (seymour && home) {
          void seymour.moveTo(home, 700);
          seymour.setTint(0xffffff);
        }
      };
    },

    dispose: disposeProps,
  };
}
