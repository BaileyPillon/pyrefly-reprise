/**
 * **Where the anime chapter's figures stand and how the camera sees them** (`src/engine/ww3d/animeLayout.ts`; FFX-2 only), pinned without a browser: the staging table is the anime lab's (`meshy-mockup`'s `LAYOUT`, fitted
 * to the concept frames' composition), the girls are the Meshy toon girls at their own heights and Valefor 5 m, and the projection of the idealised boxes through every rig puts the picture where the concept frame has it
 * (the party on the left in a diagonal that recedes to the right, Valefor in the right half, the bottom calm) **after the engine's 0.04 lens lift**, which the first GPU job measures. Staging is ours, not game data.
 */
import { describe, expect, it } from 'vitest';

import {
  ANIME_BOSS_AIM,
  ANIME_BOSS_SPOT,
  ANIME_BODY_OFF_DEG,
  ANIME_CAMERA_POSITION,
  ANIME_FILES,
  ANIME_VALEFOR_V2,
  ANIME_NATIVE_HEIGHT,
  ANIME_WING,
  ANIME_BOSS_POINTS,
  ANIME_FOV,
  ANIME_HEAD_PITCH_FIX,
  ANIME_PARTY_SLOTS,
  ANIME_PITCH_DEG,
  ANIME_PROP_SPECS,
  ANIME_RIGS,
  ANIME_STAGING,
  ANIME_WEAPON_SCALE,
  ANIME_WORLD_HEIGHT,
  BOSS_SCALE,
  animeBoxes,
} from '../../../src/engine/ww3d/animeLayout.ts';
import { RIGS, horizonY, pitchOf, project } from '../../../src/engine/ww3d/camera.ts';
import { PARTY_SLOTS, PROP_NAMES, WW_BOSS_ID, WW_PARTY_IDS, heightFactorIn, MODEL_FILE } from '../../../src/engine/ww3d/layout.ts';
import { PROP_SPECS } from '../../../src/engine/ww3d/props.ts';

/** The static lens shift CHAPTER FRAMING plans at the target shot (a vertical step of 0.04 of the frame at 1600x900, measured live for the Wind Waker chapter in its polish 2); the picture on screen is the rig's projection this much higher. To be measured for this chapter. */
const ENGINE_LIFT = 0.04;
const ASPECT = 16 / 9;

describe('the staging table', () => {
  it('names the Meshy toon girls at their own heights (1.60, 1.55, 1.70 m: about five heads) and Valefor at 5 m, her file scaled 1.43', () => {
    expect(ANIME_WORLD_HEIGHT).toEqual({ yuna: 1.6, rikku: 1.55, paine: 1.7, 'x2-valefor': 5 });
    expect(BOSS_SCALE * ANIME_STAGING.nativeHeight['x2-valefor']).toBeCloseTo(5, 6);
    expect(ANIME_STAGING.partyHeight).toBe(1.6);
    expect(ANIME_STAGING.bossHeight).toBe(5);
    expect(heightFactorIn(ANIME_STAGING, 'rikku')).toBeCloseTo(1.55 / 1.6, 6);
    expect(heightFactorIn(ANIME_STAGING, 'paine')).toBeCloseTo(1.7 / 1.6, 6);
    expect(heightFactorIn(ANIME_STAGING, WW_BOSS_ID)).toBe(1);
  });

  it('is the lab\'s: the three slots, Valefor\'s spot and lift, the turns (body 42, face 24, Valefor -38), the head raised when the clip bows it', () => {
    expect(ANIME_PARTY_SLOTS.slice(0, 3)).toEqual([[-0.55, 0, 0.9], [0.15, 0, -0.1], [1.1, 0, -1.3]]);
    expect(ANIME_BOSS_SPOT).toEqual([4.1, 0, -4.0]);
    expect(ANIME_STAGING.bossHover).toBe(1.0);
    expect([ANIME_STAGING.bodyOffDeg, ANIME_STAGING.faceOffDeg, ANIME_STAGING.bossYawDeg]).toEqual([42, 24, -38]);
    expect(ANIME_BODY_OFF_DEG).toBe(42);
    expect(ANIME_STAGING.headPitchFix).toBe(ANIME_HEAD_PITCH_FIX);
    expect(ANIME_HEAD_PITCH_FIX).toEqual({ minPitchDeg: -4, limitDeg: 40 });
    expect(ANIME_BOSS_AIM[0]).toBeLessThan(ANIME_BOSS_SPOT[0]); // in front of her chest and nearer the lens
    expect(ANIME_BOSS_AIM[2]).toBeGreaterThan(ANIME_BOSS_SPOT[2]);
  });

  it('has four reserve spots off the frame to the left, as the Wind Waker chapter\'s, outside every rig it publishes (a character switched in walks from one)', () => {
    expect(ANIME_PARTY_SLOTS).toHaveLength(7);
    expect(ANIME_PARTY_SLOTS.slice(3)).toEqual(PARTY_SLOTS.slice(3));
    for (const [name, rig] of Object.entries(ANIME_RIGS)) {
      for (const slot of ANIME_PARTY_SLOTS.slice(3)) {
        const p = project(rig, ASPECT, [slot[0], 1, slot[2]]);
        expect(p.depth <= 0 || p.x < -0.05, `${name}: a reserve spot is behind the lens or left of the frame (x ${p.x.toFixed(2)}, depth ${p.depth.toFixed(1)})`).toBe(true);
      }
    }
  });

  it('finds the girls and Valefor in anime/ (part 2: her own feathered file; the Wind Waker chapter\'s flat v2 stays the comparison); every figure has one', () => {
    expect(ANIME_FILES).toEqual({ yuna: 'anime/yuna', rikku: 'anime/rikku', paine: 'anime/paine', 'x2-valefor': 'anime/valefor' });
    expect(ANIME_VALEFOR_V2).toBe(MODEL_FILE['x2-valefor']);
    expect(ANIME_FILES['x2-valefor']).not.toBe(ANIME_VALEFOR_V2);
    expect(ANIME_STAGING.files).toBe(ANIME_FILES);
  });

  it('gives each girl the weapons she holds in chapter 24 (Yuna two pistols, Rikku two daggers, Paine a sword), the files at 1.3, mirrored in the left hand', () => {
    for (const id of WW_PARTY_IDS) {
      const mine = ANIME_PROP_SPECS[id];
      const theirs = PROP_SPECS[id];
      expect(mine.map((s) => [s.hand, s.name, s.mirrorSwapped]), id).toEqual(theirs.map((s) => [s.hand, s.name, s.mirrorSwapped]));
      for (const s of mine) expect(PROP_NAMES).toContain(s.name);
    }
    expect(ANIME_WEAPON_SCALE).toBe(1.3);
  });
});

