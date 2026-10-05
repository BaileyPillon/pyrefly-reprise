/**
 * CAMERA LAB: the cut rules, as a pure state machine (no `three`, no DOM, clock injected).
 *
 * The presenter's beats ({@link LabBeat}) and the HUD's menu state come in; at most one cut
 * per frame comes out of {@link LabDirectorCore.due}. The rules every shot obeys
 * (`docs/plans/camera-lab-review.md`, "Rules for every shot"):
 *
 * - **A cut is instant.** This module only ever names a shot; the three-side director snaps to it.
 * - **A shot holds at least 1.2 s unless its beat ends first.** Inside one beat (the spell's
 *   caster/impact pair) the second shot waits for the hold. A new beat may cut at once.
 * - **At most one cut per beat**, the spell pair excepted.
 * - **FFX-2 never cuts while a menu is open** (D-316): the master lands as the menu opens and
 *   holds; an enemy acting under the open menu plays on the master.
 * - **The lab yields** to the presenter's own authored moments (the opening, a telegraph, a
 *   form change, a scripted camera, a mid-battle scene, the defeat) until its next beat.
 * - Playback speed scales every wait; at `'skip'` nothing cuts.
 *
 * Game case (rule 14): both games, as a test; the FFX-2 menu rule is FFX-2 only, the per-turn
 * hero shot and the menu-level shots are FFX only (FFX-2 has one master and no hand-off).
 */

import type { LabBeat, LabGame, LabSwitches, ShotRequest } from './LabTypes.ts';
import { sameShot } from './LabTypes.ts';
import { masterShot, menuShot, opensSpellPair, shotForBeat, type GrammarBeat, type GrammarContext } from './shotChoice.ts';

/** The shortest a shot holds inside its own beat, in ms at normal speed. */
export const MIN_HOLD_MS = 1200;
/** A target highlight settles this long before its cut, so a run of arrow presses does not strobe. */
export const TARGET_DEBOUNCE_MS = 120;
/** A spell with no damage numeral (a heal) still gets its impact shot this long after the caster cut. */
export const SPELL_IMPACT_FALLBACK_MS = 1450;

export interface LabDirectorCoreOptions {
  game: LabGame;
  /** Milliseconds, monotonic. */
  now: () => number;
  switches: () => LabSwitches;
  /** 1 at normal playback, 0.32 fast-forward, 0 at `'skip'` (`SPEED_SCALE`). */
  speedScale: () => number;
  /** The headline boss (what a hero shot looks past). */
  bossId: () => string | null;
  /** True when every standing party figure can show its rear painting now. */
  allPartyRear: () => boolean;
  /** Which side a combatant is on. */
  sideOf: (id: string) => 'party' | 'enemy' | 'aeon' | null;
  /** The chapter's boss specials (Mega Flare, Total Annihilation...), by ability id or name. */
  bigAbility: (abilityId: string | null, abilityName: string | null) => boolean;
}

/** A cut the three-side director performs now. */
export interface LabCut {
  shot: ShotRequest;
  beat: number;
  why: string;
}

interface Pending {
  shot: ShotRequest;
  dueAt: number;
  beat: number;
  why: string;
  /** The FFX-2 master that lands as a menu opens: allowed although the menu is (about to be) open. */
  menuOpening?: boolean;
}

export class LabDirectorCore {
  private readonly o: LabDirectorCoreOptions;
  /** True while the presenter's own moment owns the camera; the battle opens on one. */
  yielding = true;
  menuOpen = false;
  menuActor: string | null = null;
  /** FFX: which list the open menu shows. */
  level: 'top' | 'sub' = 'top';
  /** FFX: the highlighted target while one is being picked. */
  aim: { id: string; enemy: boolean } | null = null;
  /** The shot on screen (null after a yield: whatever comes next is a cut). */
  current: ShotRequest | null = null;
  /** When the shot on screen was cut to, and in which beat. */
  lastCutAt = Number.NEGATIVE_INFINITY;
  lastCutBeat = -1;
  /** Bumped on every beat; a cut belongs to the beat it was asked in. */
  private seq = 0;
  private cutsThisBeat = 0;
  private pending: Pending | null = null;
  /** The spell pair's second shot, waiting for the first hit (or the fallback time). */
  private pair: { shot: ShotRequest; beat: number; fallbackAt: number } | null = null;
  private acting: { actorId: string; side: 'party' | 'enemy' | 'aeon' | null } | null = null;
  private lastPartyActor: string | null = null;
  private readonly telegraphed = new Set<string>();
  /** Set when a hit lands under a shot that slows on the hit; the three side consumes it. */
  private slowOwed = false;
  private slowBeat = -1;
  /** The last few decisions, for the debug snapshot and the tests. */
  readonly log: string[] = [];
  /** Evidence for the captures: cuts made, and cuts made while a menu was open (FFX-2: only as one opens). */
  readonly counts = { cuts: 0, cutsUnderOpenMenu: 0, cutsAsMenuOpened: 0 };

