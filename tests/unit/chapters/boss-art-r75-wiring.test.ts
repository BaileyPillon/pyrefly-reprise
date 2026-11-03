/**
 * **What the boss paintings are wired to, and what they are not (r75-boss-art, the driver's decision 219u, items 5, 6 and 7).** Each of the three is a finding of the independent check (`boss-art-install/check-findings.md`) that
 * the driver answered, and each is pinned here against the real presenter code so a later change has to say so:
 *
 *  5. **The Spectral Keeper's attack painting is held back** (FFX only). With no `attack` file in the manifest the presenter resolves the pose down its own chain; this file runs that chain, and pins what the player gets:
 *     a physical move of an enemy with no attack painting of its own draws its CAST painting (`poseForAction`, shared presenter, both games), not the idle. With the attack file it would have drawn `attack`.
 *  6. **Concherer's cracked-shell idle stays unwired** (FFX-2 only): the presenter swaps an enemy's art on a `form-change` event (a different art id), and follows Sin's states from `state.flags` on the airship screen
 *     only. The Fallen Maesters engine emits neither at the shell break: one system `message`, and a memory byte on the unit (`aiMemory.conchererShellBroken`). The enemy pose list has no slot for `idle-cracked`.
 *  7. **The Black Elemental stands on its baseline** (FFX-2 only): the sidecar's only lift is `anchorY`, a ground-line row clamped into the image, so it can lift a figure by the painting's bottom margin (about 2 percent
 *     of its height) and no more than that; nothing passes an enemy `hover` to the battle stage. A quarter of its height needs a field the sidecar does not have.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { artCandidatesFor, characterUrl, ENEMY_POSES, resolveArt } from '../../../src/engine/BattlePresenterArt.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { paintedPoses, poseForAction } from '../../../src/engine/EnemyActionPose.ts';
import { computePoseScale } from '../../../src/engine/PaintedScale.ts';
import { SIN_POSE_RULES } from '../../../src/app/screens/BattleScreenSinPoses.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { CONCHERER_SCRIPT, MAESTERS_B_ABILITY as B, SHELL_BROKEN } from '../../../src/battle/ffx2/ai/fallen-maesters-b.ts';
import { mem } from '../../../src/battle/ffx2/internal.ts';
import { x2FallenMaestersAbilities } from '../../../src/data/ffx2/enemies/fallen-maesters-abilities.ts';
import { bench, enemy } from '../helpers/ffx2ScriptRig.ts';
import { actor, newEngine } from '../helpers/keeperDrive.ts';

afterEach(() => resetArtManifest());

const manifestOf = (subjects: Record<string, { states: string[] }>): void => {
  const m = parseArtManifest({ version: 1, generatedAt: 'x', subjects });
  if (!m) throw new Error('manifest did not parse');
  setArtManifest(m);
};

/** The states the install writes for the Keeper: the file list of the install without the held-back attack (the generated manifest of the rehearsal mirror says exactly this). */
const KEEPER_INSTALLED = ['cast', 'hurt', 'idle', 'ko'];

/** An enemy `action-start` for an ability, the shape the presenter reads. */
const startOf = (actorId: string, abilityId: string): Parameters<typeof poseForAction>[0] =>
  ({ type: 'action-start', actorId, abilityId, command: { kind: 'ability', id: abilityId, targets: [] }, targets: [] }) as never;

describe('5. the Spectral Keeper without its attack painting (FFX only)', () => {
  it('the real Keeper resolves to its own idle, cast, hurt and KO; its attack and wind-up fall to the idle painting', async () => {
    manifestOf({ 'spectral-keeper': { states: KEEPER_INSTALLED } });
    const keeper = actor(newEngine(5), 'spectral-keeper');
    const { artId, poses } = await resolveArt(artCandidatesFor(keeper), 'enemy');
    expect(artId).toBe('spectral-keeper');
    expect(ENEMY_POSES).toContain('attack');
    expect(poses['attack'], 'no attack file: the chain attack, ready, idle ends on the idle').toBe(characterUrl('spectral-keeper', 'idle'));
    expect(poses['telegraph']).toBe(characterUrl('spectral-keeper', 'idle'));
    for (const pose of ['idle', 'cast', 'hurt', 'ko']) expect(poses[pose], pose).toBe(characterUrl('spectral-keeper', pose));
    expect([...paintedPoses(artId, poses, characterUrl)].sort(), 'the poses with a painting of their own').toEqual(['cast', 'hurt', 'idle', 'ko']);
  });

  it('what the player gets: the Keeper\'s Berserk Tail and Attack All (physical) draw its CAST painting, the presenter\'s rule for any enemy with no attack painting; with the attack file they would draw `attack`', async () => {
    const facts = (id: string): { damageType: 'physical'; formula: 'strength' } | undefined => (id === 'keeper-berserk-tail' || id === 'keeper-attack-all' ? { damageType: 'physical', formula: 'strength' } : undefined);
    const poseWithout = async (states: string[]): Promise<string[]> => {
      manifestOf({ 'spectral-keeper': { states } });
      const { artId, poses } = await resolveArt(['spectral-keeper'], 'enemy');
      const own = paintedPoses(artId, poses, characterUrl);
      return ['keeper-berserk-tail', 'keeper-attack-all', 'keeper-glyph-mine'].map((ability) => poseForAction(startOf('spectral-keeper', ability), 'enemy', facts, (p) => own.has(p)));
    };
    expect(await poseWithout(KEEPER_INSTALLED)).toEqual(['cast', 'cast', 'cast']);
    expect(await poseWithout([...KEEPER_INSTALLED, 'attack']), 'the control: the held-back file would have been drawn for the two physical moves').toEqual(['attack', 'attack', 'cast']);
  });

  it('the install\'s own manifest (when a rehearsal or release mirror is named by BOSS_ART_ROOT) lists the Keeper without an attack', () => {
    const root = process.env['BOSS_ART_ROOT'];
    const file = root ? join(root, 'manifest.json') : '';
    if (!file || !existsSync(file)) return; // the stage folder has no manifest; a mirror made by make-mirror.mjs and manifest.mjs has
    const subjects = (JSON.parse(readFileSync(file, 'utf8')) as { subjects: Record<string, { states: string[] }> }).subjects;
    expect(subjects['spectral-keeper']!.states.sort()).toEqual(KEEPER_INSTALLED);
  });
});

