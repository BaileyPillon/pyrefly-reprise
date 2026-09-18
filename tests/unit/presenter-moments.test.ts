/**
 * The shots: which camera move each battle event picks, and what "skippable"
 * actually means.
 *
 * `BattleMoments` is the only thing in the project that decides *where the
 * camera is*, so these are the rules that would otherwise only be visible by
 * watching a whole fight: an attack punches in on the attacker and **cuts** to
 * the target, a twelve-hit Overdrive cuts once rather than twelve times, a
 * charge telegraph's vignette outlives the action that raised it, and a
 * `'skip'` run spends no time and raises no chrome at all.
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { BattleMoments, MOMENT_TIMING } from '../../src/engine/BattleMoments.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { MomentsPort, PlaybackSpeed } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeAudio, FakeStage, noSleep } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

/** Records every layer a moment raises, without a DOM. */
class FakeMoments implements MomentsPort {
  readonly calls: string[] = [];
  async letterbox(on: boolean): Promise<void> {
    this.calls.push(`letterbox:${on ? 'on' : 'off'}`);
  }
  async nameSlab(opts: { title: string; kind: string }): Promise<void> {
    this.calls.push(`slab:${opts.kind}:${opts.title}`);
  }
  vignette(on: boolean, opts?: { bpm?: number }): void {
    this.calls.push(`vignette:${on ? `on@${opts?.bpm ?? '?'}` : 'off'}`);
  }
  clear(): void {
    this.calls.push('clear');
  }
}

/** Just the slice of the HUD a moment is allowed to touch. */
class FakeHud {
  readonly visibility: boolean[] = [];
  setVisible(visible: boolean): void {
    this.visibility.push(visible);
  }
}

function setup(speed: PlaybackSpeed = 'normal') {
  const stage = new FakeStage(['tidus', 'yuna'], ['yunalesca']);
  const overlay = new FakeMoments();
  const audio = new FakeAudio();
  const hud = new FakeHud();
  const moments = new BattleMoments({
    stage,
    moments: overlay,
    audio,
    hud,
    sleep: noSleep,
    speed: () => speed,
  });
  return { stage, overlay, audio, hud, moments };
}

// --------------------------------------------------------------- rig choice

describe('rig choice', () => {
  it('frames an attacker and a target on their own sides of the field', () => {
    const { moments } = setup();
    expect(moments.rigFor('tidus')).toBe('party');
    expect(moments.rigFor('yunalesca')).toBe('enemy');
  });

  it('falls back through action to idle on a scene with no side rigs', () => {
    const stage = new FakeStage(['tidus'], ['yunalesca']);
    (stage.camera as { rigNames: string[] }).rigNames = ['idle', 'action'];
    const moments = new BattleMoments({ stage, sleep: noSleep, speed: () => 'normal' });
    expect(moments.rigFor('tidus')).toBe('action');

    (stage.camera as { rigNames: string[] }).rigNames = ['idle'];
    expect(moments.rigFor('yunalesca')).toBe('idle');
  });
});

// -------------------------------------------------------------- per action

describe('the action moment', () => {
  it('pushes in on the attacker and rolls the horizon on a swing', async () => {
    const { stage, moments } = setup();
    await moments.actionOpen('tidus', 'attack');
    expect(stage.calls).toContain('camera:party');
    expect(stage.calls.some((c) => c.startsWith('camera:push'))).toBe(true);
    // Spec "Motion & camera": -4deg roll on every attack.
    expect(stage.calls).toContain('camera:roll=-4');
  });

  it('does not roll on a spell', async () => {
    const { stage, moments } = setup();
    await moments.actionOpen('yuna', 'cast');
    expect(stage.calls.some((c) => c.startsWith('camera:roll'))).toBe(false);
  });

  it('cuts to the target on impact rather than panning', () => {
    const { stage, moments } = setup();
    moments.impact('yunalesca', { hitIndex: 0 });
    // `camera!:` is snapTo — a cut. A tweened `camera:` here would be a pan.
    expect(stage.calls).toContain('camera!:enemy');
  });

  it('cuts once for a multi-hit action, not once per hit', () => {
    const { stage, moments } = setup();
    moments.impact('yunalesca', { hitIndex: 0 });
    moments.impact('yunalesca', { hitIndex: 1 });
    moments.impact('yunalesca', { hitIndex: 7 });
    expect(stage.calls.filter((c) => c === 'camera!:enemy')).toHaveLength(1);
  });

  it('does not re-cut when the target is already the framed side', () => {
    const { stage, moments } = setup();
    moments.impact('yunalesca', { hitIndex: 0 });
    stage.calls.length = 0;
    moments.impact('yunalesca', { hitIndex: 0 });
    expect(stage.calls.filter((c) => c === 'camera!:enemy')).toHaveLength(0);
  });
});

// --------------------------------------------------------------- overdrive