describe('the target shot', () => {
  const idle = ANIME_RIGS['idle']!;

  it('is the lab\'s low lens (0.37 m up at x 1.5, z 3.8, a 49 degree lens) tipped 17.6 degrees: the lab\'s 15.6 plus the 2.0 that puts the picture back down by the engine\'s 0.04 lift (2.0 / 49)', () => {
    expect(idle.position).toEqual([1.5, 0.37, 3.8]);
    expect(ANIME_CAMERA_POSITION).toBe(idle.position);
    expect(idle.fov).toBe(49);
    expect(ANIME_FOV).toBe(49);
    expect(pitchOf(idle)).toBeCloseTo(ANIME_PITCH_DEG, 6);
    expect(ANIME_PITCH_DEG).toBeCloseTo(15.6 + 0.04 * 49, 0);
    expect(horizonY(idle) - ENGINE_LIFT).toBeGreaterThan(0.75); // a low camera: the horizon high in the frame's lower part, the floor a strip
  });

  it('puts the girls\' tops, the diagonal and Valefor on the concept frame\'s composition (the lab\'s measured boxes, within 0.04), after the lift', () => {
    const b = animeBoxes(idle, ASPECT);
    // the lab's `layoutcheck`: Yuna y 0.33..1.0, Rikku 0.46..0.94, Paine 0.51..0.90, Valefor's claws 0.73; TARGET-C: tops .33 / .47 / .55, claws .72
    const lifted = (v: number): number => v - ENGINE_LIFT;
    expect(lifted(b.yuna.top), 'Yuna top').toBeGreaterThan(0.31);
    expect(lifted(b.yuna.top)).toBeLessThan(0.4);
    expect(lifted(b.rikku.top)).toBeGreaterThan(0.43);
    expect(lifted(b.rikku.top)).toBeLessThan(0.51);
    expect(lifted(b.paine.top)).toBeGreaterThan(0.48);
    expect(lifted(b.paine.top)).toBeLessThan(0.56);
    expect(lifted(b[WW_BOSS_ID].bottom), 'Valefor\'s claws').toBeGreaterThan(0.68);
    expect(lifted(b[WW_BOSS_ID].bottom)).toBeLessThan(0.76);
    // the diagonal: each girl further right and higher in the frame (smaller, further back) than the one before
    expect(b.yuna.left).toBeLessThan(b.rikku.left);
    expect(b.rikku.left).toBeLessThan(b.paine.left);
    expect(b.yuna.top).toBeLessThan(b.rikku.top);
    expect(b.rikku.top).toBeLessThan(b.paine.top);
    // Valefor in the right half, her body right of the three
    expect(b[WW_BOSS_ID].left).toBeGreaterThan(0.3);
    expect(b[WW_BOSS_ID].right).toBeGreaterThan(1.0);
    expect(b.paine.right).toBeLessThan(b[WW_BOSS_ID].left + 0.2);
  });

  it('keeps the bottom fifth calm: no girl\'s feet reach below the frame (Yuna the lowest, under 1.0 after the lift with the box\'s margin), none on top of another', () => {
    const b = animeBoxes(idle, ASPECT);
    for (const id of WW_PARTY_IDS) expect(b[id].bottom - ENGINE_LIFT, id).toBeLessThan(1.0);
    expect(b.yuna.bottom).toBeGreaterThan(b.rikku.bottom);
    expect(b.rikku.bottom).toBeGreaterThan(b.paine.bottom);
  });
});

