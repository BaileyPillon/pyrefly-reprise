import type { Object3D, PerspectiveCamera, Scene, ShaderMaterial } from 'three';
import type { Renderer } from '../../Renderer.ts';
import { eyeCandy } from '../EyeCandy.ts';
import { setEyeCandyProvider, type EyeCandyKey } from '../eyeCandyFlags.ts';
import { fxDebugHooks } from '../fxDebugHooks.ts';
import { releaseBreathRigs } from './breathRig.ts';
import { Cinema, dofBand, type DofBand } from './cinema.ts';
import { setProneAvoid } from '../../ProneLay.ts';
import { setShotHold } from '../shotHold.ts';
import { panelsNdc } from './downed.ts';
import { ejectDefringe, injectDefringe } from './patch.ts';
import { Framing } from './framing.ts';
import { aaKind, deviceCloses, deviceNote, fightFacts, liveGates, MIX_PARTS, partsOn, twirlKeysOn, type Device, type MixGame } from './gates.ts';
import { cameraAt, centroid, figOf, type Actor, type Box } from './geometry.ts';
import { followFlourish, HeldShots } from './heldShots.ts';
import { battleCanvas, forgetMenuPanels, hudPanels, menuOpen, phoneBattle } from './hudPanels.ts';
import { LivingFigure } from './living.ts';
import { OdBanner } from './odBanner.ts';
import { Roster } from './roster.ts';
import { releaseMixSplash } from './splash.ts';
import { TwirlSlot } from './twirl.ts';

/**
 * The MAX mix (D-316, Bailey 2026-10-01: "all your recommendations, godspeed"; the switches D-317): the
 * battle's glue for the nine parts, built from the prototypes on `candy-max-proto` after the judges'
 * must-fix lists. Bound with LIVING PAINTINGS' scene bind for every FFX and FFX-2 battle (FF7 never),
 * updated every frame after the rig has placed the camera and before the render, released with it.
 *
 * - CINEMA LIGHT: DEPTH OF FIELD and FOG (`cinema.ts`), SMOOTH EDGES (SMAA or FXAA, `cinema.ts`, and the
 *   defringe, `defringe.ts`);
 * - LIVING PAINTINGS: BREATHING and KO COLLAPSE (`living.ts`);
 * - BATTLE SPECTACLE: CHAPTER FRAMING (`framing.ts`), OVERDRIVE SHOT (FFX) and DRESSPHERE SHOT (FFX-2)
 *   (`heldShots.ts`, `odBanner.ts`, the twirl-key slot `twirl.ts`), SPLASH ART (`splash.ts`, called by
 *   the splash itself in `app/screens/battleSpectacle.ts`).
 *
 * Every part asks `gates.ts` every frame (its EYE CANDY row via `eyeCandyOn`, its look, REDUCE MOTION
 * and the tier), so a switch applies at once; with every part off the battle draws as it did before the
 * mix. Not built (D-318): the Clair Obscur / Persona camera grammar (no command, action or target cuts);
 * not in the mix: figure relighting. `__pyrefly.fx.mix` reports and switches it for captures.
 */

export interface MixBind {
  key: string;
  game: string;
  scene: Scene;
  camera: PerspectiveCamera;
  battleCamera?: unknown;
}

const GRID: Record<'full' | 'phone' | 'low', [number, number]> = { full: [12, 24], phone: [8, 16], low: [6, 12] };

/**
 * While a held shot is up the HUD stays laid out on the master (D-291), so a card that hangs on a figure
 * at rest, or dodges the figures, would float over whoever the shot shows (the judges: "MORTIORCHIS
 * floats over Yuna's staff"; the Bahamut intent card jumping onto the coach card in the spherechange
 * shot): the Sensor card and the enemy-intent card step out for the shot and come back with the master. So does
 * FFX-2's first-time Rikku line, which fades on its own and sat across the dressphere shot (round 19, PR-0320;
 * FFX-2 only, FFX's Auron line holds for a confirm and is not touched).
 */
const HELD_CSS = "html.mix-held .ffx-sensor,html.mix-held .eint,html.mix-held .coach-mark[data-game='ffx2']{visibility:hidden !important}";

