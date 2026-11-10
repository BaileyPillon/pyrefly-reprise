/**
 * The stage's side of a Special form, as functions of a stage object and the generated tables (FFX-2 only in what is seen: the three Special dresspheres exist only in FFX-2; the
 * plumbing is shared and inert, because every function here answers "no form" until the stage registers one, and nothing registers one while the switch `specialDressUp` is OFF).
 *
 * A Special is ONE connected figure, painted once, standing at the main girl's own slot as the main's own `PaintedActor`. Its two parts are figure-less anchored stubs on that actor
 * (never bodies): `PartAnchors.ts`' on-parent path with a row per painting shown, a `Proxy` handle that sends a part's reactions to the one figure (`FormActorHandle.ts`), a fitted
 * height from the size table (`specialParts.ts`) and a hit gate so the figure hurts once per enemy action. The stage (`BattlePresenterStage.ts`, step C2) only calls the hooks at
 * the bottom; this file imports no DOM, and `three` only through the types of the files it imports. Nothing here moves a figure: the stand point is the girl's own slot.
 *
 * `[ours]` in this file: the whole-figure row's small ring radius, the world radius of a mode-(b) ring, the surface test (the shared phone test), the default look.
 */

import type { AnyCombatant, CombatantId } from '../battle/common/types.ts';
import type { SpecialId } from '../battle/ffx2/special/forms.ts';
import { baseArtId } from '../data/art/artNamespace.ts';
import { FIT_ROWS, SPECIAL_PARTS, type FitRowName } from '../data/art/specialParts.ts';
import type { SceneSlots } from '../scenes/index.ts';
import { createFormActorHandle, createHitGatedActor } from './FormActorHandle.ts';
import type { PaintedActor } from './PaintedActor.ts';
import type { OnParentAnchor, PartAnchor } from './PartAnchors.ts';
import type { HoldPolicy } from './SpecialBeatPlans.ts';
import type { FormRole } from './SpecialFormTracker.ts';

export type { FitRowName } from '../data/art/specialParts.ts';
export type Surface = 'desktop' | 'phone';
/** The part mark: (a) the faithful default, nothing on the figure and the plates carry the part; (b) a gold ring on the part while it is aimed at or acting. */
export type MarkMode = 'a' | 'b';

/** The form the stage has up. `gate` is the hit gate: step C2 sets `gate.blocked` once per event before the event plays (true for a later `damage` of the same enemy action). */
export interface StageForm {
  readonly girl: CombatantId;
  readonly special: SpecialId;
  readonly main: CombatantId;
  readonly right: CombatantId;
  readonly left: CombatantId;
  readonly parked: readonly CombatantId[];
  readonly gate: { blocked: boolean };
}

/** The three open look questions, as switches (Bailey has not answered): the size row, the part mark, the first-full-change hold. */
export interface SpecialLook {
  fit: FitRowName;
  mark: MarkMode;
  hold: HoldPolicy;
}

const DEFAULT_LOOK: Readonly<SpecialLook> = { fit: 'trial', mark: 'a', hold: 'per-save' };
let look: SpecialLook = { ...DEFAULT_LOOK };

/** Set the look (the given fields over the defaults); null puts the defaults back. Step C2 calls it with `specialsLookWord()`. */
export function setSpecialLook(next: Partial<SpecialLook> | null): void {
  look = { ...DEFAULT_LOOK, ...(next ?? {}) };
}

export function specialLook(): SpecialLook {
  return look;
}

// ------------------------------------------------------------------ the registry

const forms = new WeakMap<object, StageForm>();
interface HandleEntry {
  figure: PaintedActor;
  stub: PaintedActor | undefined;
  mode: MarkMode;
  handle: PaintedActor;
}
const handles = new WeakMap<object, Map<CombatantId, HandleEntry>>();
const NONE: readonly CombatantId[] = [];

/** Register (or, with null, drop) the form `stage` has up; dropping also drops the cached handles. Registering the same form again keeps them. */
export function setStageForm(stage: object, form: StageForm | null): void {
  if (form === null) {
    forms.delete(stage);
    handles.delete(stage);
    return;
  }
  if (forms.get(stage) === form) return;
  forms.set(stage, form);
  handles.delete(stage);
}

export function stageFormOf(stage: object): StageForm | undefined {
  return forms.get(stage);
}

const roleIn = (form: StageForm, id: CombatantId): FormRole | undefined => (id === form.right ? 'right' : id === form.left ? 'left' : id === form.main ? 'main' : undefined);

/** `'right' | 'left'` for a stub of the registered form, `'main'` for its figure, else undefined. */
export function partRoleOf(stage: object, id: CombatantId): FormRole | undefined {
  const form = forms.get(stage);
  return form ? roleIn(form, id) : undefined;
}

