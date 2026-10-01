/**
 * Who a cutscene can stand on its stage, and where.
 *
 * `CutsceneScreen` is a painted backdrop behind the dialogue box: no 3D scene,
 * no presenter. Most of the `showActor` steps the chapter scripts carry were
 * written for a stage that did not exist here, and standing every one of those
 * figures up would change six chapters' scenes at once, with paintings that
 * were never approved for a cutscene. So a figure only appears in a cutscene
 * when it has an entry in {@link CUTSCENE_FIGURES}; a `showActor` for anyone
 * else stays the no-op it has always been, and a `hideActor` only ever acts on
 * a figure that is on stage.
 *
 * **Game case: both** for the mechanism (shared plumbing, CHK-020); each entry
 * says its own case.
 *
 * Placement is in fractions of the screen, one set for a landscape window and
 * one for a portrait one (a phone), because the dialogue box sits in different
 * places in the two and a figure must never stand behind it.
 */

import type { Step } from '../../story/dsl.ts';

/** Where a figure stands, in fractions of the stage. */
export interface FigurePlacement {
  /** Centre of the figure, 0 (left edge) to 1 (right edge). */
  x: number;
  /** The feet line, 0 (top) to 1 (bottom). */
  feet: number;
  /** Height of the whole painting, as a fraction of the stage height. */
  height: number;
}

export interface CutsceneFigure {
  /** Painting under `public/`, via `artUrl`. */
  art: string;
  /** Painting width / height, from its sidecar JSON. */
  aspect: number;
  /** The sidecar's `baselineY / height`: where the feet are inside the painting. */
  baseline: number;
  /** Which way the painting faces: 1 = right, -1 = left (the DSL's `facing`). */
  artFacing: 1 | -1;
  landscape: FigurePlacement;
  portrait: FigurePlacement;
  /** An unsent figure drifts slightly and carries the cool pyrefly glow. */
  unsent?: boolean;
  /**
   * No painting kneels or falls, so `setPose(actor, 'kneel' | 'ko')` stages the standing one
   * instead of leaving it upright over words that say otherwise (PR-0244): `kneel` lowers and
   * dims it, `ko` lays it down on the floor, dimmer still, as the battle's KO pose does.
   * Any other pose leaves it standing. Absent: `setPose` does nothing here, as it always did.
   * A pose with its own painting ({@link poses}, installed and listed in the manifest) wins over this.
   */
  stagesUnpaintedPoses?: boolean;
  /**
   * Paintings of its own for the story poses (D-301): `setPose(actor, pose)` shows one when the art
   * manifest lists it, and falls back to the staging above (or to standing) when it does not.
   */
  poses?: Partial<Record<StoryPose, PosePainting>>;
}

/** The story poses a cutscene figure can have a painting for. */
export type StoryPose = 'kneel' | 'ko';

/**
 * A figure's own painting for a story pose, from its sidecar (`public/art/characters/<id>/<pose>.json`). It stands
 * on the figure's own feet line and centre, so a kneel sinks where he stood and a fall lies there.
 */
export interface PosePainting {
  /** Painting under `public/`, via `artUrl`. */
  art: string;
  /** Painting width / height. */
  aspect: number;
  /** The sidecar's `baselineY / height`: the row that meets the floor. */
  baseline: number;
  /**
   * The painting's height as a multiple of the idle painting's on the same stage: its pixel height times the
   * sidecar's measured `scale` (head match inside the stature gate), over the idle's pixel height. The battle
   * sizes every pose at the idle's pixel scale times that `scale` the same way (`PaintedScale.ts`).
   */
  heightOfIdle: number;
  /**
   * Where its centre goes instead of the figure's `x`, per orientation, when the painting at the figure's own `x`
   * would lie behind the dialogue box (a kneel or a fall is lower and wider than the standing figure). The feet line
   * is always the figure's own.
   */
  landscapeX?: number;
  portraitX?: number;
}