function heldStyle(): void {
  if (typeof document === 'undefined' || document.getElementById('mix-held-style')) return;
  const st = document.createElement('style');
  st.id = 'mix-held-style';
  st.textContent = HELD_CSS;
  document.head.appendChild(st);
}

type Guts = Actor & { slots?: { material: ShaderMaterial }[] };

class Mix {
  private readonly game: MixGame;
  private readonly framing: Framing;
  private readonly cinema: Cinema;
  private readonly shots: HeldShots | null;
  private readonly banner = new OdBanner();
  private readonly twirl = new TwirlSlot();
  private readonly living = new Map<Object3D, LivingFigure>();
  private readonly defringed = new Set<ShaderMaterial>();
  private readonly roster: Roster;
  private plans = -1;
  private band: DofBand | null = null;
  private heldClass = false;
  /** The lens shift the held shot on screen was framed against (held with it); null with no shot up. */
  private heldLens: [number, number] | null = null;
  private cost = 0;
  private costN = 0;
  /** CHAPTER FRAMING plays (the downed body avoids the HUD's panels only then; with it off a KO lies as it always did). */
  private framingOn = false;
  /** Checks only: `false` lets a KO lie where it did before round 19 (blind to the HUD). */
  private bodyAvoid = true;

  constructor(private readonly b: MixBind) {
    this.game = b.game === 'ffx2' ? 'ffx2' : 'ffx';
    this.roster = new Roster(b.scene);
    this.framing = new Framing((b.battleCamera as ConstructorParameters<typeof Framing>[0] | undefined) ?? null, b.camera, this.game, b.scene);
    this.cinema = new Cinema(b.scene, () => ((globalThis as { __pyrefly?: { app?: { renderer?: Renderer } } }).__pyrefly?.app?.renderer ?? null));
    this.shots = this.framing.rigs ? new HeldShots(this.game, this.framing.rigs) : null;
    heldStyle();
    setShotHold(() => this.shots?.holdMs() ?? 0); // the presenter holds the next decision until a dressphere shot has run its minimum
    // A body that goes down lies clear of the status rows where it can (round 19, PR-0318; both games).
    setProneAvoid(() => {
      const canvas = this.framingOn && this.bodyAvoid ? battleCanvas() : null;
      return canvas ? panelsNdc(hudPanels(canvas), canvas.getBoundingClientRect(), this.framing.lensNow()) : [];
    });
  }

