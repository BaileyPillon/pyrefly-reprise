/**
 * Option C5 and the Specials (eye-candy options round, 2026-09-29): what a landing spell and
 * the first blow of an Overdrive or a Special add on top of the approved option-B effects.
 * Split out of `SpectacleFx.ts`, which owns the state these write through `MomentCtx`.
 *
 * Game case: fire, ice, lightning and water in both games (lightning glow per game); Mega Flare
 * (Chapter IV) and Aerospark (Chapter XVI) are FFX-2 only; the gold ribbons are FFX only.
 * Aerospark's look is new: a new Special look needs Bailey's yes (D-233), which this round asks.
 */

import { Vector3 } from 'three';
import type { CombatantId } from '../../../battle/common/types.ts';
import type { PaintedActor } from '../../PaintedActor.ts';
import { boltPass, fireEmbers, goldRibbons, megaFlareBurst, type Pools } from './HitDraw.ts';
import type { GameTuning, SpectacleFlags, SpectacleGame, SpellLayerKind } from './SpectacleRules.ts';
import type { FireColumns, IceBurst, ShockSpheres } from './SpellLayers.ts';

export interface MomentCtx {
  game: SpectacleGame;
  tune: GameTuning;
  pools: Pools;
  fire: FireColumns;
  ice: IceBurst;
  shell: ShockSpheres;
  stage: {
    actor(id: CombatantId): PaintedActor | undefined;
    staged(): CombatantId[];
    sideOf(id: CombatantId): 'party' | 'enemy' | 'aeon' | undefined;
  };
  /** Run `fn` after `sec` of field time (the hit-stop holds it too). */
  after(sec: number, fn: () => void): void;
  /** One-frame exposure lift (lightning, Mega Flare), already capped by the caller's rules. */
  lift(v: number): void;
  /** Heat haze over this combatant (desktop only). */
  haze(id: CombatantId): void;
  sub(id: string): boolean;
  /** The Special on screen (lower case), if any. */
  readonly special: string | null;
}

export function spellMoment(c: MomentCtx, kind: NonNullable<SpellLayerKind>, id: CombatantId, a: PaintedActor, f: SpectacleFlags): void {
  const foot = a.position.clone();
  const h = a.height;
  const phone = f.tier === 'phone';
  const gain = Math.min(1.6, f.dial('spells'));
  if (kind === 'fire') {
    c.fire.play(foot, Math.min(h * 1.8, 4.2), gain);
    fireEmbers(c.pools, foot, h, phone ? 12 : 26);
    if (!phone && c.sub('heat')) c.haze(id);
  } else if (kind === 'ice') {
    c.ice.play(foot, h, phone ? 8 : 14);
    c.pools.floor.emit({ pos: [foot.x, foot.y + 0.03, foot.z], life: 0.8, color: [0.3, 0.6, 0.85], size: 0.3 * h, sizeEnd: 1.2 * h, shape: 'glow', flat: true, fadeFrom: 0.5 });
  } else if (kind === 'thunder') {
    const to = a.centerPoint(new Vector3());
    const passes = f.reduceFlashes ? 1 : phone ? 2 : 4;
    for (let i = 0; i < passes; i++) {
      c.after(i * 0.05, () => {
        const from = new Vector3(to.x + (Math.random() - 0.5) * 2.5, to.y + 9, to.z - 1.5);
        boltPass(c.pools, from, to, c.tune.bolt, { branches: phone ? 0 : 3 });
      });
    }
    c.pools.floor.emit({ pos: [foot.x, foot.y + 0.03, foot.z], life: 0.45, color: [0.7, 0.65, 1.1], size: 0.2 * h, sizeEnd: 1.1 * h, shape: 'ring', flat: true, fadeFrom: 0.3 });
    c.lift(f.reduceFlashes ? 0.06 : 0.16);
  } else if (kind === 'nova') {
    const at = a.centerPoint(new Vector3());
    const col: [number, number, number] = c.game === 'ffx' ? [1.4, 1.15, 0.6] : [1.4, 0.6, 1.2];
    if (c.game === 'ffx' || c.special === null) c.shell.play(at, Math.min(3.2, h * 0.9), c.game === 'ffx' ? [1.1, 0.9, 0.45] : [1.1, 0.45, 0.9]);
    for (let i = 0; i < 3; i++) {
      c.pools.floor.emit({ pos: [foot.x, foot.y + 0.03, foot.z], life: 0.7, color: col, size: 0.2 * h, sizeEnd: (1.1 + i * 0.45) * h, shape: 'ring', flat: true, fadeFrom: 0.3, delay: i * 0.09 });
    }
    for (let i = 0; i < (phone ? 10 : 18); i++) {
      const th = (i / (phone ? 10 : 18)) * Math.PI * 2;
      c.pools.spr.emit({ pos: [at.x, at.y, at.z], vel: [Math.cos(th) * 3.2, Math.sin(th) * 2.4, 0.4], drag: 2.2, life: 0.55, color: col, size: 0.16, shape: c.tune.stars ? 'star' : 'glow', fadeFrom: 0.35 });
    }
  } else if (kind === 'water') {
    c.pools.floor.emit({ pos: [foot.x, foot.y + 0.03, foot.z], life: 0.6, color: [0.35, 0.9, 1.7], size: 0.3 * h, sizeEnd: 1.6 * h, shape: 'ring', flat: true, fadeFrom: 0.3 });
  }
}

