/**
 * What each `BattleEvent` actually does to the field.
 *
 * These are the rules that are easy to get subtly wrong and impossible to see
 * in a screenshot: negative damage is healing, a sent fiend leaves the field
 * but a KO'd party member does not, a form change resolves its own art id, an
 * unknown SFX key never goes silent.
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { poseForCommand } from '../../src/engine/BattlePresenterEvents.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import {
  FakeAudio,
  FakeDamageNumbers,
  FakeMessageBar,
  FakeStage,
  noSleep,
} from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

function setup() {
  const stage = new FakeStage(['tidus', 'yuna'], ['seymour-flux', 'mortiorchis']);
  const damageNumbers = new FakeDamageNumbers();
  const messageBar = new FakeMessageBar();
  const audio = new FakeAudio();
  const presenter = new BattlePresenter({
    stage,
    damageNumbers,
    messageBar,
    audio,
    sleep: noSleep,
  });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> =>
    presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { presenter, stage, damageNumbers, messageBar, audio, play };
}

describe('damage', () => {
  it('prints a damage numeral and knocks the target back', async () => {
    const { stage, damageNumbers, play } = setup();

    await play([
      {
        type: 'damage',
        targetId: 'seymour-flux',
        amount: 1846,
        element: 'none',
        crit: false,
        hitIndex: 0,
        hitCount: 1,
      },
    ]);

    expect(damageNumbers.shown).toHaveLength(1);
    expect(damageNumbers.shown[0]).toMatchObject({ kind: 'damage', amount: 1846, crit: false });
    expect(stage.calls).toContain('recoil:seymour-flux');
    expect(stage.calls).toContain('flash:seymour-flux');
  });

  it('treats negative damage as healing, not as a hit', async () => {
    // CONTRACTS.md rule 5: a `heals`-flagged action emits `damage` with a
    // negative amount. This is what makes Zombie work.
    const { stage, damageNumbers, play } = setup();

    await play([
      {
        type: 'damage',
        targetId: 'tidus',
        amount: -1240,
        element: 'none',
        crit: false,
        hitIndex: 0,
        hitCount: 1,
      },
    ]);

    expect(damageNumbers.shown[0]).toMatchObject({ kind: 'heal', amount: 1240 });
    expect(stage.calls).not.toContain('recoil:tidus');
    expect(stage.calls).not.toContain('camera:shake');
  });

  it('a crit earns hit-stop, a camera shake and a dolly punch', async () => {
    const { stage, play } = setup();

    await play([
      {
        type: 'damage',
        targetId: 'seymour-flux',
        amount: 9999,
        element: 'fire',
        crit: true,
        hitIndex: 0,
        hitCount: 1,
        capped: true,
      },
    ]);

    expect(stage.calls).toContain('camera:shake');
    expect(stage.calls).toContain('camera:punch');
    expect(stage.calls).toContain('impact:seymour-flux:crit');
  });

  it('stacks a multi-hit action on one rising ladder', async () => {
    const { damageNumbers, play } = setup();

    await play(
      [0, 1, 2, 3].map((i) => ({
        type: 'damage' as const,
        targetId: 'seymour-flux',
        amount: 500,
        element: 'none' as const,
        crit: false,
        hitIndex: i,
        hitCount: 4,
      })),
    );

    expect(damageNumbers.shown).toHaveLength(4);
    expect(damageNumbers.shown.map((n) => n.hitIndex)).toEqual([0, 1, 2, 3]);
    expect(damageNumbers.shown.every((n) => n.hitCount === 4)).toBe(true);
    // Only the first hit of a combo shakes the camera; the rest run tight.
    expect(damageNumbers.shown[0]!.amount).toBe(500);
  });

  it('prints IMMUNE rather than a zero', async () => {
    const { damageNumbers, play } = setup();

    await play([
      {
        type: 'damage',
        targetId: 'seymour-flux',
        amount: 0,
        element: 'holy',
        affinity: 'immune',
        crit: false,
        hitIndex: 0,
        hitCount: 1,
      },
    ]);

    expect(damageNumbers.shown[0]).toMatchObject({ kind: 'miss', text: 'IMMUNE' });
  });
});

describe('ko', () => {
  it('sends a fiend: it dissolves into pyreflies and leaves the field', async () => {
    const { stage, play } = setup();

    await play([{ type: 'ko', targetId: 'seymour-flux' }]);

    expect(stage.calls).toContain('dissolve=1:seymour-flux');
    expect(stage.calls).toContain('remove:seymour-flux');
    expect(stage.actor('seymour-flux')).toBeUndefined();
  });

  it('leaves a downed party member lying on the field', async () => {
    const { stage, play } = setup();

    await play([{ type: 'ko', targetId: 'tidus' }]);

    expect(stage.calls).toContain('pose=ko:tidus');
    expect(stage.calls).not.toContain('remove:tidus');
    expect(stage.actor('tidus')).toBeDefined();
  });
});

describe('form-change', () => {
  it('resolves <id>-<n> when the event carries no spriteKey', async () => {
    // Yunalesca ships as yunalesca-1/2/3, so form index 1 is the second art.
    const { stage, play } = setup();

    await play([
      { type: 'form-change', enemyId: 'seymour-flux', formIndex: 1, name: 'Seymour Flux' },
    ]);

    expect(stage.calls).toContain('setArt:seymour-flux=seymour-flux-2');
    expect(stage.calls).toContain('screenFlash');
  });

  it('prefers the spriteKey the engine supplied', async () => {
    const { stage, play } = setup();

    await play([
      {
        type: 'form-change',
        enemyId: 'seymour-flux',
        formIndex: 1,
        name: 'Seymour Natus',
        spriteKey: 'seymour-natus',
      },
    ]);

    expect(stage.calls).toContain('setArt:seymour-flux=seymour-natus');
  });
});

describe('spherechange', () => {
  it('swaps the art id to <girl>-<dressphere>', async () => {
    const stage = new FakeStage(['yuna'], ['bahamut']);
    const presenter = new BattlePresenter({ stage, sleep: noSleep });

    await presenter.play([
      { type: 'spherechange', seq: 0, who: 'yuna', from: 'songstress', to: 'gunner', gatesCrossed: [] },
    ]);

    expect(stage.calls).toContain('setArt:yuna=yuna-gunner');
  });
});

describe('pacing and cues', () => {
  it('plays wait, camera, vfx and sfx pacing events', async () => {
    const { stage, audio, play } = setup();

    await play([
      { type: 'camera', rig: 'action', ms: 400 },
      { type: 'vfx', key: 'fire', at: 'seymour-flux' },
      { type: 'sfx', key: 'boss-roar' },
      { type: 'wait', ms: 500 },
    ]);

    expect(stage.calls).toContain('camera:action');
    expect(stage.calls).toContain('vfx:fire@seymour-flux');
    expect(audio.cues).toContain('boss-roar');
  });

  it('falls back to a generic cue when the sfx key is unknown', async () => {
    const { audio, play } = setup();
    audio.unknown.add('seymour-bespoke-scream');

    await play([{ type: 'sfx', key: 'seymour-bespoke-scream' }]);

    // Never silent: the generic impact stands in for a key the bank lacks.
    expect(audio.cues).toEqual(['hit-1']);
  });

  it('routes message events to the bar with their kind intact', async () => {
    const { messageBar, play } = setup();

    await play([
      { type: 'message', text: 'Seymour Flux uses Lance of Atrophy', kind: 'ability' },
      { type: 'charge', enemyId: 'mortiorchis', name: 'Auto-Attack Mode', turnsLeft: 2, stage: 1 },
    ]);

    expect(messageBar.lines[0]).toEqual({
      text: 'Seymour Flux uses Lance of Atrophy',
      kind: 'ability',
    });
    expect(messageBar.lines[1]).toEqual({ text: 'Auto-Attack Mode', kind: 'telegraph' });
  });

  it('a stage-2 telegraph reddens the screen and rumbles the camera', async () => {
    const { stage, play } = setup();

    await play([
      { type: 'charge', enemyId: 'mortiorchis', name: 'Ready to Annihilate', turnsLeft: 0, stage: 2 },
    ]);

    expect(stage.calls).toContain('screenFlash');
    expect(stage.calls).toContain('camera:shake');
  });
});

describe('summon and dismiss', () => {
  it('stages the aeon, then takes it off again', async () => {
    const { stage, play } = setup();

    await play([
      { type: 'summon', aeonId: 'valefor', combatantId: 'valefor', ownerId: 'yuna' },
    ]);
    expect(stage.calls).toContain('add:valefor=valefor');

    await play([{ type: 'dismiss', combatantId: 'valefor', reason: 'command' }]);
    expect(stage.calls).toContain('remove:valefor');
  });
});

describe('victory', () => {
  it('poses the party and moves to the victory rig', async () => {
    const { stage, play } = setup();

    await play([
      {
        type: 'victory',
        result: {
          outcome: 'victory',
          turns: 12,
          elapsedTicks: 100,
          elapsedMs: 40000,
          ap: 10000,
          exp: 0,
          gil: 6000,
          drops: [],
          overkilled: [],
          sphereLevelsGained: {},
        },
      },
    ]);

    expect(stage.calls).toContain('pose=victory:tidus');
    expect(stage.calls).toContain('pose=victory:yuna');
    // Enemies do not celebrate.
    expect(stage.calls).not.toContain('pose=victory:seymour-flux');
    expect(stage.calls).toContain('camera:victory');
  });
});

describe('poseForCommand', () => {
  it('maps every command kind to a painted pose', () => {
    expect(poseForCommand('attack')).toBe('attack');
    expect(poseForCommand('overdrive')).toBe('attack');
    expect(poseForCommand('ability')).toBe('cast');
    expect(poseForCommand('summon')).toBe('cast');
    expect(poseForCommand('item')).toBe('item');
    expect(poseForCommand('defend')).toBe('defend');
    expect(poseForCommand('escape')).toBe('ready');
  });
});

describe('switch', () => {
  /**
   * The member coming in has to be **staged**, not just looked up.
   *
   * `PaintedStage.stage()` only builds actors for the active three; a benched
   * character is `removed` and deliberately has none. So the handler's
   * `stage.actor(inId)` was always `undefined`, the fade-in ran on nothing,
   * and the outgoing figure was removed with nobody put in its place.
   *
   * Verified live in Chapter 1 before the fix: after one Switch the engine's
   * `activeIds` read `["auron","yuna","kimahri"]` while the field held
   * `["yuna","kimahri", ...]`, and aiming a Potion at Auron drew a bracket over
   * empty ground — which is what "not clear which ally is being selected"
   * looks like in its worst form.
   *
   * GAME-AWARE (AGENTS.md rule 14): **FFX only.** Switch is FFX's own
   * mid-battle party swap [visual-bible §3.3, "The Switch flow"]; FFX-2 has a
   * fixed party of three and no equivalent command, which is why
   * `src/battle/ffx2` emits no `switch` event and nothing there changed.
   */
  it('stages the member coming in, on the slot the outgoing one vacated', async () => {
    const { stage, play } = setup();

    await play([{ type: 'switch', outId: 'tidus', inId: 'auron' }]);

    expect(stage.calls).toContain('remove:tidus');
    expect(stage.calls).toContain('add:auron=auron');
    expect(stage.actors.has('auron')).toBe(true);
    expect(stage.actors.has('tidus')).toBe(false);
  });

  it('does not re-stage somebody already on the field', async () => {
    const { stage, play } = setup();

    await play([{ type: 'switch', outId: 'tidus', inId: 'yuna' }]);

    expect(stage.calls.filter((c) => c.startsWith('add:yuna'))).toHaveLength(0);
    expect(stage.actors.has('yuna')).toBe(true);
  });

  it('fades the incoming figure up rather than popping it in', async () => {
    const { stage, play } = setup();

    await play([{ type: 'switch', outId: 'tidus', inId: 'auron' }]);

    expect(stage.calls).toContain('fade=1:auron');
  });
});
