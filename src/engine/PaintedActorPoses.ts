/**
 * The poses: loading and adopting a pose set, which painting is drawn for a request, the crossfade and its smear, the aligned dissolve and the victory cheer.
 *
 * `PaintedActor` was one 2,700-line class. It is now a chain of classes, one responsibility each, every layer calling only the layers below it:
 * `PaintedActorState` (the fields that start at rest) -> `PaintedActorBase` (the other fields, the constructor) -> `PaintedActorPlacement` -> `PaintedActorSizing` -> `PaintedActorEffects` -> `PaintedActorLife` -> `PaintedActorPoses` -> `PaintedActorReaders` -> `PaintedActor`
 * (import that one from `PaintedActor.ts`). A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * The constructor calls eight methods that live in later layers; `PaintedActorBase` declares them abstract.
 */

import { lifeStateForPose, nextLifeState, resolvePoseName } from './BattlePresenterActors.ts';
import { loadPainted, type PaintedTexture } from './PaintedArt.ts';
import { WITHHELD_FALLBACKS } from './PoseTrust.ts';
import { newMotionOn } from './motion/NewMotionGate.ts';
import { SmearDirector } from './motion/SmearDirector.ts'; // motion pass (lane "core", step 2): big pose changes cut inside a smear; idle unless `?smear=`/`?pack=demo` in a demo chapter (`motion/SmearSwitch.ts`)
import { momentsGame } from './motion/MomentsSwitch.ts'; // motion pass (lane "core", step 3): the per-game moments (victory, KO settle); default OFF
import { startCheer } from './motion/ActorMoments.ts';
import type { BlendStarted } from './PoseBlend.ts';
import { footprintOverlap, meetingOffsets, planeAnchor, type Footprint } from './PoseAlign.ts'; // W5: the aligned dissolve's geometry
import { alignedSwapOn, notePoseSwap, swapPolicy } from './PoseSwap.ts'; // W5: `?swap=aligned` (off by default), and the lunge's first frame (on; `?motion=classic` restores cubic-out)
import { demoMotionOn } from './motion/DemoMotion.ts'; // `?motion=demo` (conference demo; default off = exactly as before): the four hooks below
import { BLEND_MS_MAX, demoBlend } from './motion/DemoBlend.ts';
import { demoIdleParams, nextIdlePhase, swayClockStart } from './motion/DemoIdle.ts';
import { prefetchRelight } from './look/relight/FigureRelight.ts'; // demo looks (dev flag `?look=`): light on the paintings, from their normal maps
import type { PoseMap, PoseSwapOptions } from './PaintedActorTypes.ts';
import { PaintedActorLife } from './PaintedActorLife.ts';

export abstract class PaintedActorPoses extends PaintedActorLife {
  /** `?motion=demo` (part 3, `motion/DemoIdle.ts`): this figure's breath and sway, from its name, on the next phase dealt. Rigs with an idle of their own turn the layer off before this runs. */
  protected demoIdle(breathes: boolean, sways: boolean): void {
    const d = demoIdleParams(this.name);
    const phase = nextIdlePhase();
    if (breathes) {
      this.breatheAmp = d.amplitude;
      this.breatheSpeed = d.speed;
      this.breathPhase = phase;
    }
    if (sways) {
      this.swayAmp = d.swayAmplitude;
      this.swaySpeed = d.swaySpeed;
      this.clock = swayClockStart(phase, d.swaySpeed);
    }
    this.userData['idlePhase'] = phase; // LIVING PAINTINGS' chest breath starts on the same phase (`fx/mix/living.ts`)
  }

