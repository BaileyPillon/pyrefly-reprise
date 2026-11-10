/**
 * Test 13, the pure half, of the FFX-2 Special look (step A; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2): the table of how the one connected figure
 * answers the engine's events, and which members of an actor handle forward, swallow or source. The replay of a recorded burst through the handle and the presenter is C1's and C2's.
 *
 * Removal: drop or add one member in `HANDLE_MEMBERS` and the count and the type-level check fail.
 */

import { describe, expect, it } from 'vitest';
import type { ActorHandle } from '../../src/engine/BattlePresenterPorts.ts';
import { HANDLE_MEMBERS, PYREFLY_GREEN, reactionOf, type MemberRule } from '../../src/engine/SpecialReactions.ts';

/** A type-level count: `keyof ActorHandle` and the keys of the table must be the same set, in both directions, or this does not compile. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const keysMatch: Same<keyof ActorHandle, keyof typeof HANDLE_MEMBERS> = true;

const names = (rule: MemberRule): string[] => Object.entries(HANDLE_MEMBERS).filter(([, r]) => r === rule).map(([k]) => k).sort();

describe('the handle members', () => {
  it('cover every member of ActorHandle, at the type level and at run time', () => {
    expect(keysMatch).toBe(true);
    expect(Object.keys(HANDLE_MEMBERS)).toHaveLength(29);
  });

  it('are 16 forward, 10 swallow and 3 source (the plan counted 16, 9 and 3 for the 28 members it knew; noteStatus, added on 2026-11-09, is the 10th swallowed: a status on a part never touches the figure)', () => {
    expect(names('forward')).toEqual(
      ['flash', 'hitReact', 'hop', 'leap', 'liftRelease', 'liftTo', 'lunge', 'moveTo', 'recoil', 'setFacing', 'setPose', 'shake', 'squash', 'strike', 'strikeHeft', 'waitMs'].sort(),
    );
    expect(names('swallow')).toEqual(['dissolveTo', 'fadeTo', 'lieDown', 'noteStatus', 'ramp', 'setAlpha', 'setBrightness', 'setDissolve', 'setStone', 'standDown'].sort());
    expect(names('source')).toEqual(['centerPoint', 'headPoint', 'position']);
    expect(names('forward').length + names('swallow').length + names('source').length).toBe(29);
  });
});

describe('the event rows', () => {
  it('action-start: the main attacks or casts as today (no pose named), a part CASTS, never attacks; both show on their plate', () => {
    expect(reactionOf('action-start', 'main')).toEqual({ figure: 'forward', plate: true });
    expect(reactionOf('action-start', 'part')).toEqual({ figure: 'forward', pose: 'cast', plate: true });
  });

  it('turn-start and action-end return the figure to idle, for the main and for a part, on no plate', () => {
    for (const type of ['turn-start', 'action-end'] as const) {
      for (const role of ['main', 'part'] as const) expect(reactionOf(type, role)).toEqual({ figure: 'forward', pose: 'idle', plate: false });
    }
  });

  it('damage: one hurt pose on the figure for the main or a part (once per enemy action is the handle\'s gate), and the plate', () => {
    for (const role of ['main', 'part'] as const) expect(reactionOf('damage', role)).toEqual({ figure: 'forward', pose: 'hurt-once', plate: true });
  });

  it('heal: the pyrefly-green flash and NO hurt pose', () => {
    for (const role of ['main', 'part'] as const) {
      const r = reactionOf('heal', role);
      expect(r).toEqual({ figure: 'forward', flash: 0x9dffc4, plate: true });
      expect(r.pose).toBeUndefined();
    }
    expect(PYREFLY_GREEN).toBe(0x9dffc4);
  });

  it('miss is the ordinary hop; mp-damage and mp-heal touch the plate and not the figure', () => {
    expect(reactionOf('miss', 'main')).toEqual({ figure: 'forward', plate: false });
    for (const type of ['mp-damage', 'mp-heal'] as const) expect(reactionOf(type, 'part')).toEqual({ figure: 'none', plate: true });
  });

  it('status-add and status-remove: forward for the main, none for a part', () => {
    for (const type of ['status-add', 'status-remove'] as const) {
      expect(reactionOf(type, 'main', { status: 'poison' })).toEqual({ figure: 'forward', plate: true });
      expect(reactionOf(type, 'part', { status: 'poison' })).toEqual({ figure: 'none', plate: true });
      expect(reactionOf(type, 'part', { status: 'petrify', allPartsPetrified: true })).toEqual({ figure: 'none', plate: true });
    }
  });

  it('Petrify on the main alone is none; the figure stones only when all three parts are Petrified', () => {
    for (const type of ['status-add', 'status-remove'] as const) {
      expect(reactionOf(type, 'main', { status: 'petrify' }).figure).toBe('none');
      expect(reactionOf(type, 'main', { status: 'petrify', allPartsPetrified: false }).figure).toBe('none');
      expect(reactionOf(type, 'main', { status: 'petrify', allPartsPetrified: true }).figure).toBe('forward');
    }
  });

  it('ko and revive of a part are guarded (no pose change, no lie-down, no stand-up); the main\'s ko holds the figure for the fall beat', () => {
    expect(reactionOf('ko', 'part')).toEqual({ figure: 'guard', plate: true });
    expect(reactionOf('revive', 'part')).toEqual({ figure: 'guard', plate: true });
    expect(reactionOf('ko', 'main')).toEqual({ figure: 'guard', plate: true });
  });

  it('Auto-Life on the main: the existing revive flash in the pyrefly green on the figure', () => {
    expect(reactionOf('revive', 'main', { cause: 'auto-life' })).toEqual({ figure: 'forward', flash: 0x9dffc4, plate: true });
    expect(reactionOf('status-remove', 'main', { status: 'auto-life' }).figure).toBe('forward');
  });

  it('an event with no row is not the figure\'s business and not the plate\'s', () => {
    for (const type of ['atb', 'message', 'overdrive-gauge', 'victory', 'defeat', 'spherechange'] as const) {
      expect(reactionOf(type, 'main')).toEqual({ figure: 'none', plate: false });
      expect(reactionOf(type, 'part')).toEqual({ figure: 'none', plate: false });
    }
  });
});
