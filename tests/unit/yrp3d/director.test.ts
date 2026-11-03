/**
 * **The 3D Bahamut's shot director** (`src/engine/yrp3d/director.ts`; FFX-2 only): Bahamut's Mega Flare takes end-state frame C's camera (the scene's `overdrive` rig), and nothing else changes.
 *
 * Pinned here:
 *
 * 1. **The ids are the data's, not invented**: both ability ids the director takes exist in the FFX-2 tables (the engine's `mega-flare` and the data row `x2-bahamut-mega-flare`), and Bahamut's script submits one of them.
 * 2. **What it takes**: only Bahamut's own Mega Flare. His other moves, the girls' moves (even one named the same), an action with no ability and a different caster are all declined.
 * 3. **How it moves**: a tween to the overdrive rig that the beat waits for; a snap at `'skip'`.
 * 4. **Through the real `BattleMoments`**: with the director on the stage, the opening of Mega Flare is a move to `overdrive` and none of `BattleMoments`' own (no push, no party rig); every other action plays the golden calls.
 */
import { describe, expect, it } from 'vitest';

import { CORE_ABILITIES } from '../../../src/battle/ffx2/abilities-core.ts';
import bahamutAbilities from '../../../src/data/ffx2/enemies/bahamut-abilities.ts';
import { BattleMoments } from '../../../src/engine/BattleMoments.ts';
import type { AudioPort, CameraPort, PlaybackSpeed } from '../../../src/engine/BattlePresenterPorts.ts';
import type { ActionShot, ShotDirector } from '../../../src/engine/ShotDirector.ts';
import { MEGA_FLARE_IDS, OVERDRIVE_MOVE_MS, OVERDRIVE_RIG, YRP_SHOT_DIRECTOR, isMegaFlare } from '../../../src/engine/yrp3d/director.ts';
import { RIGS } from '../../../src/engine/yrp3d/layout.ts';
import { noSleep } from '../helpers/FakeStage.ts';
import { DirectedStage, cameraCalls } from '../helpers/shotScript.ts';

describe('the ids are the data\'s', () => {
  it('both ids are Mega Flare rows in the FFX-2 tables, and the overdrive rig is one the scene publishes', () => {
    expect([...MEGA_FLARE_IDS].sort()).toEqual(['mega-flare', 'x2-bahamut-mega-flare']);
    expect(CORE_ABILITIES.find((a) => a.id === 'mega-flare')).toMatchObject({ name: 'Mega Flare', game: 'ffx2' });
    expect(bahamutAbilities.find((a) => a.id === 'x2-bahamut-mega-flare')).toMatchObject({ name: 'Mega Flare', game: 'ffx2' });
    expect(Object.keys(RIGS)).toContain(OVERDRIVE_RIG);
  });
});

// --------------------------------------------------------------- the director on its own

/** A camera port that logs what it is asked and resolves its moves at once. */
function fakeCamera(): { camera: CameraPort; log: string[] } {
  const log: string[] = [];
  const camera = {
    rigNames: Object.keys(RIGS),
    rigName: 'idle',
    moveTo: (rig: string, ms?: number): Promise<void> => (log.push(`moveTo:${rig}@${ms}`), Promise.resolve()),
    snapTo: (rig: string): void => void log.push(`snapTo:${rig}`),
    shake: (): void => undefined,
    punch: (): Promise<void> => Promise.resolve(),
  } as unknown as CameraPort;
  return { camera, log };
}

function shot(actor: string, abilityId: string | undefined, over: Partial<ActionShot> = {}): { ctx: ActionShot; log: string[] } {
  const { camera, log } = fakeCamera();
  const subject = (id: string) => ({ id, side: id === 'bahamut' ? ('enemy' as const) : ('party' as const) });
  const ctx: ActionShot = {
    camera,
    speed: 'normal',
    skipping: false,
    ms: (base: number) => base * 2, // a live speed that doubles the beat's times, so a use of `ms` shows
    actor: subject(actor),
    targets: [subject('yuna'), subject('rikku'), subject('paine')],
    action: { kind: 'cast', ...(abilityId === undefined ? {} : { abilityId }) },
    ...over,
  };
  return { ctx, log };
}

