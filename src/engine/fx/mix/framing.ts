import { anticipateView } from '../../StageArt.ts';
import type { Object3D, PerspectiveCamera } from 'three';
import { boxesOf, bossCoverOf, clearBoxes, downsOf, fitClear, limitsFor, overlapOf, type Field, type Fit, type Gate, type Limit, type PartyRule } from './clearance.ts';
import { cameraAt, figOf, stillActor, subjectId, type Actor, type Box, type Fig, type Pose } from './geometry.ts';
import { advisorReserve, battleCanvas, fieldOf, hudFree, hudPanels, menuOpen, noteMenuPanels, phoneBattle, predictedPanels, rememberedMenuPanels, sensorSlab } from './hudPanels.ts';
import { classify, keepsToday, master, scaleTarget, type MasterClass } from './masters.ts';
import { colossusExcess, gateNote, plateExcess, plateMiss, plateOf, restGap, shifted } from './plate.ts';
import type { FramingReport } from './framingReport.ts';
import { RigWatch, type BattleCameraLike } from './rigWatch.ts';
import { Staging } from './staging.ts';

/**
 * The MAX mix (D-316): CHAPTER FRAMING (BATTLE SPECTACLE's part; both games). The composed master per
 * chapter, ported from option C's prototype (`fx/max/c/DioramaDirector.ts`, mix refinement): the
 * colossus masters with BOSS SCALE for the giants, today's rig everywhere else (Vegnagun keeps D-228,
 * Sin its deck), and for every master, today's rig included, the menu clearance (`clearance.ts`) with
 * the judges' party-height floor, party-overlap and boss-cover checks and a static lens shift. When a
 * colossus cannot pass at its full size, BOSS SCALE steps down until it does (Braska's Final Aeon and
 * its pagodas, Evrae with the NEXT BEST MOVE card).
 *
 * Comfort (D-291): the calm camera stays the camera. The master is registered as the battle camera's
 * resting rig, so the battle-start move lands on it; it is planned during the battle-start moment, never
 * while a command menu is open. At each menu's opening the live frame is checked against the HUD as laid
 * out; a failure re-plans only once no menu is open (the next action), so a cut never lands while the
 * player is choosing. The HUD's resting projector is never handed anything but the master. Both happen
 * only on a calm frame: every figure at its place (no lunge, run or knockback in flight) and, for the
 * check, the camera on the master (Active ATB opens menus while an action plays; that frame is the
 * presenter's, and judging it re-planned Bahamut three times in a minute).
 *
 * Presentation only (rule 1): a figure's group scale and x offset, the camera's rigs and view offset;
 * never the engine, the RNG or a timer. Game case: both (FFX-2's own wider lens is in `masters.ts`).
 */

export type { FramingReport } from './framingReport.ts';

const FRACS = [1, 0.7, 0.45, 0.25, 0];

/** A decided master, waiting to be put on screen. */
interface Decision {
  /** Today's rig (the parts off, or an authored master). */
  keep: boolean;
  pose: Pose;
  lens: [number, number];
  plan: Map<Actor, { k: number; dx: number }>;
  today: Pose;
  rule: PartyRule | null;
  limitOf: Map<Actor, Limit | null>;
  report: Partial<FramingReport>;
}

export class Framing {
  readonly rigs: RigWatch | null;
  private readonly staging = new Staging();
  private installed = false;
  private wantOn = false;
  masterPose: Pose | null = null;
  todayPose: Pose | null = null;
  lens: [number, number] = [0, 0];
  /** Where the lens shift's travel to `lens` started (the last commit, or a later move that took over). */
  private lensFrom: [number, number] = [0, 0];
  /** The lens shift last put on screen, and the camera move it was travelling with. */
  private lensShown: [number, number] = [0, 0];
  private lensSeq = -1;
  private lensApplied = false;
  private planWanted = true;
  /** A plan decided on a calm frame while a menu was open: committed the first frame no menu is open. */
  private pending: Decision | null = null;
  private sig = '';
  private sigAt = 0;
  private time = 0;
  private wasMenu = false;
  private checks: number[] = [];
  private readonly limitOf = new Map<Actor, Limit | null>();
  private rule: PartyRule | null = null;
  readonly report: FramingReport = { cls: 'field', colossus: false, colossusFight: null, plans: 0, replans: 0, todayPx: 0, floorPx: 0, scale: 0, fit: null, plate: null, live: null, staging: {}, tries: [] };

  constructor(bc: BattleCameraLike | null, private readonly cam: PerspectiveCamera, private readonly game: 'ffx' | 'ffx2', private readonly scene: Object3D | null = null) {
    this.rigs = bc ? new RigWatch(bc, cam) : null;
  }