describe('the Overdrive moment', () => {
  it('letterboxes, names the Overdrive and holds a push-in', async () => {
    const { overlay, stage, moments } = setup();
    await moments.overdriveStart('tidus', 'Blitz Ace');
    expect(overlay.calls).toEqual(['letterbox:on', 'slab:overdrive:Blitz Ace']);
    expect(stage.calls.some((c) => c.startsWith('camera:push'))).toBe(true);
  });

  it('drops the letterbox and the push when the action ends', async () => {
    const { overlay, stage, moments } = setup();
    await moments.overdriveStart('tidus', 'Blitz Ace');
    overlay.calls.length = 0;
    stage.calls.length = 0;
    await moments.actionClose();
    expect(overlay.calls).toContain('letterbox:off');
    expect(stage.calls).toContain('camera:release');
  });

  it('closing twice is harmless', async () => {
    const { overlay, moments } = setup();
    await moments.overdriveStart('tidus', 'Blitz Ace');
    await moments.overdriveEnd();
    overlay.calls.length = 0;
    await moments.overdriveEnd();
    expect(overlay.calls).toEqual([]);
  });
});

// --------------------------------------------------------------- telegraph

describe('the charge telegraph moment', () => {
  it('throbs faster and pushes further when the attack is imminent', async () => {
    const calm = setup();
    await calm.moments.telegraph('yunalesca', 1, 'Mega Death');
    const imminent = setup();
    await imminent.moments.telegraph('yunalesca', 2, 'Mega Death');

    expect(calm.overlay.calls).toContain('vignette:on@84');
    expect(imminent.overlay.calls).toContain('vignette:on@132');
    // Only stage 2 — "it lands next turn" — earns the name slab.
    expect(calm.overlay.calls.some((c) => c.startsWith('slab:'))).toBe(false);
    expect(imminent.overlay.calls).toContain('slab:telegraph:Mega Death');
  });

  it('outlives the action that raised it, then clears on the next one', async () => {
    const { overlay, moments } = setup();
    await moments.telegraph('yunalesca', 2, 'Mega Death');
    // The boss's own action ends: the dread has to survive it, or the vignette
    // would flash on and straight back off in the same beat.
    await moments.actionClose();
    expect(overlay.calls).not.toContain('vignette:off');

    // A later action ends, and now it clears — the same rule `FFXBattleHud`
    // uses for the screen border it raises from the same event.
    await moments.actionOpen('tidus', 'attack');
    await moments.actionClose();
    expect(overlay.calls).toContain('vignette:off');
  });
});

// ---------------------------------------------------------- battle start

describe('the opening moment', () => {
  it('slides the party in, settles on idle, then reveals the boss', async () => {
    const { stage, overlay, moments } = setup();
    await moments.battleStart({
      partyIds: ['tidus', 'yuna'],
      bossId: 'yunalesca',
      bossName: 'Yunalesca',
    });

    expect(stage.calls).toContain('camera!:intro');
    expect(stage.calls).toContain('moveTo:tidus');
    expect(stage.calls).toContain('camera:enemy');
    expect(overlay.calls).toContain('slab:reveal:Yunalesca');
    expect(stage.calls.filter((c) => c === 'camera:idle').length).toBeGreaterThan(0);
  });

  it('reveals each boss once, but a new form earns a new plate', async () => {
    const { overlay, moments } = setup();
    await moments.revealBoss('yunalesca', 'Yunalesca');
    await moments.revealBoss('yunalesca', 'Yunalesca');
    expect(overlay.calls.filter((c) => c === 'slab:reveal:Yunalesca')).toHaveLength(1);

    await moments.formChange('yunalesca');
    await moments.revealBoss('yunalesca', 'Yunalesca');
    expect(overlay.calls.filter((c) => c === 'slab:reveal:Yunalesca')).toHaveLength(2);
  });

  it('plays the party slide with no boss at all', async () => {
    const { stage, overlay, moments } = setup();
    await moments.battleStart({ partyIds: ['tidus'] });
    expect(stage.calls).toContain('moveTo:tidus');
    expect(overlay.calls.some((c) => c.startsWith('slab:'))).toBe(false);
  });

  // The reveal plate is hung off the same edge as the CTB list, so the opening
  // keeps the HUD down and hands it back — the way FFX raises its battle HUD
  // only once the encounter has established itself.
  it('keeps the HUD down for the reveal and raises it afterwards', async () => {
    const { hud, moments } = setup();
    await moments.battleStart({
      partyIds: ['tidus'],
      bossId: 'yunalesca',
      bossName: 'Yunalesca',
    });
    expect(hud.visibility).toEqual([false, true]);
  });

  it('hands the HUD back even when the opening throws', async () => {
    const { stage, hud, moments } = setup();
    stage.actor = () => {
      throw new Error('art layer fell over');
    };
    await expect(
      moments.battleStart({ partyIds: ['tidus'], bossId: 'yunalesca', bossName: 'Yunalesca' }),
    ).rejects.toThrow('art layer fell over');
    expect(hud.visibility.at(-1)).toBe(true);
  });

  it('never takes the HUD down on a skipped opening', async () => {
    const { hud, moments } = setup('skip');
    await moments.battleStart({ partyIds: ['tidus'], bossId: 'yunalesca', bossName: 'Yunalesca' });
    expect(hud.visibility).not.toContain(false);
  });

  // An abort mid-opening skips `battleStart`'s own restore; a HUD left hidden
  // would follow the player into the next battle on the same screen.
  it('raises the HUD again when a battle is torn down mid-opening', () => {
    const { hud, moments } = setup();
    moments.clear();
    expect(hud.visibility.at(-1)).toBe(true);
  });
});