export const CUTSCENE_FIGURES: Readonly<Record<string, CutsceneFigure>> = {
  /**
   * Lady Ginnem, unsent (FFX only: Chapter IX). Her battle idle
   * (`public/art/characters/ginnem/idle.png`, the O-3 B pyrefly-edged painting,
   * D-060), 757 x 1164 with the feet at y 1100. She stays on the field after
   * the recall until Yuna sends her in the post scene (D-076).
   *
   * Landscape: right of the dialogue box, on the chamber floor, facing left
   * toward the party. Portrait: centred, feet above the box.
   */
  ginnem: {
    art: 'art/characters/ginnem/idle.png',
    aspect: 757 / 1164,
    baseline: 1100 / 1164,
    artFacing: -1,
    landscape: { x: 0.8, feet: 0.9, height: 0.58 },
    portrait: { x: 0.5, feet: 0.74, height: 0.44 },
    unsent: true,
  },
  /**
   * Trema, unsent (FFX-2 only: Chapter XIII). His battle idle, the installed O-1 A painting
   * (`public/art/characters/trema/idle.png`, 816 x 1167, feet at y 1144; TR18 LOCKED). He is
   * revealed in the pre scene when the chapter has no Paragon link (option 2), and in the post
   * scene he answers Yuna and fades away (`research/ffx2-trema.md` §2 step 4).
   *
   * Landscape: right of the dialogue box, facing left toward the party. Portrait: centred,
   * feet above the box.
   */
  trema: {
    art: 'art/characters/trema/idle.png',
    aspect: 816 / 1167,
    baseline: 1144 / 1167,
    artFacing: -1,
    landscape: { x: 0.8, feet: 0.9, height: 0.6 },
    portrait: { x: 0.5, feet: 0.74, height: 0.46 },
    unsent: true,
  },
  /**
   * Seymour Omnis, unsent (FFX only: Chapter XII). His battle idle, the installed O-1 A painting
   * (`public/art/characters/seymour-omnis/idle.png`, 864 x 1229, the hem at y 1212; locked). He
   * hovers at the top of the steps in the pre scene, and in the post scene Yuna sends him
   * (`research/ffx-seymour-omnis.md` §4.6, verified: 2 sources).
   *
   * Landscape: right of the dialogue box, facing left toward the party. Portrait: centred, the
   * hem above the box.
   */
  'seymour-omnis': {
    art: 'art/characters/seymour-omnis/idle.png',
    aspect: 864 / 1229,
    baseline: 1212 / 1229,
    artFacing: -1,
    landscape: { x: 0.78, feet: 0.9, height: 0.66 },
    portrait: { x: 0.5, feet: 0.74, height: 0.46 },
    unsent: true,
  },
  /**
   * Seymour Natus, unsent (FFX only: Chapter X). His battle idle, the installed O-1 A painting
   * (`public/art/characters/seymour-natus/idle.png`, 693 x 1165, feet at y 1148; judge-locked
   * set chapter:natus). He stands up from the attendants' pyreflies in the pre scene (research
   * §8.2 beat 8). Painted near-frontal (`facing: front`, never mirrored): `artFacing` -1 with the
   * script's `facing: -1` draws it as painted. The ring layer is the battle stage's, not here.
   *
   * Landscape: right of the dialogue box, facing the party. Portrait: centred, feet above the box.
   */
  'seymour-natus': {
    art: 'art/characters/seymour-natus/idle.png',
    aspect: 693 / 1165,
    baseline: 1148 / 1165,
    artFacing: -1,
    landscape: { x: 0.8, feet: 0.9, height: 0.62 },
    portrait: { x: 0.5, feet: 0.74, height: 0.46 },
    unsent: true,
  },
  /**
   * Isaaru, living (FFX only: Chapter XIV). His battle idle, the O-1 A painting
   * (`public/art/characters/isaaru/idle.png`, 744 x 1188, feet at y 1171;
   * judge-locked, used as installed). He waits at the chamber's far end in the
   * pre scene and kneels on the same spot in the post scene
   * (`research/ffx-isaaru-bevelle.md` §8.2 beats 5 and 7).
   *
   * Landscape: right of the dialogue box, facing left toward Yuna. Portrait:
   * centred, feet above the box. Not unsent: no drift, no pyrefly glow.
   */
  isaaru: {
    art: 'art/characters/isaaru/idle.png',
    aspect: 744 / 1188,
    baseline: 1171 / 1188,
    artFacing: -1,
    landscape: { x: 0.78, feet: 0.9, height: 0.56 },
    portrait: { x: 0.5, feet: 0.74, height: 0.44 },
    // D-301: the approved kneel (cand-9, 715 x 762, floor at 746, scale 0.96). Without it he stands, as before.
    poses: { kneel: { art: 'art/characters/isaaru/kneel.png', aspect: 715 / 762, baseline: 746 / 762, heightOfIdle: (762 * 0.96) / 1188 } },
  },
  /**
   * Seymour, living (FFX only: Chapter VII, PR-0244). His battle idle, the approved painting
   * (`public/art/characters/seymour-macalania/idle.png`, 804 x 1191, feet at y 1175; locked as
   * `chapter:macalania:2026-09-25`, used as installed). He stands on the plate from the post
   * scene's first frame, so the tally and the silent kill are not an empty temple; the kneel and the
   * fall have no painting, so the stage lowers, then lays down, the standing one under the captions
   * (`stagesUnpaintedPoses`), and he goes when the Guado take the body
   * (research ffx-seymour-anima-macalania.md §9.7 beats 9-10). The pre scene never stands him.
   *
   * Landscape: right of the dialogue box, facing left toward the party. Portrait: centred, feet
   * above the box. Not unsent: no drift, no pyrefly glow (he is not sent, §9.7 beat 11).
   */
  'seymour-macalania': {
    art: 'art/characters/seymour-macalania/idle.png',
    aspect: 804 / 1191,
    baseline: 1175 / 1191,
    artFacing: -1,
    landscape: { x: 0.8, feet: 0.9, height: 0.62 },
    portrait: { x: 0.5, feet: 0.74, height: 0.46 },
    stagesUnpaintedPoses: true,
    // D-301: the approved kneel (cand-6, 681 x 651, floor at 635, scale 1.13) and fall (the prone canvas, reworked wider
    // 2026-09-30 afternoon: 1858 x 471, floor at 455, scale 0.82; was cand-5, 1216 x 457, floor at 441). Without them installed, the staging above. On a wide screen both sit
    // right of his standing spot so the box does not cover them (at 0.8 the fall lay almost wholly behind it, 1600x900
    // proof); the wide fall keeps his head just clear of the box and runs only the robe tail off the screen's right
    // edge (both orientations; portrait 0.65, not 0.6, so the hair tips are not cut at the left edge, 390x844 proof).
    poses: {
      kneel: { art: 'art/characters/seymour-macalania/kneel.png', aspect: 681 / 651, baseline: 635 / 651, heightOfIdle: (651 * 1.13) / 1191, landscapeX: 0.89 },
      ko: { art: 'art/characters/seymour-macalania/ko.png', aspect: 1858 / 471, baseline: 455 / 471, heightOfIdle: (471 * 0.82) / 1191, landscapeX: 0.94, portraitX: 0.65 },
    },
  },
  /**
   * Shuyin, unsent (FFX-2 only: Chapter V, PR-0133). His battle idle, the installed painting
   * (`public/art/characters/shuyin/idle.png`, 694 x 1136, feet at y 1120; used as installed). The
   * post scene already posed him (`setPose('shuyin', 'kneel')`) and took him off with Lenne
   * (`hideActor('shuyin', 1600)`), writing-bible §3 E5 post; he now stands on the plate from the
   * first frame instead of the lines playing over an empty Farplane.
   *
   * Landscape: right of the dialogue box, facing left toward Yuna. Portrait: centred, feet above
   * the box. Lenne (`showActor('lenne')`) is not staged: two figures right of the box is a layout
   * the approved frames do not show.
   */
  shuyin: {
    art: 'art/characters/shuyin/idle.png',
    aspect: 694 / 1136,
    baseline: 1120 / 1136,
    artFacing: -1,
    landscape: { x: 0.8, feet: 0.9, height: 0.6 },
    portrait: { x: 0.5, feet: 0.74, height: 0.46 },
    unsent: true,
    // D-301: the approved kneel (cand-7, 724 x 675, floor at 659, scale 1.04). Without it he stands, as before.
    poses: { kneel: { art: 'art/characters/shuyin/kneel.png', aspect: 724 / 675, baseline: 659 / 675, heightOfIdle: (675 * 1.04) / 1136 } },
  },
  /**
   * Leblanc, Ormi and Logos, living (FFX-2 only: Chapter XI's epilogue, PR-0133, D-211: "stand
   * Leblanc, Ormi and Logos for their lines, as XII and XIV do"). Their battle idles from
   * Chapter VI (`public/art/characters/<id>/idle.png`, used as installed; sizes and feet from the
   * sidecars). Each stands for their own line, one at a time in the one spot right of the box that
   * XII and XIV use: three figures side by side is a layout no approved frame shows.
   * Leblanc and Logos are painted facing left, Ormi facing right (the sidecars' `facing`).
   */
  leblanc: {
    art: 'art/characters/leblanc/idle.png',
    aspect: 591 / 1118,
    baseline: 1102 / 1118,
    artFacing: -1,
    landscape: { x: 0.8, feet: 0.9, height: 0.56 },
    portrait: { x: 0.5, feet: 0.74, height: 0.44 },
  },
  ormi: {
    art: 'art/characters/ormi/idle.png',
    aspect: 489 / 1189,
    baseline: 1173 / 1189,
    artFacing: 1,
    landscape: { x: 0.8, feet: 0.9, height: 0.6 },
    portrait: { x: 0.5, feet: 0.74, height: 0.46 },
  },
  logos: {
    art: 'art/characters/logos/idle.png',
    aspect: 604 / 1160,
    baseline: 1144 / 1160,
    artFacing: -1,
    landscape: { x: 0.8, feet: 0.9, height: 0.6 },
    portrait: { x: 0.5, feet: 0.74, height: 0.46 },
  },
};