  update(dt: number): void {
    const t0 = performance.now();
    const parts = partsOn(liveGates(this.game));
    const tier = eyeCandy.tier;
    const rm = eyeCandy.reduceMotion;
    this.framing.rigs?.restore();
    const actors = this.roster.update(dt); // a figure that arrives mid-fight is in the list the frame it is drawn (`roster.ts`)
    // CHAPTER FRAMING: the master, the staging, the menu clearance.
    this.framingOn = parts.chapterFraming;
    this.framing.update(dt, actors, parts.chapterFraming);
    // The held shots (on today's rig too when CHAPTER FRAMING is off).
    const master = this.framing.masterPose ?? this.framing.rigs?.base('idle') ?? null;
    const lens: [number, number] = parts.chapterFraming ? this.framing.lensNow() : [0, 0];
    const menu = menuOpen();
    fightFacts.colossus = this.framing.report.colossusFight; // for the EYE CANDY page's device notes
    // The upright phone shows a slice of a wider field that the HUD slides between beats, so a held shot
    // framed for one slice crops its subject in the next (the judges: Yuna cut at the edge, her head
    // cropped in the close shot): on the phone the master holds through both moments.
    const dev: Device = { tier, phone: phoneBattle(), colossus: fightFacts.colossus };
    const odOn = parts.overdriveShot && !deviceCloses('overdriveShot', dev);
    const scOn = parts.dressphereShot && !deviceCloses('dressphereShot', dev);
    const held = this.shots?.update(dt, { actors, master, lens, odOn, scOn, menu, ready: this.framing.ready && (this.framing.rigs?.introDone() ?? false) }) ?? null;
    // A held shot is one static cut, under REDUCE MOTION as ever: the lens shift stays where the shot was framed against
    // it, so a move running underneath cannot drift it; it goes on with the cut back.
    if (!held) this.heldLens = null;
    else this.heldLens ??= [lens[0], lens[1]];
    this.framing.applyLens(parts.chapterFraming, this.heldLens);
    if (this.game === 'ffx2' && scOn) followFlourish(actors, this.b.camera, battleCanvas());
    if (!!held !== this.heldClass) {
      this.heldClass = !!held;
      document.documentElement.classList.toggle('mix-held', this.heldClass);
    }
    // FOG and the DEPTH OF FIELD band, re-planned with the master.
    const canvas = battleCanvas();
    const W = canvas?.clientWidth || window.innerWidth;
    const H = canvas?.clientHeight || window.innerHeight;
    if (this.framing.report.plans !== this.plans && this.framing.ready && master) {
      this.plans = this.framing.report.plans;
      const figs = actors.filter((a) => a.visible).map(figOf);
      const party = figs.filter((f) => !f.enemy);
      const boss = figs.filter((f) => f.enemy).reduce<(typeof figs)[number] | null>((a, f) => (!a || f.h > a.h ? f : a), null);
      if (party.length && boss) this.cinema.buildFog(this.framing.report.cls, centroid(party), boss.feet, boss.h, cameraAt(master, W / H));
      this.band = dofBand(master, figs, W, H, this.framing.report.cls);
    }
    this.cinema.fogUpdate(dt, parts.fog, rm);
    const shotBand = held && master ? dofBand(held.pose, this.shots!.subjectFigs(), W, H, 'hero') : null;
    this.cinema.dof(parts.depthOfField ? (shotBand ?? this.band) : null);
    // SMOOTH EDGES: the post pass per tier, and the defringe on every painted figure.
    this.cinema.aa(parts.smoothEdges ? aaKind(tier) : null);
    this.defringe(actors, parts.smoothEdges);
    // BREATHING and KO COLLAPSE.
    if (parts.breathing || parts.koCollapse || this.living.size) {
      const grid = GRID[tier];
      for (const a of actors) {
        let f = this.living.get(a);
        if (!f && (parts.breathing || parts.koCollapse)) this.living.set(a, (f = new LivingFigure(a)));
        f?.update({ dt, game: this.game, breath: parts.breathing, collapse: parts.koCollapse, rm, grid });
      }
    }
    // FFX-2: the spherechange's twirl-key slot (part of DRESSPHERE SHOT, not under REDUCE MOTION: a twirl is
    // motion); FFX: the Overdrive banner (it moves nothing in the scene, so it plays under REDUCE MOTION, and on
    // the phone, where only the shot is closed).
    if (this.game === 'ffx2') {
      this.twirl.on = twirlKeysOn(liveGates(this.game));
      this.twirl.eager = tier === 'full' && !dev.phone; // fetch the keys ahead only where bytes are cheap (else when her Change submenu opens)
      for (const a of actors) if (a.facing >= 0) this.twirl.watch(a);
      this.twirl.update(dt);
    } else {
      this.banner.update(parts.overdriveShot, () => this.partyBoxes(actors));
    }
    this.cost += performance.now() - t0;
    this.costN++;
  }

  /** The party's live screen boxes, in viewport px. */
  private partyBoxes(actors: readonly Actor[]): Box[] {
    const live = this.framing.liveBoxes(actors.filter((a) => a.facing >= 0));
    const canvas = battleCanvas();
    if (!live || !canvas) return [];
    const r = canvas.getBoundingClientRect();
    return live.boxes.map((b) => ({ l: b.l + r.left, r: b.r + r.left, t: b.t + r.top, b: b.b + r.top }));
  }

  private defringe(actors: readonly Actor[], on: boolean): void {
    if (!on) {
      for (const m of this.defringed) ejectDefringe(m);
      this.defringed.clear();
      return;
    }
    for (const a of actors as Guts[])
      for (const s of a.slots ?? []) {
        if (this.defringed.has(s.material)) continue;
        const cell = injectDefringe(s.material);
        if (!cell) continue;
        cell.value = 1;
        this.defringed.add(s.material);
      }
  }