// -------------------------------------------------------------- skippable

describe('skippable', () => {
  it("raises no chrome at all and never tweens at 'skip'", async () => {
    const { stage, overlay, moments } = setup('skip');
    await moments.battleStart({ partyIds: ['tidus'], bossId: 'yunalesca', bossName: 'Yunalesca' });
    await moments.actionOpen('tidus', 'attack');
    moments.impact('yunalesca', { hitIndex: 0, heavy: true });
    await moments.overdriveStart('tidus', 'Blitz Ace');
    await moments.telegraph('yunalesca', 2, 'Mega Death');
    await moments.formChange('yunalesca');
    await moments.victory();

    expect(overlay.calls).toEqual([]);
    // Every rig change is a hard snap (`camera!:`); nothing is tweened.
    expect(stage.calls.filter((c) => c.startsWith('camera:') && c !== 'camera:shake')).toEqual([]);
  });

  it('scales every authored duration by the playback speed', () => {
    const fast = setup('fast').moments;
    const normal = setup('normal').moments;
    expect(normal.ms(MOMENT_TIMING.revealPush)).toBe(MOMENT_TIMING.revealPush);
    expect(fast.ms(MOMENT_TIMING.revealPush)).toBeCloseTo(MOMENT_TIMING.revealPush * 0.32);
    expect(setup('skip').moments.ms(MOMENT_TIMING.revealPush)).toBe(0);
  });
});

// ------------------------------------------------------- through the loop

describe('through the presenter', () => {
  function playing(speed: PlaybackSpeed = 'normal') {
    const stage = new FakeStage(['tidus', 'yuna'], ['yunalesca']);
    const overlay = new FakeMoments();
    const presenter = new BattlePresenter({
      stage,
      moments: overlay,
      audio: new FakeAudio(),
      sleep: noSleep,
    });
    presenter.setSpeed(speed);
    const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> =>
      presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
    return { stage, overlay, presenter, play };
  }

  it('an ordinary attack punches in on the attacker and cuts to the target', async () => {
    const { stage, play } = playing();
    await play([
      {
        type: 'action-start',
        actorId: 'tidus',
        command: { kind: 'attack', targets: ['yunalesca'] },
        abilityName: 'Attack',
      },
      {
        type: 'damage',
        targetId: 'yunalesca',
        amount: 1846,
        element: 'none',
        crit: false,
        hitIndex: 0,
        hitCount: 1,
      },
      { type: 'action-end', actorId: 'tidus' },
    ] as Array<Unsequenced<BattleEvent>>);

    expect(stage.calls).toContain('camera:party');
    expect(stage.calls).toContain('camera!:enemy');
    expect(stage.calls).toContain('camera:idle');
  });

  it('an overdrive command takes the Overdrive moment, not the plain one', async () => {
    const { overlay, play } = playing();
    await play([
      {
        type: 'action-start',
        actorId: 'tidus',
        command: { kind: 'overdrive', targets: ['yunalesca'] },
        abilityName: 'Blitz Ace',
      },
      { type: 'action-end', actorId: 'tidus' },
    ] as Array<Unsequenced<BattleEvent>>);

    expect(overlay.calls).toContain('letterbox:on');
    expect(overlay.calls).toContain('slab:overdrive:Blitz Ace');
    expect(overlay.calls).toContain('letterbox:off');
  });

  it('a charge event raises the vignette under the HUD banner', async () => {
    const { overlay, play } = playing();
    await play([
      { type: 'charge', enemyId: 'yunalesca', name: 'Mega Death', stage: 2 },
    ] as Array<Unsequenced<BattleEvent>>);
    expect(overlay.calls).toContain('vignette:on@132');
  });

  it('a defeat tears every layer down', async () => {
    const { overlay, play } = playing();
    await play([{ type: 'defeat' }] as Array<Unsequenced<BattleEvent>>);
    expect(overlay.calls).toContain('clear');
  });

  it('an explicit camera event still obeys the playback speed', async () => {
    const { stage, play } = playing('skip');
    await play([{ type: 'camera', rig: 'enemy', ms: 700 }] as Array<Unsequenced<BattleEvent>>);
    // At 'skip' a 700 ms tween would be 700 ms of real time. It has to cut.
    expect(stage.calls).toContain('camera!:enemy');
    expect(stage.calls).not.toContain('camera:enemy');
  });
});
