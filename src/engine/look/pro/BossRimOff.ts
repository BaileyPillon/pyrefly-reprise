/**
 * THE BOLD PASS'S RIM, OFF ON THE TWO RE-CUT BOSSES (lane "boss-matte", 2026-10-23; `look/pro/BossClean.ts` has the rest of the switch).
 *
 * `LookBoldShader` draws one more rim of its own, in screen space: a bright ring along each figure's back edge in the room's key colour, over the figure mask (step 5). It is the pro arena's look and it
 * belongs to every figure, so zeroing the figures' own rim cells (`BossClean.ts`) leaves it: a thin pale line along Bahamut's and Seymour's lit edges. This file hands the shader where the re-cut bosses are
 * on the frame: up to two BOSS boxes (a boss's padded screen box, `LookBold.boxes`) and every OTHER figure's box. The shader skips the rim at a pixel inside a boss box and inside no other figure's box,
 * so a party member standing in front of a boss keeps her rim. A box test, not a mask: the rim ring is 2.6 px wide, the boxes are the figures' own padded boxes, and the only pixels that can be wrong are
 * background pixels inside a boss box, which carry no figure mask and so no rim anyway.
 *
 * Nothing is sent while the switch is off (`bossCleanOn`): the counts stay 0 and the shader draws today's rim. Both games (shared plumbing); only the two bosses of `BossClean.ts` are ever named.
 */
import { Box3, Vector3, Vector4, type Camera, type Object3D } from 'three';
import { BOSS_FEET, bossCleanOn, footFit, type FootActor } from './BossClean.ts';

export const RIM_OFF_BOSSES = 2;
/** How many other figures' boxes a shader holds (the party of three, a second boss and the add-ons of Chapter I fit in eight). */
export const RIM_OFF_OTHERS = 8;

type Cell<T> = { value: T };
interface RimOffUniforms {
  uRimBoss: Cell<Vector4[]>;
  uRimOther: Cell<Vector4[]>;
  rimBossN: Cell<number>;
  rimOtherN: Cell<number>;
}

const world = new Box3();
const corner = new Vector3();

/** A boss actor's POSED bounds as a padded screen box (frame uv: x0, y0, x1, y1), or null when it has none: a rigged boss bends its parts away from their rest boxes, which are all the bold pass's tracked boxes know. */
function posedBox(actor: Object3D, camera: Camera, out: Vector4): Vector4 | null {
  world.setFromObject(actor, true);
  if (world.isEmpty()) return null;
  let x0 = 9, y0 = 9, x1 = -9, y1 = -9;
  for (let k = 0; k < 8; k++) {
    corner.set(k & 1 ? world.max.x : world.min.x, k & 2 ? world.max.y : world.min.y, k & 4 ? world.max.z : world.min.z).project(camera);
    x0 = Math.min(x0, corner.x * 0.5 + 0.5);
    x1 = Math.max(x1, corner.x * 0.5 + 0.5);
    y0 = Math.min(y0, corner.y * 0.5 + 0.5);
    y1 = Math.max(y1, corner.y * 0.5 + 0.5);
  }
  const px = (x1 - x0) * 0.06;
  const py = (y1 - y0) * 0.05;
  return out.set(x0 - px, y0 - py, x1 + px, y1 + py);
}

export class RimOffBoxes {
  /** The actor behind each of `LookBold.boxes` (filled by the figure loop, in the same order). */
  readonly actors: Object3D[] = [];
  private readonly bossBox: Vector4[] = Array.from({ length: RIM_OFF_BOSSES }, () => new Vector4());
  private readonly otherBox: Vector4[] = Array.from({ length: RIM_OFF_OTHERS }, () => new Vector4());
  private nb = 0;
  private no = 0;

  /**
   * Split the figures' boxes into the bosses' and the others' and hand them to a pass's uniforms. With a `camera` (the bold pass, right after its figure loop) a boss's box is its POSED bounds projected
   * on the frame; without one, the union of its parts' tracked boxes (what the tests and a pass with no camera have).
   */
  update(u: Record<string, { value: unknown }>, boxes: readonly Vector4[], n: number, camera?: Camera): void {
    this.refresh(boxes, n, camera);
    this.copyTo(u);
    drawn.clear(); // `bossFigure` is asked once per part in the figure loop; the next frame starts again
  }

  /** The last split, into a pass's uniforms (the main look pass reads what the bold pass found a frame ago). */
  copyTo(u: Record<string, { value: unknown }>): void {
    const c = u as unknown as RimOffUniforms;
    if (!Array.isArray(c.uRimBoss.value) || c.uRimBoss.value.length !== RIM_OFF_BOSSES) { // a ShaderPass shares array elements between clones, so each pass builds its own once
      c.uRimBoss.value = Array.from({ length: RIM_OFF_BOSSES }, () => new Vector4());
      c.uRimOther.value = Array.from({ length: RIM_OFF_OTHERS }, () => new Vector4());
    }
    for (let i = 0; i < this.nb; i++) c.uRimBoss.value[i]!.copy(this.bossBox[i]!);
    for (let i = 0; i < this.no; i++) c.uRimOther.value[i]!.copy(this.otherBox[i]!);
    c.rimBossN.value = this.nb;
    c.rimOtherN.value = this.nb > 0 ? this.no : 0;
  }

  private refresh(boxes: readonly Vector4[], n: number, camera?: Camera): void {
    const bossOf: Object3D[] = []; // a rigged boss is one tracked mesh per PART: one box for the whole boss
    this.nb = 0;
    this.no = 0;
    for (let i = 0; i < n; i++) {
      const actor = this.actors[i];
      const art = (actor?.userData['bossClean'] as { artId?: string } | undefined)?.artId;
      if (actor && art !== undefined && bossCleanOn(art)) {
        let k = bossOf.indexOf(actor);
        if (k < 0 && this.nb < RIM_OFF_BOSSES) {
          k = this.nb++;
          bossOf[k] = actor;
          this.bossBox[k]!.copy(boxes[i]!);
        } else if (k >= 0) {
          const b = this.bossBox[k]!;
          const x = boxes[i]!;
          b.set(Math.min(b.x, x.x), Math.min(b.y, x.y), Math.max(b.z, x.z), Math.max(b.w, x.w));
        }
      } else if (this.no < this.otherBox.length) this.otherBox[this.no++]!.copy(boxes[i]!);
    }
    if (camera) for (let k = 0; k < this.nb; k++) posedBox(bossOf[k]!, camera, this.bossBox[k]!);
  }
}

const quad: [Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
const drawn = new Set<Object3D>();

/**
 * The bold pass draws a contact ellipse and a reflection for every tracked painted mesh, and a rigged boss is one mesh per PART (Seymour six, Bahamut five), each standing on the columns of its own lowest
 * rows. For a re-cut boss the pass asks here: `null` when this actor is not a re-cut boss now (today's code runs); `'skip'` for the second and later parts of a boss already drawn this frame (no contact, no
 * reflection of their own); else the floor point under the WHOLE figure's footprint (`BOSS_FEET`, from the painting's content box in world x) and the ellipse's half width, in world units.
 */
export function bossFigure(actor: Object3D): 'skip' | { cx: number; rx: number } | null {
  const art = (actor.userData['bossClean'] as { artId?: string } | undefined)?.artId;
  const foot = art !== undefined && bossCleanOn(art) ? BOSS_FEET[art] : undefined;
  if (!foot) return null;
  if (drawn.has(actor)) return 'skip';
  drawn.add(actor);
  const q = (actor as FootActor).contentQuad(quad);
  return footFit(q[0].x, q[1].x, foot);
}