  /** True once a plan is installed (the master may be today's rig). */
  get ready(): boolean {
    return this.installed;
  }

  private layoutKey(canvas: HTMLElement): string {
    const r = canvas.getBoundingClientRect();
    return `${this.game}|${phoneBattle()}|${Math.round(r.width)}x${Math.round(r.height)}`;
  }

  /** The field with the panels a menu shows (remembered from an open menu in this layout, else predicted) and the advisor's band. */
  private field(canvas: HTMLElement): Field {
    const key = this.layoutKey(canvas);
    const seen = rememberedMenuPanels(key);
    const phone = phoneBattle();
    const panels = seen.length ? [...seen] : predictedPanels(this.game, window.innerWidth, window.innerHeight, phone);
    const reserve = advisorReserve(this.game, window.innerWidth, window.innerHeight, phone);
    if (reserve) panels.push(reserve);
    const sensor = this.report.colossusFight ? sensorSlab(this.game, window.innerWidth, window.innerHeight, phone) : null;
    if (sensor) panels.push(sensor);
    return fieldOf(canvas, panels);
  }

  /** Every frame, after the rig has placed the camera. `on`: CHAPTER FRAMING plays. */
  update(dt: number, actors: readonly Actor[], on: boolean): void {
    this.time += dt;
    if (on !== this.wantOn) {
      this.wantOn = on;
      this.planWanted = true;
    }
    const sig = actors.map(subjectId).sort().join(',');
    if (sig !== this.sig) {
      this.sig = sig;
      this.sigAt = this.time;
      // An arrival in the opening seconds (Mortiorchis, a second fiend) re-plans; later changes (a death,
      // a summon, a spherechange) keep the master: no cut on them, and the floor still holds.
      if (this.installed && this.time < 10) this.planWanted = true;
    }
    if (this.rigs?.baseChanged()) this.planWanted = true; // the scene re-registered its master (Evrae's range, the phone refit)
    const menu = menuOpen();
    const ready = actors.some((a) => a.facing >= 0) && actors.some((a) => a.facing < 0) && actors.every((a) => a.isPlaceholder !== true);
    // The plan measures the figures where they stand, so it is decided only when every one stands at its
    // place (a menu's lean included); it is put on screen only once no menu is open (no cut while choosing).
    if (ready && this.planWanted && this.time - this.sigAt >= 0.6 && this.calm(actors, false)) {
      const d = this.decide(actors);
      if (d) {
        this.planWanted = false;
        this.pending = d;
      }
    }
    if (this.pending && !menu) {
      const d = this.pending;
      this.pending = null;
      this.commit(d, actors);
    }
    if (!this.installed) return;
    this.staging.apply(actors, this.wantOn);
    // The live check, at each menu's opening and once more half a second in (the HUD settles), each on the
    // first calm frame from then on while the menu stays open.
    if (menu && !this.wasMenu) this.checks = [this.time + 0.05, this.time + 0.5];
    this.wasMenu = menu;
    if (!menu) this.checks = [];
    if (this.checks.length && this.time >= this.checks[0]! && this.calm(actors, true)) {
      this.checks.shift();
      if (this.checks.length) this.checks[0] = Math.max(this.checks[0]!, this.time + 0.45);
      this.liveCheck(actors);
    }
  }

  /** Every visible figure at its place and, with `camera`, the camera resting on the master (landed on it). */
  private calm(actors: readonly Actor[], camera: boolean): boolean {
    if (camera && this.rigs && (!this.rigs.atRest() || this.rigs.sinceInstall() < 1)) return false;
    return actors.every((a) => !a.visible || stillActor(a));
  }

  /**
   * The lens shift on screen now: the last master's, travelling to this one's with the camera's move onto it; a
   * move that takes over half way carries it on from where it is (never back to the start).
   */
  lensNow(): [number, number] {
    const r = this.rigs;
    const p = r?.sinceInstall() ?? 1;
    if (r && p < 1 && r.moveSeq !== this.lensSeq) {
      this.lensSeq = r.moveSeq;
      this.lensFrom = [this.lensShown[0], this.lensShown[1]];
    }
    this.lensShown = [this.lensFrom[0] + (this.lens[0] - this.lensFrom[0]) * p, this.lensFrom[1] + (this.lens[1] - this.lensFrom[1]) * p];
    return this.lensShown;
  }