  /**
   * Load a `{ pose: url }` map. Every entry resolves — a missing PNG becomes a
   * placeholder with a console warning — so this never rejects.
   */
  async loadPoses(poses: PoseMap, initial?: string, opts?: PoseSwapOptions): Promise<void> {
    // `blend`: only the paintings that change are loaded, so a plane that shows one of the others goes on showing exactly what it shows
    const names = Object.keys(poses).filter((n) => !opts?.blend || this.poseUrls[n] !== poses[n]);
    if (opts?.blend && !names.length) return; // nothing changed
    // One texture per file (r35, D-315): a pose that falls back to idle shares idle's texture
    // instead of uploading the same pixels again, which a 2x master would make four times dearer.
    const byUrl = new Map<string, Promise<PaintedTexture>>();
    const load = (u: string): Promise<PaintedTexture> =>
      byUrl.get(u) ?? byUrl.set(u, loadPainted(u, this.placeholderFactory, (c) => c.height * this.placeholderBaseline, this.matte, this.fitBaseline)).get(u)!;
    const loaded = await Promise.all(names.map((n) => load(poses[n]!)));
    const previous = names.map((n) => this.poses.get(n));
    names.forEach((n, i) => {
      this.poses.set(n, loaded[i]!);
      this.owned.add(loaded[i]!.texture);
      this.poseUrls[n] = poses[n]!;
    });
    previous.forEach((p) => this.retire(p));
    this.pickReference();
    this.resize();
    this.prefetchLights();
    const first = initial ?? (this.poses.has('idle') ? 'idle' : names[0]);
    // `force`, because re-loading a pose set (a stand-in being swapped for the
    // real painting) keeps the same pose *name* with a different texture.
    if (first) this.showPoseSet(first, opts?.blend === true);
  }

  /**
   * Put `first` up after a pose set was replaced. By default at once and forced, as the loader always has (a stand-in swapped for the real painting keeps
   * the pose NAME and changes the texture under it; the range director's range change does it behind the figure's own fade).
   *
   * With `blend` (r43-motion2, both games; round 25's three boss cast-to-idle hard cuts): the figure is on screen in the middle of an action, and the
   * forced cut threw away the pose the presenter had put it in (Evrae's Inhale and each Fin's "Core gathers energy." swap the IDLE slot for the charge
   * painting while the figure shows `cast`: a whole-silhouette change in one frame, 346 px for the Right Fin). The planes that show a replaced painting
   * take the new one where they stand (same name, same fade: nothing moves on screen), then `first` comes up through the actor's own blend like every
   * other pose change. A figure already resting on `first` takes the new painting in place: it is one name, so there is nothing to blend between.
   */
  private showPoseSet(first: string, blend: boolean): void {
    if (!blend) {
      this.setPose(first, { immediate: true, force: true });
      return;
    }
    this.slots.forEach((slot, i) => {
      const now = this.poses.get(slot.pose);
      if (now && slot.painted !== now) this.applyPose(i, slot.pose, now);
    });
    this.setPose(first, { force: true });
  }

  /**
   * Adopt textures that were already loaded — what
   * {@link PaintedActor.fromSubject} uses, and the way to share one load
   * between several actors (a stand-in party member borrowing the hero's
   * painting, for instance).
   *
   * Several names may point at the same {@link PaintedTexture}; that is exactly
   * what a state falling back to `idle` looks like.
   */
  adoptPoses(poses: Record<string, PaintedTexture>, initial?: string, opts?: PoseSwapOptions): void {
    const names = Object.keys(poses).filter((n) => !opts?.blend || this.poses.get(n) !== poses[n]);
    if (!names.length) return;
    for (const name of names) {
      const tex = poses[name]!;
      this.retire(this.poses.get(name));
      this.poses.set(name, tex);
      this.poseUrls[name] = tex.url;
    }
    this.pickReference();
    this.resize();
    this.prefetchLights();
    const first = initial ?? (this.poses.has('idle') ? 'idle' : names[0]);
    if (first) this.showPoseSet(first, opts?.blend === true);
  }

  /**
   * Motion pass, step 2 (MAP fact 11): fetch and PIN the normal map of every pose this figure can draw as soon as its paintings are staged, so no pose is drawn unlit at first use (a pose
   * is unlit until its map arrives, and the cache used to let a staged figure's map go). Nothing happens unless the HD-2D look is armed; the pins are let go in {@link dispose}.
   */
  private prefetchLights(): void {
    if (!this.showFigure || !newMotionOn()) return; // a rig's carrier plane is never drawn: its parts bring their own pieces; with every new piece off (the default, and any chapter but I and IV) nothing is fetched early
    for (const p of this.poses.values()) prefetchRelight(p.url, p.scale, p.placeholder, this.lightPins);
  }