/** The parked girls: `stage(state)` adds these to its keep set so a re-stage does not remove them. */
export function formKeepIds(stage: object): readonly CombatantId[] {
  return forms.get(stage)?.parked ?? NONE;
}

// ------------------------------------------------------------------ the anchor rows

/** The ring radius of a whole-figure row, world units: small, because the ring is hidden and only the actor's size follows it. [ours] */
export const WHOLE_ROW_RADIUS = 0.15;
const MARK_GOLD = 0xf0cf92;
/** The reference world height a mode-(b) ring radius is scaled to when the caller gives none: the trial row's desktop height at the default party height. [ours] */
const REFERENCE_PARTY_HEIGHT = 1.82;
const REFERENCE_ENEMY_HEIGHT = 4.1;

/** The order of the three-number rows in `FIT_ROWS` (the generated table's keys are sorted, so the order is stated here). */
const SPECIALS: readonly SpecialId[] = ['floral-fallal', 'machina-maw', 'full-throttle'];
const specialOfArt = (artId: string): SpecialId | undefined => {
  const base = baseArtId(artId);
  return SPECIALS.find((s) => SPECIAL_PARTS[s].artId === base);
};

/**
 * The anchor row of a part for the painting shown (`pose`; a pose with no table row shows the idle painting). The right part is the row named `right`, never the lower x.
 * Mode (a): a whole-figure row (the number point as `px` and `chestPx`, the figure's box, a hidden ring). Mode (b): the part's own region, a gold mark ring whose world radius is scaled to `refHeight`,
 * the figure's world height (the stage passes the live one through `anchorSourceOf`; absent, the trial row's desktop height). The main has no row.
 */
export function anchorRowFor(special: SpecialId, role: FormRole, pose: string, lookIn: SpecialLook = look, refHeight?: number): OnParentAnchor | undefined {
  if (role === 'main') return undefined;
  const table = SPECIAL_PARTS[special];
  const rows = table.poses[pose] ?? table.poses['idle'];
  if (!rows) return undefined;
  const paint = { ...rows.paint };
  if (lookIn.mark === 'a') {
    const point: [number, number] = [rows.whole.numberPoint[0], rows.whole.numberPoint[1]];
    return { mode: 'onParent', px: point, chestPx: [point[0], point[1]], paint, box: [...rows.whole.box], ring: { radius: WHOLE_ROW_RADIUS, ground: false, hidden: true } };
  }
  const part = role === 'right' ? rows.right : rows.left;
  const height = refHeight ?? (specialFitGirls(table.artId, 'desktop', REFERENCE_ENEMY_HEIGHT / REFERENCE_PARTY_HEIGHT, lookIn) ?? 1) * REFERENCE_PARTY_HEIGHT;
  const radius = (part.radiusPx / Math.max(1, paint.baselineY - paint.contentTop)) * height;
  return { mode: 'onParent', px: [part.px[0], part.px[1]], chestPx: [part.px[0], part.px[1]], paint, ring: { radius, ground: false, mark: 'target', colour: MARK_GOLD } };
}

/** `slots` itself with no form; else `slots` with a row for each stub, for the painting shown. A row the scene already has for the same id is never overwritten. */
export function formSlots(stage: object, slots: SceneSlots, pose = 'idle'): SceneSlots {
  const form = forms.get(stage);
  if (!form) return slots;
  const partAnchors: Record<string, PartAnchor> = { ...slots.partAnchors };
  for (const [id, role] of [[form.right, 'right'], [form.left, 'left']] as const) {
    const row = anchorRowFor(form.special, role, pose);
    if (row && partAnchors[id] === undefined) partAnchors[id] = row;
  }
  return { ...slots, partAnchors };
}

/** A pod of the form, made to name the main as its parent (`PaintedStage.add` reads `flags.partOf`; the engine's pods carry no flags). */
export function partView(c: AnyCombatant, form: StageForm): AnyCombatant {
  return { ...c, flags: { ...c.flags, partOf: form.main } } as AnyCombatant;
}

// ------------------------------------------------------------------ the fitted height

/** `'phone'` for an upright narrow window, else `'desktop'`: the shared phone test (`ui/ff7/ff7Geometry.ts` `isPhoneShape`, `ui/common/phoneBattle.ts`). */
export function surfaceOf(canvasW: number, canvasH: number): Surface {
  return canvasW < 600 && canvasH > canvasW ? 'phone' : 'desktop';
}

/**
 * The figure's height in girls: the smallest of its silhouette, the enemy's share of the screen, the row's size and the width cap (a term that is null in the row is ignored).
 * Undefined for an art id that is not a Special's (a namespace prefix is stripped first). The numbers live in the generated table only.
 */
