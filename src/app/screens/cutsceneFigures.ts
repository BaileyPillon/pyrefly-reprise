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