  /** Re-load one pose from disk; used by the dev hot-swap watcher. */
  async reloadPose(name: string, url?: string): Promise<boolean> {
    const target = url ?? this.poseUrls[name];
    if (!target) return false;
    const next = await loadPainted(
      target,
      this.placeholderFactory,
      (c) => c.height * this.placeholderBaseline,
      this.matte,
      this.fitBaseline,
      // The hot-swap watcher only ever calls this for a file it has just seen
      // appear, which is by definition newer than the build-time art manifest.
      { ignoreManifest: true },
    );
    const previous = this.poses.get(name);
    this.poses.set(name, next);
    this.owned.add(next.texture);
    this.poseUrls[name] = target;
    // The hot-swapped pose may *be* the reference (idle landing at last), in
    // which case every other plane has to be re-sized against it.
    this.pickReference();
    this.resize();
    if (this.pose === name) this.setPose(name, { immediate: true, force: true });
    this.retire(previous);
    return !next.placeholder;
  }

  /** The pose currently showing. */
  get pose(): string {
    return this.slots[this.active]!.pose;
  }

  /**
   * Crossfade to a pose, and live it.
   *
   * The name is both a painting and a *state*: `setPose('ready')` leans the
   * fighter forward and lights the turn ring, `setPose('ko')` drops the body,
   * `setPose('victory')` swaps the pose on a small hop. See
   * {@link import('./BattlePresenterActors.ts').lifeStateForPose}. A pose with
   * no painting of its own still changes the state — it falls back to the
   * nearest one there is, which is how a subject loaded with `states: ['idle']`
   * can still be asked to celebrate.
   */
  setPose(name: string, opts?: { immediate?: boolean; force?: boolean; paint?: string }): void {
    // A body on the ground is allowed to ignore the pose it was handed. The
    // one case is a hit landing on someone who is already KO'd: the presenter
    // still names `hurt` for it, and wincing (never mind the sit-up the rise
    // cue would put under it) is not what a corpse does. Staging (`immediate`)
    // is exempt — that is the caller declaring the state, not the fight.
    const life = this.life;
    if (life && !opts?.immediate) {
      const want = lifeStateForPose(name);
      if (nextLifeState(life.state, want) !== want) return;
    }
    if (this.cheerWait && !this.cheering) {
      if (name === this.cheerWait.name) return; // the cheer is already on its way to this painting
      this.cheerWait = null; // anything else the presenter asks for ends the wait (the cheer still lands, without its swap)
    }
    // A forced pose is the caller's word: a pending flinch may not hand it back.
    if (opts?.force) this.flinchToken++;
    const resolved = this.resolveDrawable(opts?.paint ?? name);
    this.enterLife(name, opts?.immediate === true);
    if (this.cheerDue && this.beginCheer(name, opts, resolved)) return; // the victory painting waits for the spring's fastest frame
    if (!resolved) return;
    const next = this.poses.get(resolved);
    if (!next) return;
    const already = this.requested === name && this.pose === resolved;
    this.requested = name;
    this.requestedPaint = opts?.paint;
    if (already && !opts?.force) return;

    const from = this.active;
    if (opts?.immediate || this.crossfadeMs <= 0) {
      const to = from === 0 ? 1 : 0;
      this.blend.cancel();
      this.applyPose(to, resolved, next);
      this.slots[to]!.fade = 1;
      this.slots[from]!.fade = 0;
      this.active = to;
      this.syncOpacity();
      return;
    }

    // FB-1 (`PoseBlend.ts`): the blend is owned, not a loose tween. A request in mid-blend keeps the stronger plane going out and re-points only the weaker.
    const plan = this.blend.request(resolved, this.crossfadeMs, from === 0 ? 0 : 1);
    if (plan.same) return; // also a request PoseBlend rule 2 holds (`plan.deferred`): the blend takes it up in `update` once it can without dropping a painting that still shows
    this.beginBlend(resolved, next, plan);
  }