/** The staged figure for `actor`, or `undefined` when cutscenes do not stage it. */
export function cutsceneFigure(actor: string): CutsceneFigure | undefined {
  return Object.prototype.hasOwnProperty.call(CUTSCENE_FIGURES, actor) ? CUTSCENE_FIGURES[actor] : undefined;
}

/** A figure's box on a stage of `w` x `h` pixels. */
export interface FigureBox {
  /** Centre x. */
  cx: number;
  /** Top of the painting. */
  top: number;
  /** The feet line. */
  feet: number;
  width: number;
  height: number;
}

/**
 * Where no figure is named, or the named one is not staged (Yuna, whose
 * `sending-dance` is drawn but who never stands in a cutscene): the middle of
 * the stage, at a person's height.
 */
const OPEN_STAGE: FigurePlacement = { x: 0.5, feet: 0.88, height: 0.5 };

/** The placement that applies on a stage of `w` x `h`. */
export function placementFor(fig: CutsceneFigure | undefined, w: number, h: number): FigurePlacement {
  if (!fig) return OPEN_STAGE;
  return w < h ? fig.portrait : fig.landscape;
}

/** The pixel box of `fig` (or of the open stage) on a `w` x `h` stage. */
export function figureBox(fig: CutsceneFigure | undefined, w: number, h: number): FigureBox {
  const p = placementFor(fig, w, h);
  const height = p.height * h;
  const width = height * (fig?.aspect ?? 0.5);
  const feet = p.feet * h;
  const top = feet - (fig?.baseline ?? 1) * height;
  return { cx: p.x * w, top, feet, width, height };
}

/** Every staged figure a script brings on, so the screen can load them before the first frame. */
export function figuresIn(script: readonly Step[]): string[] {
  const found = new Set<string>();
  const walk = (list: readonly Step[]): void => {
    for (const step of list) {
      if (step.type === 'showActor' && cutsceneFigure(step.actor)) found.add(step.actor);
      else if (step.type === 'parallel') walk(step.steps);
      else if (step.type === 'ifFlag') walk([...step.then, ...(step.else ?? [])]);
    }
  };
  walk(script);
  return [...found];
}