describe('what it takes', () => {
  it('takes Bahamut\'s Mega Flare, under either id', async () => {
    for (const id of MEGA_FLARE_IDS) {
      const { ctx, log } = shot('bahamut', id);
      expect(isMegaFlare(ctx), id).toBe(true);
      expect(await YRP_SHOT_DIRECTOR.actionOpen!(ctx), id).toBe(true);
      expect(log, id).toEqual([`moveTo:${OVERDRIVE_RIG}@${OVERDRIVE_MOVE_MS * 2}`]); // the beat's own time at the live speed
    }
  });

  it('declines everything else: his other moves, the girls\' moves, a caster who is not Bahamut, and an action with no ability', async () => {
    for (const [actor, ability] of [
      ['bahamut', 'x2-bahamut-attack'],
      ['bahamut', 'impulse'],
      ['bahamut', 'bahamut-countdown'],
      ['bahamut', undefined],
      ['yuna', 'mega-flare'], // a girl with a spell of the same name: not his finisher
      ['rikku', 'x2-bahamut-mega-flare'],
    ] as const) {
      const { ctx, log } = shot(actor, ability);
      expect(isMegaFlare(ctx), `${actor} ${ability}`).toBe(false);
      expect(await YRP_SHOT_DIRECTOR.actionOpen!(ctx), `${actor} ${ability}`).toBe(false);
      expect(log, `${actor} ${ability}: the camera is not touched`).toEqual([]);
    }
  });

  it('has a handler for the one beat and no other (every other beat is BattleMoments\' own)', () => {
    expect(Object.keys(YRP_SHOT_DIRECTOR)).toEqual(['actionOpen']);
  });

  it('at skip speed it snaps to the overdrive rig instead of tweening, and still answers taken', async () => {
    const { ctx, log } = shot('bahamut', 'mega-flare', { skipping: true, speed: 'skip' });
    expect(await YRP_SHOT_DIRECTOR.actionOpen!(ctx)).toBe(true);
    expect(log).toEqual([`snapTo:${OVERDRIVE_RIG}`]);
  });

  it('waits for the camera to arrive: the answer is a promise that settles when the move has', async () => {
    let arrive: () => void = () => undefined;
    const { ctx } = shot('bahamut', 'mega-flare');
    (ctx.camera as unknown as { moveTo: () => Promise<void> }).moveTo = () => new Promise<void>((resolve) => (arrive = resolve));
    const answer = YRP_SHOT_DIRECTOR.actionOpen!(ctx) as Promise<boolean>;
    let settled = false;
    void answer.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    arrive();
    expect(await answer).toBe(true);
  });
});

// ------------------------------------------------------------ through the real BattleMoments

function moments(speed: PlaybackSpeed, director: ShotDirector | undefined): { moments: BattleMoments; stage: DirectedStage } {
  const stage = new DirectedStage(['yuna', 'rikku', 'paine'], ['bahamut']);
  if (director) stage.shotDirector = director;
  const audio: AudioPort = { playSfx: () => undefined, playMusic: () => undefined, stopMusic: () => undefined };
  return { moments: new BattleMoments({ stage, audio, sleep: noSleep, speed: () => speed }), stage };
}

describe('through the real BattleMoments', () => {
  const GIRLS = ['yuna', 'rikku', 'paine'];

  it('Mega Flare opens on the overdrive rig and BattleMoments makes none of its own camera moves for it', async () => {
    const { moments: m, stage } = moments('normal', YRP_SHOT_DIRECTOR);
    await m.actionOpen('bahamut', 'cast', GIRLS, { abilityId: 'x2-bahamut-mega-flare', commandKind: 'ability' });
    expect(cameraCalls(stage.calls)).toEqual([`camera:${OVERDRIVE_RIG}`]);
  });

  it('at skip speed it is a cut to the overdrive rig', async () => {
    const { moments: m, stage } = moments('skip', YRP_SHOT_DIRECTOR);
    await m.actionOpen('bahamut', 'cast', GIRLS, { abilityId: 'mega-flare', commandKind: 'ability' });
    expect(cameraCalls(stage.calls)).toEqual([`camera!:${OVERDRIVE_RIG}`]);
  });

  it('every other action plays exactly the calls it plays with no director at all (the golden grammar), at both speeds', async () => {
    for (const speed of ['normal', 'skip'] as const) {
      for (const [actor, pose, ability] of [
        ['bahamut', 'attack', 'x2-bahamut-attack'],
        ['bahamut', 'cast', 'impulse'],
        ['yuna', 'cast', 'x2-white-mage-cure'],
        ['rikku', 'attack', undefined],
      ] as const) {
        const targets = actor === 'bahamut' ? GIRLS : ['bahamut'];
        const info = ability === undefined ? undefined : { abilityId: ability, commandKind: 'ability' as const };
        const directed = moments(speed, YRP_SHOT_DIRECTOR);
        const plain = moments(speed, undefined);
        await directed.moments.actionOpen(actor, pose, targets, info);
        await plain.moments.actionOpen(actor, pose, targets, info);
        expect(directed.stage.calls, `${speed} ${actor} ${ability}`).toEqual(plain.stage.calls);
        expect(cameraCalls(directed.stage.calls), `${speed} ${actor} ${ability}: BattleMoments moved the camera`).not.toEqual([]);
      }
    }
  });
});