describe('every rig', () => {
  const b = (name: string): ReturnType<typeof animeBoxes> => animeBoxes(ANIME_RIGS[name]!, ASPECT);

  it('publishes the presenter\'s eight names, as the Wind Waker chapter\'s do, each with a lens and a look-at, and the same intro', () => {
    expect(Object.keys(ANIME_RIGS).sort()).toEqual(Object.keys(RIGS).sort());
    for (const rig of Object.values(ANIME_RIGS)) {
      expect(rig.fov).toBeGreaterThan(30);
      expect(rig.fov).toBeLessThan(60);
      expect(Math.hypot(...(rig.position.map((v, i) => v - rig.lookAt[i]!) as [number, number, number]))).toBeGreaterThan(1);
    }
    expect(ANIME_RIGS['intro']).toEqual(RIGS['intro']);
  });

  it('shows the three girls and Valefor whole at the opening wide shot, the girls at the party and victory shots, Valefor at the enemy and reveal shots, and keeps every girl in frame at the push toward the fight', () => {
    const intro = b('intro');
    for (const id of [...WW_PARTY_IDS, WW_BOSS_ID] as const) {
      expect(intro[id].left, `intro ${id}`).toBeGreaterThan(0);
      expect(intro[id].right).toBeLessThan(1);
      expect(intro[id].top).toBeGreaterThan(0);
      expect(intro[id].bottom).toBeLessThan(1);
    }
    for (const name of ['party', 'victory']) for (const id of WW_PARTY_IDS) {
      const x = b(name)[id];
      expect(x.left, `${name} ${id}`).toBeGreaterThan(0);
      expect(x.right).toBeLessThan(1);
      expect(x.top - ENGINE_LIFT).toBeGreaterThan(0);
      expect(x.bottom - ENGINE_LIFT).toBeLessThan(1);
    }
    for (const name of ['enemy', 'reveal', 'action']) {
      const v = b(name)[WW_BOSS_ID];
      expect(v.top - ENGINE_LIFT, `${name}: her crest`).toBeGreaterThan(-0.05);
      expect(v.bottom - ENGINE_LIFT, `${name}: her claws`).toBeLessThan(1);
    }
    for (const id of WW_PARTY_IDS) {
      expect(b('action')[id].bottom - ENGINE_LIFT, `action ${id}`).toBeLessThan(1.0);
      expect(b('action')[id].right).toBeGreaterThan(0);
    }
  });

  it('is low and tipped up at the three fight shots (every one of them looks up at Valefor)', () => {
    for (const name of ['idle', 'action', 'enemy']) expect(pitchOf(ANIME_RIGS[name]!), name).toBeGreaterThan(10);
    for (const name of ['idle', 'action', 'party', 'enemy', 'reveal', 'victory']) expect(ANIME_RIGS[name]!.position[1], name).toBeLessThan(1.2);
  });
});

describe('Valefor\'s file of part 2: her wing numbers and her points', () => {
  it('hands the staging a wing shape and boss points of her own (the Wind Waker chapter\'s staging has none)', () => {
    expect(ANIME_STAGING.wing).toBe(ANIME_WING);
    expect(ANIME_STAGING.bossPoints).toBe(ANIME_BOSS_POINTS);
  });

  it('the wing numbers are a bend that starts outside the body, is full before the tips, leaves the legs and plumes alone and pivots at the shoulders', () => {
    expect(ANIME_WING.start).toBeGreaterThan(0.3);
    expect(ANIME_WING.full).toBeGreaterThan(ANIME_WING.start);
    expect(ANIME_WING.full).toBeLessThan(3.3); // inside her half span (3.3 m of the 3.5 m file)
    expect(ANIME_WING.yLo).toBeLessThan(ANIME_WING.pivotY);
    expect(ANIME_WING.pivotY).toBeLessThan(ANIME_NATIVE_HEIGHT['x2-valefor']);
    expect(ANIME_WING.cx).toBe(0);
    expect(ANIME_WING.ampDeg).toBeGreaterThan(5);
    expect(ANIME_WING.ampDeg).toBeLessThan(45);
  });

  it('her mouth is up at the head and forward of her claws, her chest between her legs and her head', () => {
    const [mx, my, mz] = ANIME_BOSS_POINTS.mouth;
    const [cx, cy, cz] = ANIME_BOSS_POINTS.chest;
    expect(my).toBeGreaterThan(cy);
    expect(cy).toBeGreaterThan(ANIME_NATIVE_HEIGHT['x2-valefor'] * 0.3);
    expect(my).toBeLessThan(ANIME_NATIVE_HEIGHT['x2-valefor']);
    expect(mz).toBeGreaterThan(0);
    expect(cz).toBeGreaterThan(0);
    expect(Math.abs(mx)).toBeLessThan(0.3);
    expect(Math.abs(cx)).toBeLessThan(0.3);
  });
});
