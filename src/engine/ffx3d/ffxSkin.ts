/**
 * **The `ffx` skin on the battle's actors** (the hidden Fayth chapter; `docs/plans/fayth-3d.md`): Bailey's own converted FFX models carried by the painted game's actors, so the presenter's motion (lunge, hop, recoil,
 * shake, squash, the fall and the fades) moves them, with the painted planes switched off. The same object also lays the painted skin at FFX's staging (no models: only the billboards are made flat, see
 * {@link FfxSkin.update}), so the two skins stand where the same actors stand and can be compared shot for shot.
 *
 * ## How a model rides an actor
 *
 * The stage (`PaintedStage`) owns the actors; the scene owns none (`SceneBuild`). So the skin finds them where the stage puts them, as children of the three.js scene its host group is mounted in, **by name**
 * (`PaintedActor` is named by its combatant id), and attaches the model to the actor's `inner` group, which is where the actor stacks every motion layer (`PaintedActor.update`). It re-attaches when the stage
 * replaces an actor of the same id (`PaintedStage.add` replaces) and reads nothing of the engine.
 *
 * - **The painted planes are switched off** with {@link hidePaintedFigure}: the actor's own `showFigure` rule (the one a figure-less part already uses) turned off after construction, and its two plane meshes hidden.
 *   `PaintedActor` keeps both private and the stage never passes `figure: false`; this chapter-local write, like the range director's `rimOf` and `keepUpright`, avoids growing that 2,254-line shared file for one hidden
 *   chapter (house rule 7), and `tests/unit/ffx-skin.test.ts` pins that the fields are still there.
 * - **The interim yaw is off** (`setInterimYaw(0)`): that turn is for flat paintings, and a model has its own facing: each faces the other side's stand point, as FFX does at the start of a fight.
 * - **Alpha and scale follow the actor.** The range director fades Evrae with `setAlpha` and sets the actor's scale for the FAR painting; the model takes the alpha and divides the scale out, so it stays the size
 *   its file says.
 * - **The actor's height is the model's**, how far its highest point stands above its origin, so the HUD's head anchors land on the model, not on a painting of another height. (A figure whose origin is not at
 *   its feet, Evrae's, anchors at its top rather than its crown: the HUD's plates are a later question.)
 *
 * A model whose actor is not on the field (a party member not in the fight) is simply not attached; a character with no model stays a painted billboard.
 *
 * Game case: FFX only.
 */

import { Group, Object3D, Vector3 } from 'three';
import { PaintedActor } from '../PaintedActor.ts';
import type { FfxStaging } from './ffxStaging.ts';
import type { FfxModel, FfxModels } from './models.ts';

/** The ids that stand on Evrae's side: they face the party; everyone else faces Evrae. */
const ENEMY_IDS: ReadonlySet<string> = new Set(['evrae', 'cid']);

/** The ids the skin looks for on the field: every model it has, and the painted actors it only lays flat. */
const PAINTED_IDS: readonly string[] = ['tidus', 'wakka', 'rikku', 'lulu', 'auron', 'kimahri', 'evrae'];

/** What a `PaintedActor` keeps private and the skin needs to switch its figure off and to carry a model. */
interface PaintedInternals {
  showFigure: boolean;
  slots: ReadonlyArray<{ mesh: Object3D }>;
  inner: Group;
}

/** The private parts of `actor`, or null when `PaintedActor` no longer has them (the skin then leaves that actor painted). */
export function internalsOf(actor: PaintedActor): PaintedInternals | null {
  const a = actor as unknown as Partial<PaintedInternals>;
  return a.inner instanceof Group && Array.isArray(a.slots) && typeof a.showFigure === 'boolean' ? (a as PaintedInternals) : null;
}

/** Switch the actor's painted planes off for good: the figure rule, and the planes themselves. Returns false when the actor's private parts are not as expected. */
export function hidePaintedFigure(actor: PaintedActor): boolean {
  const parts = internalsOf(actor);
  if (!parts) return false;
  parts.showFigure = false;
  for (const slot of parts.slots) slot.mesh.visible = false;
  return true;
}