  /**
   * The master's lens shift on the camera (call after any held shot has been written). `hold`: the lens shift a
   * held shot was framed against, which stays on screen for as long as the shot does (a shot is one static cut).
   */
  applyLens(on: boolean, hold: readonly [number, number] | null = null): void {
    const canvas = battleCanvas();
    const lens = hold ?? this.lensNow();
    const want = on && this.wantOn && this.installed && (lens[0] !== 0 || lens[1] !== 0) && !!canvas;
    if (want && canvas) {
      const r = canvas.getBoundingClientRect();
      const W = r.width || window.innerWidth;
      const H = r.height || window.innerHeight;
      this.cam.setViewOffset(W, H, -lens[0], -lens[1], W, H);
      this.lensApplied = true;
    } else if (this.lensApplied) {
      this.cam.clearViewOffset();
      this.lensApplied = false;
    }
  }

  private visible(actors: readonly Actor[]): { figs: Fig[]; vis: Actor[] } {
    const vis = actors.filter((a) => a.visible);
    return { figs: vis.map(figOf), vis };
  }

  /**
   * Decide the master (once the field has loaded): stage the figures, author the master, or keep today's.
   * The figures are left exactly as they were found; `commit` puts the decision on screen.
   */
  private decide(actors: readonly Actor[]): Decision | null {
    const rigs = this.rigs;
    const canvas = battleCanvas();
    if (!rigs || !canvas) return null;
    const base = rigs.base('idle');
    if (!base) return null;
    const enemies = actors.filter((a) => a.facing < 0).map(subjectId);
    const cls = classify(enemies);
    // Vegnagun's approved D-228 rig (field of view 40) and Sin's deck are authored colossus masters: the
    // fight keeps them exactly, clearance and all (the party stands whole and clear in them today).
    const keep = keepsToday(enemies);
    this.report.colossusFight = cls === 'colossus' && !keep;
    if (!this.wantOn || keep) {
      // Nothing to check against: today's rig is the master.
      return { keep: true, pose: base, lens: [0, 0], plan: new Map(), today: base, rule: null, limitOf: new Map(), report: { tries: [keep && this.wantOn ? 'keeps today (D-228 / Sin)' : 'off'] } };
    }
    const before = new Map([...this.staging.plan].map(([a, p]) => [a, { ...p }] as const));
    this.staging.release();
    const field = this.field(canvas);
    // Today: the figures as the stage left them, under today's rig, give the limits and the party rule.
    const { figs: todayFigs, vis } = this.visible(actors);
    const { limits, rule, todayPx } = limitsFor(todayFigs, base, field);
    const limitOf = new Map<Actor, Limit | null>();
    vis.forEach((a, i) => limitOf.set(a, limits[i] ?? null));
    const lims = limits.map((l, i) => (l ? `${todayFigs[i]!.id}:${l.inView.toFixed(2)}/${l.underHud.toFixed(2)}` : '')).filter(Boolean);
    const log = [`rule floor${Math.round(rule.floorPx)} ov${rule.overlapMax.toFixed(2)} bc${rule.bossCoverMax.toFixed(2)} ${lims.join(',')}`];
    // On an upright phone the scene fits its own rig to the slice (A-12) after the figures are staged, so a
    // grown boss would stand the whole rig back and shrink the party under its floor (the prototype's Evrae:
    // 105 -> 91 px): the phone keeps today's rig and its own fit, with the menu clearance on top.
    const colossus = this.report.colossusFight === true && !phoneBattle();
    // The colossus master at full BOSS SCALE, then smaller steps, then today's rig itself, then today's rig
    // with the party stepped toward the enemies (out from under the command menu on the left): the first
    // that passes, else the least bad (today's rig is among the candidates, so the result is never worse).
    const today0 = { frac: -1, colossus: false, partyDx: 0 };
    const steps = [0.35, 0.7].map((partyDx) => ({ frac: -1, colossus: false, partyDx }));
    const tries = [...(colossus ? FRACS.map((frac) => ({ frac, colossus: true, partyDx: 0 })) : []), today0, ...steps];
    let chosen: { fit: Fit; frac: number; gap: number; plan: Map<Actor, { k: number; dx: number }> } | null = null;
    // Fail closed (round 19): a pose that shows more of the plate's edge than today's rig (PR-0307) or, for a colossus
    // master, leaves a member inside a boss at rest (PR-0310) is held; today's rig is always a candidate that passes both.
    const plate = plateOf(this.scene);
    const plateToday = plate ? plateMiss(plate, base, field.W, field.H) : null;
    const cr = canvas.getBoundingClientRect();
    const sensor = this.report.colossusFight ? sensorSlab(this.game, window.innerWidth, window.innerHeight, phoneBattle()) : null;
    const slab = sensor ? { l: sensor.l - cr.left, r: sensor.r - cr.left, t: sensor.t - cr.top, b: sensor.b - cr.top } : null;
    for (const t of tries) {
      this.staging.clearPlan();
      let m: Pose = base;
      if (t.colossus) {
        this.staging.planScale(actors, base.pos, scaleTarget, t.frac);
        this.staging.apply(actors, true);
        m = this.separate(actors, cls, base, field, rule);
      } else {
        if (t.partyDx) for (const a of actors) if (a.facing >= 0) this.staging.plan.set(a, { k: 1, dx: t.partyDx });
        this.staging.apply(actors, true);
      }
      const figs = this.visible(actors).figs;
      const gate: Gate = (pose, lens, boxes) => plateExcess(plate, plateToday, pose, field.W, field.H, lens) + (t.colossus ? colossusExcess(boxes, figs, slab, field.W) : 0);
      const fit = fitClear(m, base, figs, field, true, limits, rule, gate);
      log.push(`${t.frac}:${fit.clear.ok && fit.gate === 0 ? 'ok' : 'x'}${fit.gate > 0 ? ' gate' + fit.gate.toFixed(3) + ' ' + gateNote(shifted(boxesOf(cameraAt(fit.pose, field.W / field.H), figs, field), fit.lens), figs, slab) : ''} w${fit.clear.worst.toFixed(2)} px${Math.round(fit.clear.partyPx)} ov${fit.clear.overlap.toFixed(2)} bc${fit.clear.bossCover.toFixed(2)} ${fit.clear.figs.filter((r) => r.underHud > 0.06 || r.inView < 0.97).map((r) => `${r.id}:${r.inView}/${r.underHud}`).join(',')}`);
      if (!chosen || fit.score > chosen.fit.score) chosen = { fit, frac: t.frac, gap: Math.round(restGap(shifted(boxesOf(cameraAt(fit.pose, field.W / field.H), this.visible(actors).figs, field), fit.lens), this.visible(actors).figs)), plan: new Map([...this.staging.plan].map(([a, p]) => [a, { ...p }])) };
      if (fit.clear.ok && fit.gate === 0) break;
    }
    const pick = chosen!;
    // The figures back as they were found (the search staged every candidate on them, within this frame).
    this.staging.release();
    for (const [a, p] of before) this.staging.plan.set(a, p);
    this.staging.apply(actors, this.wantOn);
    const f = pick.fit.clear;
    const report: Partial<FramingReport> = {
      cls,
      colossus,
      todayPx: Math.round(todayPx),
      floorPx: Math.round(rule.floorPx),
      scale: pick.frac,
      fit: { ok: f.ok, partyPx: Math.round(f.partyPx), overlap: +f.overlap.toFixed(2), bossCover: +f.bossCover.toFixed(2), blend: pick.fit.blend, back: pick.fit.back, lens: pick.fit.lens, figs: f.figs, gate: +pick.fit.gate.toFixed(3), down: f.down },
      plate: plate && plateToday ? { chosen: +plateMiss(plate, pick.fit.pose, field.W, field.H, pick.fit.lens).share.toFixed(3), today: +plateToday.share.toFixed(3), corners: plateMiss(plate, pick.fit.pose, field.W, field.H, pick.fit.lens).corners, todayCorners: plateToday.corners, restGap: pick.gap } : null,
      tries: log,
    };
    return { keep: false, pose: pick.fit.pose, lens: pick.fit.lens, plan: pick.plan, today: base, rule, limitOf, report };
  }