  /**
   * Motion pass, step 3 (`motion/ActorMoments.ts`): the victory cue fired inside `enterLife`, so the cheer starts (after the fighter's own stagger, as the hop always did). True when the victory
   * painting is held back until the spring's fastest frame, where the actor's smear can cut to it; false when it can swap now (it is showing, has no other painting, or the fade is a cut).
   */
  private beginCheer(name: string, opts: { immediate?: boolean; force?: boolean } | undefined, resolved: string | null): boolean {
    this.cheerDue = false;
    const swap = resolved !== null && resolved !== this.pose && !opts?.immediate && this.crossfadeMs > 0;
    if (swap) this.cheerWait = { name, opts };
    this.after(this.beatOffset * 240, () => void startCheer(this.momentsHost(), momentsGame(), swap ? () => this.landCheer() : null));
    return swap;
  }

  /** The cheer's spring is at its fastest: make the pose request the cheer held back (it is a cut inside a smear when the smear is on, else the usual blend). */
  private landCheer(): void {
    const w = this.cheerWait;
    this.cheerWait = null;
    if (!w) return;
    this.cheering = true;
    try {
      this.setPose(w.name, w.opts);
    } finally {
      this.cheering = false;
    }
  }

  /** Point the plane a blend is bringing in at its painting (when it was re-pointed) and make it the active one: the tail of a pose change, whether it began now or was held. */
  protected beginBlend(resolved: string, next: PaintedTexture | undefined, plan: BlendStarted): void {
    if (!plan.reversed && next) this.applyPose(plan.to, resolved, next);
    this.active = plan.to;
    if (!plan.reversed && alignedSwapOn()) this.alignedSwap(plan.to); // W5: `?swap=aligned` only: the heads drift together
    if (!plan.reversed && !this.smear.swap(plan.to, resolved) && demoMotionOn()) this.demoRetune(plan.to, resolved); // a big change on a moving figure is cut inside a smear (`motion/SmearDirector.ts`); else the demo's blend
    this.syncOpacity();
  }

  /**
   * `?motion=demo` (part 1, `motion/DemoBlend.ts`): the blend just started takes its length and shape from how well the two paintings, as placed, overlap. A cut (`crossfadeMs` 0, FF7's) stays a
   * cut and so does a scene's own long dissolve (past the demo's longest).
   */
  private demoRetune(to: 0 | 1, resolved: string): void {
    if (this.crossfadeMs <= 0 || this.crossfadeMs > BLEND_MS_MAX || this.poseShiftPx) return;
    const inn = this.slots[to]!;
    const out = this.slots[to === 0 ? 1 : 0]!;
    const b = demoBlend({ side: this.blendSide, to: resolved, overlap: footprintOverlap(this.footprintOf(out), this.footprintOf(inn)) });
    this.blend.retune(b.ms, b.shape);
  }

  /**
   * W5 (`PoseSwap.ts`, `?swap=aligned`; both games): decide how the pair of paintings that has just been put on the two planes changes places. The incoming plane `to` is placed
   * and head-locked and shows nothing yet. `aligned` gives each plane the shift that brings its anchor to the meeting point (applied per frame from the fades, `alignPlanes`);
   * `dissolve` leaves today's plain cross-fade.
   */
  private alignedSwap(to: 0 | 1): void {
    if (this.poseShiftPx || this.crossfadeMs <= 0) return;
    const inn = this.slots[to]!;
    const out = this.slots[to === 0 ? 1 : 0]!;
    const fi = this.footprintOf(inn);
    const fo = this.footprintOf(out);
    const ai = planeAnchor(fi);
    const ao = planeAnchor(fo);
    const m = ai && ao ? meetingOffsets(ao, ai) : null;
    const shifted = (p: Footprint, by: number): Footprint => ({ ...p, cx: p.cx + by });
    const facts = {
      overlap: footprintOverlap(fo, fi),
      overlapAligned: m ? footprintOverlap(shifted(fo, m.out), shifted(fi, m.inn)) : null,
      anchorDistance: m ? m.distance / Math.max(1e-6, this.worldHeight) : null,
    };
    const policy = swapPolicy(facts);
    if (policy === 'aligned' && m) {
      out.meet = m.out;
      inn.meet = m.inn;
      this.alignPlanes();
    }
    this.swapPolicyLast = policy;
    notePoseSwap(policy, [ao?.source ?? null, ai?.source ?? null], { actor: this.name, from: out.pose, to: inn.pose, overlap: facts.overlap, overlapAligned: facts.overlapAligned, distance: facts.anchorDistance });
  }