/** One model on one actor. */
interface Bound {
  readonly actor: PaintedActor;
  readonly model: FfxModel | null;
  /** The model's own scale (world units per file unit), which the actor's scale is divided out of. */
  readonly baseScale: number;
  alpha: number;
}

export interface FfxSkinOptions {
  /** The scene's group: the actors are found among the children of the scene it is mounted in. */
  readonly host: Object3D;
  /** The loaded models, or null for the painted skin at FFX's staging (billboards only). */
  readonly models: FfxModels | null;
  readonly staging: FfxStaging;
}

export class FfxSkin {
  private readonly bound = new Map<string, Bound>();
  private readonly scratch = new Vector3();
  private readonly toward = new Vector3();

  constructor(private readonly opts: FfxSkinOptions) {}

  /** The actors the skin has taken, by id (a test's and the debug view's read). */
  get actors(): ReadonlyMap<string, PaintedActor> {
    return new Map([...this.bound].map(([id, b]) => [id, b.actor]));
  }

  /**
   * Once a frame, after the stage's own work: attach to any actor that is new, and make every model follow its actor's alpha and scale. Nothing to do before the host is mounted in a scene.
   * The painted skin at FFX's staging has no models and only lays its billboards flat.
   */
  update(): void {
    const scene = this.opts.host.parent;
    if (!scene) return;
    const ids = this.opts.models ? Object.keys(this.opts.models.actors) : PAINTED_IDS;
    for (const id of ids) {
      const actor = scene.children.find((c): c is PaintedActor => c instanceof PaintedActor && c.name === id);
      if (!actor) continue;
      const have = this.bound.get(id);
      if (!have || have.actor !== actor) this.attach(id, actor);
      else this.follow(have);
    }
  }

  private attach(id: string, actor: PaintedActor): void {
    actor.setInterimYaw(0); // a flat painting's turn toward the other side: off for a billboard laid at FFX's staging and for a model alike
    const model = this.opts.models?.actors[id] ?? null;
    const parts = model ? internalsOf(actor) : null;
    if (!model || !parts) {
      this.bound.set(id, { actor, model: null, baseScale: 1, alpha: 1 });
      return;
    }
    hidePaintedFigure(actor);
    if (ENEMY_IDS.has(id) && actor.shadow) actor.shadow.visible = false; // a 1.5-radius blob under a creature that is 13 units tall and hovers: nothing it could ground
    actor.setWorldHeight(model.height);
    this.faceOpponents(id, actor, model);
    parts.inner.add(model.root);
    const baseScale = model.root.scale.x;
    this.bound.set(id, { actor, model, baseScale, alpha: -1 });
    this.follow(this.bound.get(id)!);
  }

  /** Turn the model toward the other side's stand point: the party toward Evrae's NEAR spot, Evrae toward the party's middle. */
  private faceOpponents(id: string, actor: PaintedActor, model: FfxModel): void {
    const to = this.toward;
    if (ENEMY_IDS.has(id)) {
      to.set(0, 0, 0);
      const slots = this.opts.staging.partySlots.slice(0, 3);
      for (const s of slots) to.add(s);
      to.multiplyScalar(1 / Math.max(1, slots.length));
    } else {
      const [x, y, z] = this.opts.staging.spots.near;
      to.set(x, y, z);
    }
    const from = actor.getWorldPosition(this.scratch);
    model.root.rotation.y = to.x === from.x && to.z === from.z ? 0 : Math.atan2(to.x - from.x, to.z - from.z);
  }

  private follow(b: Bound): void {
    const { actor, model } = b;
    if (!model) return;
    const alpha = actor.visible ? actor.alpha : 0;
    if (alpha !== b.alpha) {
      b.alpha = alpha;
      model.root.visible = alpha > 0.002;
      model.setOpacity(alpha);
    }
    const s = actor.scale.x;
    model.root.scale.setScalar(s > 1e-4 ? b.baseScale / s : b.baseScale); // the director sizes the actor for a painting; the model keeps its own size
  }

  dispose(): void {
    this.bound.clear();
  }
}