  /** Put a decision on screen: the staging, the master as the resting rig (a cut if the camera rests on it), the lens. */
  private commit(d: Decision, actors: readonly Actor[]): void {
    const rigs = this.rigs;
    if (!rigs) return;
    this.report.plans++;
    this.todayPose = d.today;
    this.staging.release();
    for (const [a, p] of d.plan) this.staging.plan.set(a, { ...p });
    this.staging.apply(actors, true);
    this.masterPose = d.pose;
    anticipateView(d.pose); // release 39: the master the camera is about to rest on, so its figures' paintings are the right size when it lands
    this.lensFrom = this.lensApplied ? [...this.lensNow()] : [0, 0];
    this.lensShown = [this.lensFrom[0], this.lensFrom[1]];
    this.lensSeq = rigs.moveSeq;
    this.lens = d.lens;
    this.rule = d.rule;
    this.limitOf.clear();
    for (const [a, l] of d.limitOf) this.limitOf.set(a, l);
    const lensMoved = Math.abs(this.lens[0] - this.lensFrom[0]) + Math.abs(this.lens[1] - this.lensFrom[1]) > 0.5;
    rigs.install(d.pose, !d.keep);
    if (lensMoved && rigs.sinceInstall() >= 1) rigs.holdUntilMove(); // the rig itself unchanged: the lens waits for the camera too
    this.installed = true;
    Object.assign(this.report, d.report, { staging: this.staging.stats() });
    if (d.keep) this.applyLens(false);
  }

