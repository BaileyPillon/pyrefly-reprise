/**
 * The Oversoul look on the field: option B of
 * `docs/concepts/chapters/trema/oversoul/README.md`, picked by Bailey on
 * 2026-09-25 ("I'll go with all your recommendations").
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Oversoul exists only in FFX-2;
 * the only form built is Oversoul Paragon (Chapter XIII, Cloister 100). The tap
 * is installed on the FFX-2 HUD only (`BattleScreenWiring.createHud`), and it
 * does nothing unless a combatant's AI script is an Oversoul form
 * ({@link isOversoulForm}), which only `TREMA_PARAGON_FORM = 'oversoul'` puts on
 * the field.
 *
 * **What is sourced, and what is ours.** "The fiend's body absorbs pyreflies,
 * acquiring a blue cast" (FF Wiki, *Oversoul (Final Fantasy X-2)*, revid
 * 4041089; `research/ffx2-combat-core.md` §6.9 "blue pyrefly aura"). So the
 * fiend turns blue and pyreflies are part of it. The strength and colours below,
 * that the cast lasts all fight, the motes staying around it, their count, size
 * and box, and the rim are **ours (inferred)**, exactly as the README lists
 * them. The name plate is unchanged (the wiki's *Paragon* page keeps the name).
 *
 * **When.** At the Oversoul action, the fiend's first turn, which the engine
 * plays as the line "Paragon oversouls!" ({@link oversoulTriggeredBy}); the
 * cast, rim and motes fade in over {@link OVERSOUL_LOOK.fadeMs}. The absorption
 * itself (motes streaming inward) is still owed, as the README says.
 *
 * **How.** Three layers, none of them new art, and the locked Paragon painting
 * is untouched:
 * - the cast: `castColor` / `castAmount` / `castGain` in `PaintedShader.ts`,
 *   compiled in by the `PAINTED_CAST` define on this figure's own two plane
 *   materials only (a define, not bare cells: three.js re-reads a material's
 *   uniform list only when its program changes, so cells added to a compiled
 *   program would never upload). It compiles when the Oversoul form is staged,
 *   not at the moment;
 * - the rim: the actor's existing rim light, through `setRimLight`;
 * - the motes: one {@link ParticleField} from the `pyreflies` preset, recoloured
 *   blue, beside the figure in its parent, following it, and fading with the
 *   figure's alpha and its KO dissolve.
 *
 * Presentation only: nothing here reaches into `src/battle` (rule 1).
 */

import { Color, type Object3D, type ShaderMaterial, type WebGLRenderer } from 'three';
import type { AtbSnapshot, BattleEvent, BattleState, CombatantId, TurnPreview } from '../battle/common/types.ts';
import type { HudPort } from './HudPort.ts';
import { ParticleField, ParticlePresets } from './Particles.ts';
import { oversoulIds, oversoulTriggeredBy } from './OversoulMoment.ts';

/** Option B's numbers (README "The options", row B). Every one is ours, not the game's. */
export const OVERSOUL_LOOK = {
  /** Option A's term at 0.8: `mix(c, pow(luma, 0.85) * castColor * 2.2, 0.8)`. */
  castColor: 0x6fa8ff,
  castAmount: 0.8,
  castGain: 2.2,
  /** The existing rim uniform, in blue. */
  rimColor: 0x7cc4ff,
  rimStrength: 0.7,
  motes: {
    count: 70,
    size: 26,
    colors: [0x4f9dff, 0x7cc4ff, 0xbfe4ff, 0x2f6dff, 0xffffff],
    /** Half extents of the README's 6.6 x 4.8 x 2.4 box, for a figure {@link OVERSOUL_LOOK.refHeight} tall. */
    bounds: { x: 3.3, y: 2.4, z: 1.2 },
    /** The box's centre above the figure's feet, and toward the camera. */
    lift: 2.2,
    forward: 0.3,
    drift: [0, 0.5, 0] as [number, number, number],
    wobble: [0.35, 0.18, 0.25] as [number, number, number],
  },
  /** The height the box above was drawn for (the stage's default fiend height); a taller figure scales it. */
  refHeight: 4.1,
  /** How long the cast takes to come on at the Oversoul moment. */
  fadeMs: 1200,
} as const;

/** What the look needs from a figure. `PaintedActor` is one. */
export interface OversoulFigure extends Object3D {
  readonly alpha: number;
  readonly height: number;
  setRimLight(colour: number | string, strength: number, dir?: [number, number]): void;
}