/** The first blow of an Overdrive or a Special. `special` is its lower-case name. */
export function bigMoment(c: MomentCtx, special: string | null, a: PaintedActor, f: SpectacleFlags): void {
  const at = a.centerPoint(new Vector3());
  const phone = f.tier === 'phone';
  if (special === 'mega flare' && c.game === 'ffx2') {
    const party = c.stage.staged().filter((s) => c.stage.sideOf(s) === 'party').map((s) => c.stage.actor(s)).filter((x): x is PaintedActor => !!x);
    const mid = new Vector3();
    for (const p of party.length ? party : [a]) mid.add(p.position);
    mid.multiplyScalar(1 / Math.max(1, party.length));
    const centre = mid.clone().setY(mid.y + 1.2);
    c.shell.play(centre, phone ? 5 : 7, [1.5, 0.65, 1.2]);
    megaFlareBurst(c.pools, centre, mid, 3);
    c.lift(f.reduceFlashes ? 0.08 : 0.25);
  } else if (special === 'aerospark' && c.game === 'ffx2') {
    const src = c.stage.staged().find((s) => c.stage.sideOf(s) === 'enemy');
    const start = (src ? c.stage.actor(src)?.headPoint(new Vector3()) : undefined) ?? at.clone().setY(at.y + 6);
    c.pools.spr.emit({ pos: [start.x, start.y, start.z], life: 0.6, color: [1.6, 1.2, 2.0], size: 0.8, sizeEnd: 3.4, shape: 'star', fadeFrom: 0.3 });
    for (let i = 0; i < (f.reduceFlashes ? 1 : 8); i++) {
      c.after(i * 0.05, () => boltPass(c.pools, start, at, [1.9, 1.4, 2.6], { branches: phone ? 1 : 5, lance: true }));
    }
    c.pools.floor.emit({ pos: [a.position.x, a.position.y + 0.03, a.position.z], life: 0.7, color: [1.1, 0.7, 1.6], size: 0.3, sizeEnd: a.height * 1.6, shape: 'ring', flat: true, fadeFrom: 0.3 });
    c.lift(f.reduceFlashes ? 0.06 : 0.2);
  } else if (c.game === 'ffx') {
    goldRibbons(c.pools, at, a.height, phone ? 18 : 36);
  }
}

/** C3's cast light: the blow's colour on the fighters near it (the FF7 technique, generalised). */
export function castOnto(c: MomentCtx, targetId: CombatantId, at: Vector3, spell: string | null, peak: number): void {
  const colour =
    spell === 'fire' ? 0xff8a4a : spell === 'ice' ? 0x9fe4ff : spell === 'thunder' ? 0xd9c8ff : spell === 'water' ? 0x6fd0ff : c.game === 'ffx' ? 0xffd98a : 0xf7b6d9;
  for (const id of c.stage.staged()) {
    if (id === targetId) continue;
    const a = c.stage.actor(id);
    if (!a || !a.visible) continue;
    const dist = a.position.distanceTo(at);
    if (dist > 6) continue;
    a.flash(colour, 500, peak * (1 - dist / 6));
  }
}