  /** The smear director's view of this actor (`motion/SmearDirector.ts`; motion pass, lane "core", step 2). */
  protected makeSmear(): SmearDirector {
    return new SmearDirector({
      name: () => this.name,
      worldHeight: () => this.worldHeight,
      planes: this.slots, cells: this.u, blend: this.blend,
      showing: () => this.active,
      poseOf: (i) => this.slots[i]!.pose,
      footprintOf: (i) => this.footprintOf(this.slots[i]!),
      canCut: () => this.smearsPlanes() && this.crossfadeMs > 0 && this.crossfadeMs <= BLEND_MS_MAX && !this.poseShiftPx,
      flash: (c, ms, peak) => this.flash(c, ms, peak),
      flashBlocked: () => this.softFlash?.() === true || this.flashTween !== null,
      shiftPlane: (i, dx) => { const s = this.slots[i]!; s.align = dx; this.placeSlot(s); }, // MF-18 (`motion/CutAnchor.ts`): a big cut's incoming plane eases home from the old head
    });
  }

  /** False for a figure whose planes are not what is drawn (a rig: its parts are, and `RigActor` runs its own smear). */
  protected smearsPlanes(): boolean {
    return true;
  }

  /** The figure's height in world units, for a subclass (a rig's smear). */
  protected get bodyHeight(): number {
    return this.worldHeight;
  }

  /**
   * Pose continuity (2026-10-16; `PoseTrust.ts`): whether the pose `name` can be drawn at all: a painting is loaded for it and the install vouched for that painting.
   * `resolvePoseName` asks this instead of `poses.has`, so a withheld painting (blocked, or never registered) is skipped and the figure shows the next
   * pose down its chain, ending on the idle. A painting with no trust stamp (a stand-in, a hand-made meta in a test) is drawn as it always was.
   * **The `idle` slot is never withheld**, whatever painting it holds: it is the reference every other pose is sized and placed against, and a scene
   * puts a differently named painting in it on purpose (`idle-far`, a Fin's `charge-far`, Sin's `stage-2`: `restPoseMap`), so withholding it would leave the figure with nothing.
   */
  private canDraw(name: string): boolean {
    const p = this.poses.get(name);
    return !!p && (name === 'idle' || p.meta.trust?.trusted !== false);
  }

  /**
   * The pose that gets drawn for a request: {@link resolvePoseName} over the paintings the runtime vouches for. A pose with a painting that is withheld
   * and no chain of its own (`telegraph`, `critical`, `follow`: names {@link POSE_FALLBACKS} does not list) follows {@link WITHHELD_FALLBACKS} (`follow`
   * to the attack, the ready, the idle) or goes to the idle, rather than being ignored: that is what "treated as missing" means for it. A pose that simply
   * has no painting is answered as it always was.
   */
  protected resolveDrawable(name: string): string | null {
    const resolved = resolvePoseName(name, (p) => this.canDraw(p));
    if (resolved || !this.poseWithheld(name)) return resolved;
    return (WITHHELD_FALLBACKS[name] ?? ['idle']).find((p) => this.canDraw(p)) ?? (this.canDraw('idle') ? 'idle' : null);
  }

  /** True when a painting is loaded for the pose `name` and the runtime withholds it as untrusted: the KO path asks (`KoFallback.lacksKoPainting`). */
  poseWithheld(name: string): boolean {
    return this.poses.has(name) && !this.canDraw(name);
  }

  poseLife(name: string, opts?: { immediate?: boolean; force?: boolean }): void { PaintedActorPoses.prototype.setPose.call(this, name, opts); } // MF-11: the pose request without a subclass's key move
}