  snapshot(): Record<string, unknown> {
    const parts = partsOn(liveGates(this.game));
    // What the device does to each part (the EYE CANDY page says the same: `OFF HERE` / `LESS HERE`).
    const dev: Device = { tier: eyeCandy.tier, phone: phoneBattle(), colossus: this.framing.report.colossusFight };
    const limits: Record<string, unknown> = {};
    for (const p of MIX_PARTS) {
      const n = deviceNote(p, dev);
      if (n) limits[p] = n;
    }
    return {
      game: this.game,
      parts,
      tier: eyeCandy.tier,
      reduceMotion: eyeCandy.reduceMotion,
      device: dev,
      limits,
      framing: { ...this.framing.report, master: this.framing.masterPose ? { pos: this.framing.masterPose.pos.toArray().map((x) => +x.toFixed(2)), look: this.framing.masterPose.look.toArray().map((x) => +x.toFixed(2)), fov: +this.framing.masterPose.fov.toFixed(1) } : null, lens: this.framing.lens, rig: this.framing.rigs?.stats() ?? null },
      shot: this.shots?.held?.kind ?? 'master',
      shots: this.shots ? { ...this.shots.stats, lastTry: this.shots.lastTry } : null,
      cinema: { ...this.cinema.stats, band: this.band },
      living: [...this.living.values()].map((f) => ({ name: f.a.name, ...f.last })),
      defringed: this.defringed.size,
      twirl: this.twirl.stats,
      banner: { moved: this.banner.moved, lastTop: this.banner.lastTop },
      updateMs: this.costN ? +(this.cost / this.costN).toFixed(4) : 0,
    };
  }

  /** Checks only: `false` leaves the planes as a pose crossfade has them under a twirl key (round 19's frames). */
  setTwirlPin(on: boolean): void {
    this.twirl.pinOn = on;
  }

  /** Checks only: `false` lays a downed body blind to the HUD's panels, as before round 19 (PR-0318). */
  setBodyAvoid(on: boolean): void {
    this.bodyAvoid = on;
  }

  resetCost(): void {
    this.cost = 0;
    this.costN = 0;
  }

  dispose(): void {
    setProneAvoid(null);
    setShotHold(null);
    this.framing.dispose();
    this.roster.dispose();
    this.cinema.dispose();
    this.banner.dispose();
    this.twirl.dispose();
    for (const f of this.living.values()) f.detach();
    this.living.clear();
    for (const m of this.defringed) ejectDefringe(m);
    this.defringed.clear();
    this.heldLens = null;
    fightFacts.colossus = null;
    document.documentElement.classList.remove('mix-held');
  }
}

let current: Mix | null = null;

/** Called with LIVING PAINTINGS' scene bind (`LivingPaintings.bindLivingScene`); FFX and FFX-2 only. */
export function bindMaxMix(b: MixBind): void {
  releaseMaxMix();
  if (b.game !== 'ffx' && b.game !== 'ffx2') return;
  // A stub scene (the screen's unit tests) has no graph to dress.
  if (typeof b.scene?.add !== 'function' || typeof b.scene.traverse !== 'function') return;
  forgetMenuPanels();
  current = new Mix(b);
}

/** Every frame, after the rig has placed the camera and before the render. */
export function updateMaxMix(dt: number): void {
  current?.update(dt);
}

export function releaseMaxMix(): void {
  current?.dispose();
  current = null;
  releaseBreathRigs();
  releaseMixSplash();
}

/** Captures and checks only: switch parts through the EYE CANDY seam (`all` false = every part off). */
function provide(off: readonly string[] | boolean): void {
  if (off === true) setEyeCandyProvider(null);
  else if (off === false) setEyeCandyProvider(() => false);
  else setEyeCandyProvider((k: EyeCandyKey) => !off.includes(k));
}

fxDebugHooks['mix'] = {
  snapshot: () => current?.snapshot() ?? null,
  api: {
    /** `true`: every part on (no provider); `false`: every part off; a list: those keys off. */
    parts: (off: readonly string[] | boolean) => provide(off),
    keys: () => [...MIX_PARTS],
    snapshot: () => current?.snapshot() ?? null,
    resetCost: () => current?.resetCost(),
    twirlPin: (on: boolean) => current?.setTwirlPin(on),
    bodyAvoid: (on: boolean) => current?.setBodyAvoid(on),
  },
};