  /**
   * The colossus master with the party spread and the sides stepped apart (the judges' Evrae and Bahamut
   * findings): spread until nobody hides another more than the rule allows, and step the boss away until
   * no member stands inside its painted box, both as seen from the master.
   */
  private separate(actors: readonly Actor[], cls: MasterClass, base: Pose, field: Field, rule: PartyRule): Pose {
    const free = hudFree(field.W, field.H);
    const plan = (): Pose => master({ cls, game: this.game, base, figs: this.visible(actors).figs, W: field.W, H: field.H, free });
    let m = plan();
    const cap = this.game === 'ffx2' ? 1.6 : 1.4;
    let spread = this.game === 'ffx2' ? 1.15 : 1;
    let apart = 0;
    // The step apart scales with the boss (Evrae stands far down the deck, so a step must be a big one).
    const bossH = Math.max(1, ...this.visible(actors).figs.filter((f) => f.enemy).map((f) => f.h));
    const apartMax = 0.3 * bossH;
    for (let i = 0; i < 8; i++) {
      const { figs } = this.visible(actors);
      const boxes = boxesOf(cameraAt(m, field.W / field.H), figs, field);
      const needSpread = overlapOf(boxes, figs, m.pos) > rule.overlapMax && spread < cap - 1e-6;
      const needApart = bossCoverOf(boxes, figs) > rule.bossCoverMax && apart < apartMax - 1e-6;
      if (!needSpread && !needApart && i > 0) break;
      if (needSpread) spread = Math.min(cap, spread + 0.08);
      if (needApart) apart = Math.min(apartMax, apart + apartMax / 6);
      this.staging.planSpread(actors, spread);
      for (const a of actors) {
        const p = this.staging.plan.get(a) ?? { k: 1, dx: 0 };
        if (a.facing < 0) p.dx = apart;
        else p.dx -= apart * 0.3;
        this.staging.plan.set(a, p);
      }
      this.staging.apply(actors, true);
      m = plan();
    }
    return m;
  }

  /** At a menu's opening: the live camera and the drawn quads against the HUD as laid out. */
  private liveCheck(actors: readonly Actor[]): void {
    const canvas = battleCanvas();
    if (!canvas || !this.wantOn || !this.todayPose || !this.rule) return;
    noteMenuPanels(hudPanels(canvas), this.layoutKey(canvas));
    const field = this.field(canvas);
    this.cam.updateMatrixWorld();
    const { figs, vis } = this.visible(actors);
    const boxes = boxesOf(this.cam, figs, field);
    const cl = clearBoxes(boxes, figs, this.cam.position, field, [0, 0], vis.map((a) => this.limitOf.get(a) ?? null), this.rule, downsOf(this.cam, figs, field));
    this.report.live = { ok: cl.ok, partyPx: Math.round(cl.partyPx), overlap: +cl.overlap.toFixed(2), bossCover: +cl.bossCover.toFixed(2), figs: cl.figs, down: cl.down };
    // A failure for the PARTY (under a panel, out of view, below the floor, hidden) re-plans with the panels
    // now known; the new master goes on screen once no menu is open (never a cut while choosing). A boss
    // part is held to today's rig by the plan itself; the live frame only reports it, so a colossus master
    // is not swapped mid-fight.
    const partyFail = !cl.floorOk || !cl.overlapOk || cl.figs.some((r) => !r.enemy && (r.inView < 0.97 || r.underHud > 0.06));
    if (partyFail && this.report.replans < 3 && !this.planWanted && !this.pending) {
      this.planWanted = true;
      this.report.replans++;
    }
  }

  /** The figures' current screen boxes under the live camera (field px), for the held shots' checks. */
  liveBoxes(actors: readonly Actor[]): { field: Field; figs: Fig[]; boxes: Box[] } | null {
    const canvas = battleCanvas();
    if (!canvas) return null;
    const field = this.field(canvas);
    const { figs } = this.visible(actors);
    return { field, figs, boxes: boxesOf(this.cam, figs, field) };
  }

  dispose(): void {
    this.applyLens(false);
    this.rigs?.dispose();
    this.staging.release();
  }
}