type Cell<T> = { value: T };

/** A painted plane's material: the cells this look reads or adds. */
function paintedMaterialsOf(figure: Object3D): ShaderMaterial[] {
  const out: ShaderMaterial[] = [];
  figure.traverse((o) => {
    const m = (o as { material?: unknown }).material as ShaderMaterial | undefined;
    const u = m?.uniforms;
    if (u && 'desaturate' in u && 'rimStrength' in u && 'dissolve' in u && !out.includes(m)) out.push(m);
  });
  return out;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** The blue cast, rim and motes on one figure. Off until {@link turnOn}. */
export class OversoulLook {
  /** 0 = the painting as painted, 1 = option B in full. */
  private k = 0;
  private on = false;
  private readonly materials: ShaderMaterial[];
  private readonly castAmount: Cell<number> = { value: 0 };
  private readonly castColor: Cell<Color> = { value: new Color(OVERSOUL_LOOK.castColor) };
  private readonly castGain: Cell<number> = { value: OVERSOUL_LOOK.castGain };
  private readonly rimFrom: { color: Color; strength: number };
  private readonly rimTo = new Color(OVERSOUL_LOOK.rimColor);
  private readonly rimNow = new Color();
  private motes: ParticleField | null = null;
  private disposed = false;

  constructor(readonly figure: OversoulFigure) {
    this.materials = paintedMaterialsOf(figure);
    const first = this.materials[0]?.uniforms;
    this.rimFrom = {
      color: new Color((first?.['rimColor'] as Cell<Color> | undefined)?.value ?? 0xbfe0ff),
      strength: (first?.['rimStrength'] as Cell<number> | undefined)?.value ?? 0,
    };
    for (const m of this.materials) {
      m.uniforms['castAmount'] = this.castAmount;
      m.uniforms['castColor'] = this.castColor;
      m.uniforms['castGain'] = this.castGain;
      m.defines = { ...(m.defines ?? {}), PAINTED_CAST: '' };
      m.needsUpdate = true; // a new program key, so the cells above are in its uniform list
    }
  }

  /** 0..1, for tests and the debug snapshot. */
  get amount(): number {
    return this.k;
  }

  get isOn(): boolean {
    return this.on;
  }

  /** The motes, once made. */
  get field(): ParticleField | null {
    return this.motes;
  }

  /** Start the fade in (or jump to full with `instant`). Idempotent. */
  turnOn(instant = false): void {
    if (this.disposed) return;
    this.on = true;
    if (instant) this.k = 1;
    this.ensureMotes();
    this.apply();
  }

  /** @param dt seconds. */
  update(dt: number): void {
    if (this.disposed || !this.on) return;
    if (this.k < 1) this.k = Math.min(1, this.k + (dt * 1000) / OVERSOUL_LOOK.fadeMs);
    this.ensureMotes();
    this.motes?.update(dt);
    this.apply();
  }

  /** Put the figure back as painted and free the motes. */
  dispose(): void {
    if (this.disposed) return;
    this.k = 0;
    this.apply();
    this.disposed = true;
    this.motes?.dispose();
    this.motes = null;
  }

  private ensureMotes(): void {
    if (this.motes || !this.figure.parent) return;
    const m = OVERSOUL_LOOK.motes;
    const s = this.scale();
    const field = new ParticleField(
      ParticlePresets.pyreflies({
        count: m.count,
        size: m.size,
        colors: [...m.colors],
        bounds: { x: m.bounds.x * s, y: m.bounds.y * s, z: m.bounds.z * s },
        drift: m.drift,
        wobble: m.wobble,
        opacity: 0,
      }),
    );
    field.name = 'oversoul-motes';
    // Resolution parity with the scene's own motes (`BattleScreen.syncPixelScale`: 1 = 900 px tall).
    field.onBeforeRender = (renderer: WebGLRenderer): void => {
      field.setPixelScale(Math.max(0.5, (renderer.domElement.height || 900) / 900));
    };
    this.figure.parent.add(field);
    this.motes = field;
  }

  private scale(): number {
    const h = this.figure.height;
    return h > 0 ? h / OVERSOUL_LOOK.refHeight : 1;
  }

  private apply(): void {
    const e = easeInOut(this.k);
    this.castAmount.value = OVERSOUL_LOOK.castAmount * e;
    this.rimNow.copy(this.rimFrom.color).lerp(this.rimTo, e);
    const strength = this.rimFrom.strength + (OVERSOUL_LOOK.rimStrength - this.rimFrom.strength) * e;
    this.figure.setRimLight(this.rimNow.getHex(), strength);
    const motes = this.motes;
    if (!motes) return;
    const s = this.scale();
    const p = this.figure.position;
    motes.position.set(p.x, p.y + OVERSOUL_LOOK.motes.lift * s, p.z + OVERSOUL_LOOK.motes.forward * s);
    const dissolve = (this.materials[0]?.uniforms['dissolve'] as Cell<number> | undefined)?.value ?? 0;
    const present = this.figure.visible ? Math.max(0, Math.min(1, this.figure.alpha)) * (1 - Math.min(1, dissolve)) : 0;
    motes.setOpacity(0.95 * e * present);
    motes.visible = e * present > 0.001;
  }
}

/** Where the looks find their figures: the painted stage (`PaintedStage.actor`). */
export interface OversoulField {
  actor(id: CombatantId): OversoulFigure | undefined;
}

/** Every Oversoul look on one field, keyed by combatant. */
export class OversoulLooks {
  private readonly looks = new Map<CombatantId, OversoulLook>();
  private state: BattleState | null = null;
  private readonly lit = new Set<CombatantId>();

  constructor(private readonly field: () => OversoulField | null) {}

  /** The look on `id`, if any (tests, debug). */
  get(id: CombatantId): OversoulLook | undefined {
    return this.looks.get(id);
  }

  sync(state: BattleState): void {
    this.state = state;
    this.reconcile();
  }

  onEvent(event: BattleEvent): void {
    for (const id of oversoulTriggeredBy(event, this.state)) {
      this.lit.add(id);
      this.reconcile();
      this.looks.get(id)?.turnOn();
    }
  }

  update(dt: number): void {
    this.reconcile();
    for (const look of this.looks.values()) look.update(dt);
  }

  dispose(): void {
    for (const look of this.looks.values()) look.dispose();
    this.looks.clear();
    this.lit.clear();
    this.state = null;
  }

  /** One look per Oversoul form on the field, on the figure staged now; a restaged figure gets a fresh one. */
  private reconcile(): void {
    const field = this.field();
    const wanted = new Set(oversoulIds(this.state));
    for (const [id, look] of this.looks) {
      if (!wanted.has(id) || field?.actor(id) !== look.figure) {
        look.dispose();
        this.looks.delete(id);
      }
    }
    if (!field) return;
    for (const id of wanted) {
      if (this.looks.has(id)) continue;
      const figure = field.actor(id);
      if (!figure) continue;
      const look = new OversoulLook(figure);
      this.looks.set(id, look);
      if (this.lit.has(id)) look.turnOn(true); // already Oversouled when this figure was staged
    }
  }
}

/**
 * Tap a HUD's event stream and frame clock for the Oversoul look, the way
 * `withPhoneLayout` patches its HUD: the instance's own `sync`, `syncVitals`,
 * `onEvent`, `update` and `unmount` are wrapped and the same object returned, so
 * every duck-typed probe on it still sees the real HUD. The look is driven by
 * `update`, which the battle screen stops calling under the pause, so the motes
 * hold still with everything else.
 */
export function withOversoulLook<T extends HudPort>(hud: T, field: () => OversoulField | null): T {
  const looks = new OversoulLooks(field);
  const sync = hud.sync.bind(hud);
  const syncVitals = hud.syncVitals?.bind(hud);
  const onEvent = hud.onEvent.bind(hud);
  const update = hud.update?.bind(hud);
  const unmount = hud.unmount.bind(hud);
  hud.sync = (state: BattleState, preview: TurnPreview[] | AtbSnapshot): void => {
    sync(state, preview);
    looks.sync(state);
  };
  if (syncVitals) {
    hud.syncVitals = (state: BattleState): void => {
      syncVitals(state);
      looks.sync(state);
    };
  }
  hud.onEvent = (event: BattleEvent): Promise<void> | void => {
    const out = onEvent(event);
    looks.onEvent(event);
    return out;
  };
  hud.update = (dt: number): void => {
    update?.(dt);
    looks.update(dt);
  };
  hud.unmount = (): void => {
    looks.dispose();
    unmount();
  };
  return hud;
}