  constructor(o: LabDirectorCoreOptions) {
    this.o = o;
  }

  get beatNumber(): number {
    return this.seq;
  }

  /** May a cut land right now? */
  canCut(menuOpening = false): boolean {
    if (this.yielding || this.o.speedScale() <= 0) return false;
    if (this.o.game === 'ffx2' && this.menuOpen && !menuOpening) return false;
    return true;
  }

  /** The grammar's context now (the art anticipation asks the same questions the director will). */
  grammarContext(): GrammarContext {
    return this.ctx();
  }

  private ctx(): GrammarContext {
    const sw = this.o.switches();
    return {
      game: this.o.game,
      style: sw.style,
      targetCut: sw.targetCut,
      bossId: this.o.bossId(),
      allPartyRear: this.o.allPartyRear(),
    };
  }

  private note(line: string): void {
    this.log.push(line);
    if (this.log.length > 60) this.log.shift();
  }

  private newBeat(): void {
    this.seq++;
    this.cutsThisBeat = 0;
    this.pending = null;
    this.pair = null;
  }

  /** Ask for a shot in the current beat. */
  private request(shot: ShotRequest | 'keep', why: string, opts: { pairSecond?: boolean; debounce?: boolean; menuOpening?: boolean } = {}): void {
    if (shot === 'keep') return;
    if (!this.canCut(opts.menuOpening)) {
      this.note(`hold ${shot.kind} (${why}): no cut now`);
      return;
    }
    if (sameShot(this.current, shot)) return;
    if (this.cutsThisBeat >= 1 && !opts.pairSecond) {
      this.note(`drop ${shot.kind} (${why}): one cut per beat`);
      return;
    }
    const scale = this.o.speedScale();
    const now = this.o.now();
    let dueAt = now;
    if (opts.pairSecond && this.lastCutBeat === this.seq) dueAt = Math.max(now, this.lastCutAt + MIN_HOLD_MS * scale);
    if (opts.debounce) dueAt = Math.max(dueAt, now + TARGET_DEBOUNCE_MS * scale);
    this.pending = { shot, dueAt, beat: this.seq, why, ...(opts.menuOpening ? { menuOpening: true } : {}) };
  }

  /** The cut to perform this frame, if any. */
  due(): LabCut | null {
    const now = this.o.now();
    const pair = this.pair;
    if (pair && pair.beat === this.seq && now >= pair.fallbackAt) {
      this.pair = null;
      this.request(pair.shot, 'spell impact (no numeral)', { pairSecond: true });
    }
    const p = this.pending;
    if (!p || now < p.dueAt) return null;
    this.pending = null;
    if (p.beat !== this.seq || !this.canCut(p.menuOpening) || sameShot(this.current, p.shot)) return null;
    this.current = p.shot;
    this.lastCutAt = now;
    this.lastCutBeat = p.beat;
    this.cutsThisBeat++;
    this.counts.cuts++;
    if (this.menuOpen && p.menuOpening) this.counts.cutsAsMenuOpened++;
    else if (this.menuOpen) this.counts.cutsUnderOpenMenu++;
    this.note(`cut ${p.shot.kind}:${p.shot.subject ?? '-'} (${p.why})`);
    return { shot: p.shot, beat: p.beat, why: p.why };
  }

  /** True once per hit that lands under a slow-on-hit shot cut in this beat. */
  takeSlow(): boolean {
    const owed = this.slowOwed;
    this.slowOwed = false;
    return owed;
  }

  // ------------------------------------------------------------------ inputs