describe('6. Concherer\'s cracked-shell idle stays unwired (FFX-2 only)', () => {
  it('the shell break emits ONE system message and sets the unit\'s memory byte: no form-change, no status, no flag in the battle state for a presenter to follow', () => {
    const b = bench(enemy('x2-concherer', 343_280, { mp: 170 }), CONCHERER_SCRIPT);
    const hit = x2FallenMaestersAbilities.find((a) => a.id === B.conchererAttack)!;
    b.self.hp -= 10_000;
    aiScriptFor(CONCHERER_SCRIPT).onResult!(b.ctx, b.girls[0], hit);
    expect(mem(b.self, SHELL_BROKEN)).toBe(1);
    expect(b.events.map((e) => e.type), 'the whole event list of the break').toEqual(['message']);
    expect(b.events.some((e) => e.type === 'form-change' || e.type === 'status-add' || e.type === 'script-trigger')).toBe(false);
  });

  it('the presenter has no slot for it: the enemy pose list is idle, attack, cast, hurt, ko and the wind-up, and a manifest that lists `idle-cracked` changes no pose', async () => {
    expect([...ENEMY_POSES]).toEqual(['idle', 'attack', 'cast', 'hurt', 'ko', 'telegraph']);
    manifestOf({ 'x2-concherer': { states: ['attack', 'cast', 'hurt', 'idle', 'idle-cracked'] } });
    const { poses } = await resolveArt(['x2-concherer'], 'enemy');
    expect(Object.keys(poses).sort()).toEqual([...ENEMY_POSES].sort());
    expect(Object.values(poses).some((url) => url.includes('idle-cracked'))).toBe(false);
  });

  it('the one rest-pose follower the repo has (Sin\'s, on the airship screen) has no Concherer rule: it reads `state.flags`, which the break never touches', () => {
    expect(SIN_POSE_RULES.map((r) => r.artId)).not.toContain('x2-concherer');
  });
});

describe('7. the Black Elemental stands on its baseline (FFX-2 only)', () => {
  // The staged idle's sidecar: 837 x 845, baselineY 829 (the lowest opaque row + 1, a 16 px margin below it). The content box is the opaque rows and columns inside the 16 px margin.
  const idle = { width: 837, height: 845, baselineY: 829 };
  const box = { x0: 16, y0: 16, x1: 821, y1: 829 };
  /** The lowest painted row's height above the floor, as a fraction of the figure's standing height (negative: sunk). */
  const lift = (anchorY: number | undefined): number => {
    const s = computePoseScale({ ...idle, ...(anchorY !== undefined ? { anchorY } : {}) }, { worldHeight: 2 });
    const standing = 829 * s.unitsPerPixel;
    return s.contentBox.y0 / standing;
  };

  it('with no anchorY the crescent stands on its lowest row (no lift at all)', () => {
    const s = computePoseScale(idle, { worldHeight: 2, content: box });
    expect(s.contentBox.y0).toBeCloseTo(0, 6);
  });

  it('the sidecar\'s anchorY (fraction or pixel row) clamps into the image: the most it can lift the figure is the painting\'s own bottom margin, about 2 percent of its height, never a quarter', () => {
    const lifted = (anchorY: number): number => {
      const s = computePoseScale({ ...idle, anchorY }, { worldHeight: 2, content: box });
      return s.contentBox.y0 / (829 * s.unitsPerPixel);
    };
    for (const anchorY of [1, 0.999, 845, 900, 5_000]) expect(lifted(anchorY), `anchorY ${anchorY}`).toBeLessThanOrEqual(16 / 829 + 1e-9);
    expect(lifted(5_000)).toBeGreaterThan(0.019);
    expect(lifted(5_000)).toBeLessThan(0.25 / 10);
    expect(lift(undefined)).toBeDefined();
  });
});
