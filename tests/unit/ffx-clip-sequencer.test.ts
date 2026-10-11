/**
 * **The order an actor's clips play in** (`src/engine/ffx3d/clipSequencer.ts`; FFX only). A pure state machine, so every case here drives it with made-up rows and reads the commands it returns: no model, no
 * mixer, no retail name. What this file pins:
 *
 * 1. **Idle, finite, held and terminal rows.** A finite row plays its clips and settles; asking for idle does not cut it. A held row loops its hold until released (the effect landing, or idle wanted),
 *    then plays what follows and settles; a second hold in the tail is skipped once released. A terminal row holds its last clip until something else is wanted.
 * 2. **Interruption.** Another row wanted interrupts at once, with a crossfade, from its first clip.
 * 3. **Edge-triggered.** The same key twice is nothing; a key the actor has no row for plays as idle.
 * 4. **Landing a strike.** With a lead, the row starts part-way in, sped up, so its contact frame lands with the hit; with time to spare it plays at its own speed from the start.
 * 5. **The hurt reaction** is brought down to about half a second whatever the clip's length.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import type { ClipRow } from '../../src/engine/ffx3d/clipMap.ts';
import { ClipSequencer, DEFAULT_FADE, FADES, MAX_SCALE, MAX_SCALE_SHORT, STEP_FADE, holdIndexOf, isTerminal, locateFrame } from '../../src/engine/ffx3d/clipSequencer.ts';

const once = (clip: string, frames: number) => ({ clip, loop: false, frames });
const loop = (clip: string, frames: number) => ({ clip, loop: true, frames });

const ROWS: Record<string, ClipRow> = {
  idle: { steps: [loop('IDLE', 28)], contact: null },
  attack: { steps: [once('ATK_0', 21), once('ATK_1', 15)], contact: 20 },
  hurt: { steps: [once('HURT', 30)], contact: null },
  cast: { steps: [once('CAST_0', 20), loop('CAST_1', 16), once('CAST_2', 39)], contact: null },
  breath: { steps: [once('B_0', 48), loop('B_1', 34), once('B_2', 58), loop('B_3', 34), once('B_4', 60)], contact: null },
  ko: { steps: [once('KO_0', 61), loop('KO_1', 1)], contact: null },
  victory: { steps: [once('WIN_0', 110), loop('WIN_1', 50)], contact: null },
  strike: { steps: [once('S_0', 13), once('S_1', 37)], contact: 20 },
  slow: { steps: [once('SLOW', 48)], contact: null },
};
const clipOf = (c: { clip: string } | null): string | null => (c ? c.clip : null);
const make = (): ClipSequencer => {
  const seq = new ClipSequencer(ROWS);
  seq.start();
  return seq;
};

describe('the shapes of a row', () => {
  it('classifies rows: where the hold is, whether the last clip loops, which step a frame is in', () => {
    expect(holdIndexOf(ROWS['cast']!)).toBe(1);
    expect(holdIndexOf(ROWS['breath']!)).toBe(1); // the first hold; the second is in the tail
    expect(holdIndexOf(ROWS['attack']!)).toBe(-1);
    expect(holdIndexOf(ROWS['ko']!)).toBe(-1); // its loop is the last clip
    expect([ROWS['ko']!, ROWS['victory']!, ROWS['idle']!].map(isTerminal)).toEqual([true, true, true]);
    expect([ROWS['cast']!, ROWS['attack']!].map(isTerminal)).toEqual([false, false]);
    expect(locateFrame(ROWS['attack']!, 0)).toEqual({ step: 0, frame: 0 });
    expect(locateFrame(ROWS['attack']!, 20)).toEqual({ step: 0, frame: 20 });
    expect(locateFrame(ROWS['attack']!, 21)).toEqual({ step: 1, frame: 0 });
    expect(locateFrame(ROWS['attack']!, 999)).toEqual({ step: 1, frame: 14 }); // past the end: the last frame
  });

  it('starts standing: the idle loop, no crossfade', () => {
    const seq = new ClipSequencer(ROWS);
    expect(seq.start()).toEqual({ key: 'idle', step: 0, clip: 'IDLE', loop: true, fade: 0, startFrame: 0, scale: 1 });
  });
});

describe('a finite row (attack, hurt)', () => {
  it('plays its clips in turn and settles to idle; asking for idle in the middle does not cut it', () => {
    const seq = make();
    expect(clipOf(seq.want('attack'))).toBe('ATK_0');
    expect(seq.want('idle')).toBeNull(); // the presenter put the idle painting back already: the blow finishes
    expect(seq.state.key).toBe('attack');
    const second = seq.ended()!;
    expect([second.clip, second.fade, second.loop]).toEqual(['ATK_1', STEP_FADE, false]);
    const done = seq.ended()!;
    expect([done.key, done.clip, done.loop, done.fade]).toEqual(['idle', 'IDLE', true, FADES['idle']]);
    expect(seq.ended()).toBeNull(); // idle is a loop: nothing ends
  });

  it('a pose held after the clips are done does not restart it (edge-triggered)', () => {
    const seq = make();
    seq.want('attack');
    seq.ended();
    seq.ended(); // settled to idle while the presenter still shows the attack pose
    expect(seq.want('attack')).toBeNull();
    expect(seq.state.key).toBe('idle');
    seq.want('idle');
    expect(clipOf(seq.want('attack'))).toBe('ATK_0'); // a new action is a new edge
  });

  it('the hurt reaction plays in about half a second: sped up to it, at most three times', () => {
    const seq = make();
    const cmd = seq.want('hurt')!;
    expect([cmd.clip, cmd.fade, cmd.scale]).toEqual(['HURT', FADES['hurt'], 2]); // 30 frames = 1 s
    const long = new ClipSequencer({ ...ROWS, hurt: { steps: [once('BIG_HURT', 48)], contact: null } }); // 1.6 s
    long.start();
    expect(long.want('hurt')!.scale).toBe(MAX_SCALE_SHORT);
    const short = new ClipSequencer({ ...ROWS, hurt: { steps: [once('TINY', 6)], contact: null } }); // 0.2 s: never slowed
    short.start();
    expect(short.want('hurt')!.scale).toBe(1);
  });
});

describe('a held row (cast, breath)', () => {
  it('plays the lead-in, loops the hold, and stays there until released', () => {
    const seq = make();
    expect(clipOf(seq.want('cast'))).toBe('CAST_0');
    const hold = seq.ended()!;
    expect([hold.clip, hold.loop]).toEqual(['CAST_1', true]);
    expect(seq.state.holding).toBe(true);
    expect(seq.ended()).toBe(seq.ended()); // a loop never "ends": asking again changes nothing
    expect(seq.state.step).toBe(1);
  });

  it('is released by the effect landing: the clip after the hold plays, then idle', () => {
    const seq = make();
    seq.want('cast');
    seq.ended();
    const release = seq.release()!;
    expect([release.clip, release.loop, release.fade]).toEqual(['CAST_2', false, STEP_FADE]);
    expect(seq.state.holding).toBe(false);
    expect(seq.ended()).toMatchObject({ key: 'idle', clip: 'IDLE' });
  });

  it('is released by the action ending when no effect landed: idle wanted at the hold plays the release, then settles', () => {
    const seq = make();
    seq.want('cast');
    seq.ended();
    expect(clipOf(seq.want('idle'))).toBe('CAST_2');
    expect(seq.ended()).toMatchObject({ key: 'idle' });
  });

  it('idle wanted during the lead-in: the hold is skipped when it comes, the release still plays', () => {
    const seq = make();
    seq.want('cast');
    expect(seq.want('idle')).toBeNull(); // still winding up: it plays out
    expect(clipOf(seq.ended())).toBe('CAST_2'); // the hold is not wanted
    expect(seq.ended()).toMatchObject({ key: 'idle' });
  });

  it('a release before the hold is reached skips the hold too', () => {
    const seq = make();
    seq.want('cast');
    expect(seq.release()).toBeNull(); // nothing to leave yet
    expect(clipOf(seq.ended())).toBe('CAST_2');
  });

  it('a second hold in the tail is skipped once released (a breath: wind-up, hold, breath, hold, end)', () => {
    const seq = make();
    expect(clipOf(seq.want('breath'))).toBe('B_0');
    expect(clipOf(seq.ended())).toBe('B_1'); // the first hold
    expect(clipOf(seq.release())).toBe('B_2'); // the breath
    expect(clipOf(seq.ended())).toBe('B_4'); // the second hold is skipped: the end
    expect(seq.ended()).toMatchObject({ key: 'idle' });
  });

  it('with nothing to release, a row with no hold treats the call as nothing', () => {
    const seq = make();
    seq.want('attack');
    expect(seq.release()).toBeNull();
    expect(seq.release()).toBeNull();
    expect(seq.state.key).toBe('attack');
  });
});

describe('a terminal row (ko, victory)', () => {
  it('plays its clips and holds the last until something else is wanted', () => {
    const seq = make();
    expect(clipOf(seq.want('ko'))).toBe('KO_0');
    const lying = seq.ended()!;
    expect([lying.clip, lying.loop]).toEqual(['KO_1', true]);
    expect(seq.ended()).toBeNull(); // nothing follows: the figure lies there
    expect(seq.state.key).toBe('ko');
  });

  it('is told to stand again by idle being wanted: the idle loop, crossfaded', () => {
    const seq = make();
    seq.want('ko');
    seq.ended();
    expect(seq.want('idle')).toMatchObject({ key: 'idle', clip: 'IDLE', loop: true, fade: FADES['idle'] });
  });

  it('victory celebrates, then loops its hold', () => {
    const seq = make();
    expect(clipOf(seq.want('victory'))).toBe('WIN_0');
    expect(seq.ended()).toMatchObject({ clip: 'WIN_1', loop: true });
  });
});

describe('interruption and keys with no row', () => {
  it('another row wanted interrupts any action at once, from its first clip', () => {
    const seq = make();
    seq.want('cast');
    seq.ended();
    const cmd = seq.want('hurt')!;
    expect([cmd.key, cmd.clip, cmd.step, cmd.fade]).toEqual(['hurt', 'HURT', 0, FADES['hurt']]);
    const ko = seq.want('ko')!;
    expect([ko.key, ko.clip]).toEqual(['ko', 'KO_0']);
  });

  it('the same key twice is nothing', () => {
    const seq = make();
    expect(seq.want('idle')).toBeNull();
    seq.want('cast');
    expect(seq.want('cast')).toBeNull();
  });

  it('a key the actor has no row for plays as idle: nothing to start, and a held row is told its action is over', () => {
    const seq = make();
    expect(seq.want('defend')).toBeNull(); // no defend row: stays standing
    seq.want('cast');
    seq.ended();
    expect(clipOf(seq.want('guard-that-does-not-exist'))).toBe('CAST_2'); // asked for something it cannot play: reads as idle, which ends the hold
  });

  it('uses the default crossfade for a row with none of its own', () => {
    const seq = make();
    expect(seq.want('cast')!.fade).toBe(DEFAULT_FADE);
    expect(seq.want('ko')!.fade).toBe(FADES['ko']);
  });
});

describe('landing a strike on the hit', () => {
  it('starts part-way in, sped up, so the contact frame lands at the lead (attack: contact on frame 20 of 36)', () => {
    const seq = make();
    const cmd = seq.want('attack', { lead: 0.3 })!; // 20 frames take 0.667 s at 1x: 2.2x wanted, capped at the maximum
    expect(cmd.scale).toBe(MAX_SCALE);
    // it must cover 0.3 s * 30 fps * 1.8 = 16.2 frames before the contact at 20: start at frame 3.8 -> 3
    expect([cmd.clip, cmd.startFrame]).toEqual(['ATK_0', 3]);
  });

  it('with a lead that needs less speed, the speed is the ratio and the start is that much nearer the strike', () => {
    const seq = make();
    const cmd = seq.want('attack', { lead: 0.5 })!; // 0.667 s / 0.5 s = 1.333x
    expect(cmd.scale).toBeCloseTo(4 / 3, 6);
    expect(cmd.startFrame).toBe(0); // 20 - 0.5 * 30 * 1.333 = 0
  });

  it('with time to spare it plays from the start at its own speed (the strike lands early rather than the clip being slowed)', () => {
    const seq = make();
    const cmd = seq.want('attack', { lead: 2 })!;
    expect([cmd.scale, cmd.startFrame, cmd.step]).toEqual([1, 0, 0]);
  });

  it('can start in a later clip of the sequence: the contact is counted from the start of the whole row', () => {
    const seq = make();
    const cmd = seq.want('strike', { lead: 0.2 })!; // contact 20 = step 1 frame 7; 0.2 s * 30 * 1.8 = 10.8 frames before it: 9.2 -> step 0 frame 9
    expect([cmd.clip, cmd.startFrame]).toEqual(['S_0', 9]);
    const next = seq.ended()!; // then the second clip plays on from its start, as the sequence does
    expect([next.clip, next.scale]).toEqual(['S_1', MAX_SCALE]);
  });

  it('a row with no contact frame, or no lead, plays from its start', () => {
    const seq = make();
    expect(seq.want('slow', { lead: 0.2 })).toMatchObject({ clip: 'SLOW', startFrame: 0, scale: 1 });
    seq.want('idle');
    expect(seq.want('attack')).toMatchObject({ clip: 'ATK_0', startFrame: 0, scale: 1 });
  });

  it('a zero or negative lead is ignored', () => {
    const seq = make();
    expect(seq.want('attack', { lead: 0 })).toMatchObject({ startFrame: 0, scale: 1 });
    seq.want('idle');
    expect(seq.want('attack', { lead: -1 })).toMatchObject({ startFrame: 0, scale: 1 });
  });
});

describe('acknowledging a key', () => {
  it('takes a key as seen without playing anything, so the same key is no edge afterwards (a painting left over from before a flight)', () => {
    const seq = make();
    seq.acknowledge('attack');
    expect(seq.want('attack')).toBeNull();
    expect(seq.state).toMatchObject({ key: 'idle', wanted: 'attack' });
    expect(clipOf(seq.want('idle'))).toBeNull(); // idle is an edge, but there is nothing to play: already standing
    expect(clipOf(seq.want('attack'))).toBe('ATK_0'); // and a later attack is a real one
  });
});
