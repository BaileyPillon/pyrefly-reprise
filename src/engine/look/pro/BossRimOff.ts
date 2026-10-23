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
import { Vector3, Vector4, type Object3D } from 'three';
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

export class RimOffBoxes {
  /** The actor behind each of `LookBold.boxes` (filled by the figure loop, in the same order). */
  readonly actors: Object3D[] = [];

  /** Split the figures' boxes into the bosses' and the others' (the bold pass: right after its figure loop; the main pass: from the bold pass's last frame). */
  update(u: Record<string, { value: unknown }>, boxes: readonly Vector4[], n: number): void {
    const c = u as unknown as RimOffUniforms;
    if (!Array.isArray(c.uRimBoss.value) || c.uRimBoss.value.length !== RIM_OFF_BOSSES) { // a ShaderPass shares array elements between clones, so each pass builds its own once
      c.uRimBoss.value = Array.from({ length: RIM_OFF_BOSSES }, () => new Vector4());
      c.uRimOther.value = Array.from({ length: RIM_OFF_OTHERS }, () => new Vector4());
    }
    const boss = c.uRimBoss.value;
    const other = c.uRimOther.value;
    let nb = 0;
    let no = 0;
    const bossOf: Object3D[] = []; // a rigged boss is one tracked mesh per PART: one box for the whole boss, the union of its parts' boxes
    for (let i = 0; i < n; i++) {
      const actor = this.actors[i];
      const art = (actor?.userData['bossClean'] as { artId?: string } | undefined)?.artId;
      if (actor && art !== undefined && bossCleanOn(art)) {
        let k = bossOf.indexOf(actor);
        if (k < 0 && nb < RIM_OFF_BOSSES) {
          k = nb++;
          bossOf[k] = actor;
          boss[k]!.copy(boxes[i]!);
        } else if (k >= 0) {
          const b = boss[k]!;
          const x = boxes[i]!;
          b.set(Math.min(b.x, x.x), Math.min(b.y, x.y), Math.max(b.z, x.z), Math.max(b.w, x.w));
        }
      } else if (no < other.length) other[no++]!.copy(boxes[i]!);
    }
    c.rimBossN.value = nb;
    c.rimOtherN.value = nb > 0 ? no : 0;
    drawn.clear(); // `bossFigure` is asked once per part in the figure loop; the next frame starts again
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