  beat(b: LabBeat): void {
    switch (b.kind) {
      case 'yield':
      case 'telegraph':
        this.newBeat();
        this.yielding = true;
        this.current = null;
        if (b.kind === 'telegraph' && b.name) this.telegraphed.add(b.name);
        this.note(`yield (${b.kind === 'yield' ? b.reason : 'telegraph'})`);
        return;

      case 'art':
        return; // the paintings, not the camera (the three side drops the rear view)

      case 'menu-open': {
        this.newBeat();
        this.yielding = false;
        this.menuActor = b.actorId;
        this.level = 'top';
        this.aim = null;
        const g: GrammarBeat = this.o.game === 'ffx' ? { kind: 'turn', actorId: b.actorId } : { kind: 'menu-master' };
        this.request(shotForBeat(g, this.ctx()), 'menu opens', { menuOpening: true });
        this.menuOpen = true;
        return;
      }

      case 'menu-close':
        this.menuOpen = false;
        this.menuActor = null;
        this.aim = null;
        this.level = 'top';
        return;

      case 'action': {
        this.newBeat();
        this.yielding = false;
        this.acting = { actorId: b.actorId, side: b.side };
        if (b.side !== 'enemy') this.lastPartyActor = b.actorId;
        const big =
          b.commandKind === 'overdrive' ||
          this.o.bigAbility(b.abilityId, b.abilityName) ||
          (b.side === 'enemy' && b.abilityName !== null && this.telegraphed.has(b.abilityName));
        if (this.o.game === 'ffx2' && this.menuOpen) {
          this.note(`action ${b.actorId} under an open menu: held (D-316)`);
          return;
        }
        const ctx = this.ctx();
        const isEnemy = (id: string): boolean => this.o.sideOf(id) === 'enemy';
        const shot = shotForBeat({ kind: 'action', actorId: b.actorId, side: b.side, pose: b.pose, targets: b.targets, big }, ctx, isEnemy);
        this.request(shot, `${b.side ?? '?'} ${b.pose}${big ? ' (big)' : ''}`);
        if (shot !== 'keep' && opensSpellPair(shot)) {
          const second = shotForBeat({ kind: 'spell-impact', actorId: b.actorId, targets: b.targets }, ctx, isEnemy);
          if (second !== 'keep') this.pair = { shot: second, beat: this.seq, fallbackAt: this.o.now() + SPELL_IMPACT_FALLBACK_MS * this.o.speedScale() };
        }
        return;
      }

      case 'impact': {
        if (b.hitIndex !== 0) return;
        const pair = this.pair;
        if (pair && pair.beat === this.seq) {
          this.pair = null;
          this.request(pair.shot, 'spell impact', { pairSecond: true });
        }
        if (this.current?.slowOnHit && this.lastCutBeat === this.seq && this.slowBeat !== this.seq) {
          this.slowBeat = this.seq;
          this.slowOwed = true;
        }
        return;
      }

      case 'action-end': {
        this.acting = null;
        this.newBeat();
        if (this.o.game === 'ffx2' && !this.menuOpen) {
          this.yielding = false;
          this.request(masterShot(this.ctx()), 'after the action');
        }
        return;
      }

      case 'victory': {
        this.newBeat();
        this.yielding = false;
        this.menuOpen = false;
        this.request(shotForBeat({ kind: 'victory', finisher: this.lastPartyActor }, this.ctx()), 'victory');
        return;
      }
    }
  }

  /** FFX: the open menu moved between the top list and a skill list (read from the HUD each frame). */
  menuLevel(level: 'top' | 'sub'): void {
    if (!this.menuOpen || this.aim !== null || level === this.level) return;
    this.level = level;
    if (this.o.game !== 'ffx' || !this.menuActor) return;
    this.newBeat();
    this.request(shotForBeat({ kind: 'skill-list', actorId: this.menuActor, open: level === 'sub' }, this.ctx()), level === 'sub' ? 'skill list' : 'back to the list');
  }

  /** FFX: the target highlight (null = the picker closed or went back). */
  target(sel: { id: string; enemy: boolean } | null): void {
    if (!this.menuOpen || !this.menuActor) return;
    if ((sel?.id ?? null) === (this.aim?.id ?? null)) return;
    this.aim = sel;
    if (this.o.game !== 'ffx') return;
    this.newBeat();
    const g: GrammarBeat = { kind: 'target', actorId: this.menuActor, targetId: sel?.id ?? null, enemy: sel?.enemy === true, level: this.level };
    this.request(shotForBeat(g, this.ctx()), sel ? `aim ${sel.id}` : 'aim cleared', { debounce: true });
  }

  /** The switches changed: re-ask the shot the current state wants (never under FFX-2's open menu). */
  refresh(): void {
    if (this.yielding || this.acting) return;
    const ctx = this.ctx();
    if (this.menuOpen && this.menuActor) {
      if (this.o.game !== 'ffx') return;
      this.newBeat();
      const shot =
        this.aim && this.aim.enemy && ctx.style === 'clair' && ctx.targetCut
          ? shotForBeat({ kind: 'target', actorId: this.menuActor, targetId: this.aim.id, enemy: true, level: this.level }, ctx)
          : menuShot(this.menuActor, this.level, ctx);
      this.request(shot, 'switch flipped');
      return;
    }
    if (this.o.game === 'ffx2') {
      this.newBeat();
      this.request(masterShot(ctx), 'switch flipped');
    }
  }

  /** Who acted last on the party side (the victory shot's finisher). */
  get finisher(): string | null {
    return this.lastPartyActor;
  }
}