export function specialFitGirls(artId: string, surface: Surface, enemyOverParty: number, lookIn: SpecialLook = look): number | undefined {
  const special = specialOfArt(artId);
  if (!special) return undefined;
  const i = SPECIALS.indexOf(special);
  const row = FIT_ROWS[lookIn.fit];
  const terms = [SPECIAL_PARTS[special].silhouetteGirls, row.formGirls[surface][i]!];
  if (row.enemyShare !== null) terms.push(row.enemyShare * enemyOverParty);
  if (row.widthCapGirls) terms.push(row.widthCapGirls[surface][i]!);
  return Math.min(...terms);
}

/** `(artId) => world height` for a stage whose girls stand `partyHeight` tall and whose enemy stands `enemyHeight`; undefined for an art id that is not a Special's. */
export function makeSpecialFit(env: { partyHeight: number; enemyHeight: number; surface: Surface }, lookIn: SpecialLook = look): (artId: string) => number | undefined {
  return (artId) => {
    const girls = specialFitGirls(artId, env.surface, env.enemyHeight / env.partyHeight, lookIn);
    return girls === undefined ? undefined : girls * env.partyHeight;
  };
}

/** The fall beat's grade: the existing KO flash (`BattlePresenterBeats.ko`: `flash(0x4a5a78, 320, 0.7)`) stretched, and the squash. Data only; the beat is step C2's. */
export const FALL_GRADE = { flashColour: 0x4a5a78, flashPeak: 0.7, scale: 0.8 } as const;

// ------------------------------------------------------------------ the four hooks (identity / undefined with no form: OFF)

/** The part's cached `FormActorHandle`, or the main's cached hit-gated figure; undefined for any other id and with no form. */
export function formHandleOf(stage: object, id: CombatantId, actors: { get(id: string): { readonly actor: PaintedActor } | undefined }): PaintedActor | undefined {
  const form = forms.get(stage);
  const role = form ? roleIn(form, id) : undefined;
  if (!form || !role) return undefined;
  const figure = actors.get(form.main)?.actor;
  if (!figure) return undefined;
  const stub = role === 'main' ? undefined : actors.get(id)?.actor;
  const mode = look.mark;
  let cache = handles.get(stage);
  if (!cache) handles.set(stage, (cache = new Map()));
  const have = cache.get(id);
  if (have && have.figure === figure && have.stub === stub && have.mode === mode) return have.handle;
  const handle = role === 'main' ? createHitGatedActor(figure, form.gate) : createFormActorHandle(figure, stub, mode, form.gate);
  cache.set(id, { figure, stub, mode, handle });
  return handle;
}

/** `partView(c, form)` for a pod of the registered form, else `c` itself. */
export function partViewOf(stage: object, c: AnyCombatant): AnyCombatant {
  const form = forms.get(stage);
  return form && (c.id === form.right || c.id === form.left) ? partView(c, form) : c;
}

/** The fit for the scene's heights and the window's surface while a form is registered, else undefined (the stage's own rule). */
export function specialFitOf(stage: object, o: { slots: SceneSlots; canvas: { clientWidth: number; clientHeight: number } }): ((artId: string) => number | undefined) | undefined {
  if (!forms.has(stage)) return undefined;
  return makeSpecialFit({ partyHeight: o.slots.partyHeight ?? REFERENCE_PARTY_HEIGHT, enemyHeight: o.slots.enemyHeight ?? REFERENCE_ENEMY_HEIGHT, surface: surfaceOf(o.canvas.clientWidth, o.canvas.clientHeight) }, look);
}

/** The part marks the targeting port wants lit: [stub id, lit] for each stub of the registered form under the mark (b); empty under the default (a) and with no form. */
export function markedPartsOf(stage: object, ids: readonly CombatantId[]): ReadonlyArray<readonly [CombatantId, boolean]> {
  const form = forms.get(stage);
  return form && look.mark === 'b' ? [form.right, form.left].map((id) => [id, ids.includes(id)] as const) : [];
}

/**
 * The per-frame row source for the registered form's stubs (`StageAnchors.anchorNow`), else undefined. `mainHeight` is the figure's live world height (the stage passes the main actor's own): under the mark (b)
 * the ring's world radius follows the figure actually on screen, on a phone as on a desktop; absent, the desktop reference height (`anchorRowFor`).
 */
export function anchorSourceOf(stage: object, mainHeight?: number): ((partId: string, pose: string) => PartAnchor | undefined) | undefined {
  const form = forms.get(stage);
  if (!form) return undefined;
  return (partId, pose) => {
    const role = roleIn(form, partId);
    return role === 'right' || role === 'left' ? anchorRowFor(form.special, role, pose, look, mainHeight) : undefined;
  };
}
