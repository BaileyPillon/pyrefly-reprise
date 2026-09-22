import { describe, expect, it } from 'vitest';
import { PortraitStateMachine } from '../../docs/concepts/pause-until-dawn/prototype-v2/src/state.ts';

describe('PortraitStateMachine reduced motion', () => {
  it('drops idle sway and the continuous mouth/brow drift with a held, centred gaze', () => {
    const state = new PortraitStateMachine({ headSway: 1, blink: 1, expression: 1 });
    state.setReducedMotion(true);
    state.setGazeTarget(0, 0);
    let sawMotion = false;
    let sawExpression = false;
    for (let i = 0; i < 600; i++) {
      const frame = state.update(1 / 60);
      if (Math.abs(frame.yawDeg) > 1e-6 || Math.abs(frame.pitchDeg) > 1e-6) sawMotion = true;
      if (frame.mouth !== 'neutral' || frame.brow !== 'neutral') sawExpression = true;
    }
    expect(sawMotion).toBe(false);
    expect(sawExpression).toBe(false);
  });

  it('the same seed WITHOUT reduced motion does show idle sway (a real behavioural difference)', () => {
    const state = new PortraitStateMachine({ headSway: 1, blink: 1, expression: 1 });
    state.setGazeTarget(0, 0);
    let sawMotion = false;
    for (let i = 0; i < 600; i++) {
      const frame = state.update(1 / 60);
      if (Math.abs(frame.yawDeg) > 0.01) sawMotion = true;
    }
    expect(sawMotion).toBe(true);
  });

  it('reduced motion still blinks at the measured timings (blinks are information, not decoration)', () => {
    const state = new PortraitStateMachine({ headSway: 1, blink: 1, expression: 1 });
    state.setReducedMotion(true);
    let sawClosed = false;
    for (let i = 0; i < 600; i++) {
      const frame = state.update(1 / 30);
      if (frame.eyeState === 'closed') sawClosed = true;
    }
    expect(sawClosed).toBe(true);
  });

  it('still follows a held input target under reduced motion, just without snapping (raised tau)', () => {
    const state = new PortraitStateMachine({ headSway: 1, blink: 1, expression: 1 });
    state.setReducedMotion(true);
    state.setGazeTarget(1, 0);
    let last = 0;
    for (let i = 0; i < 120; i++) {
      const frame = state.update(1 / 60);
      last = frame.yawDeg;
    }
    expect(last).toBeGreaterThan(0); // it did move toward the target...
    expect(last).toBeLessThan(35); // ...but hasn't snapped there instantly.
  });
});

describe('PortraitStateMachine expression states', () => {
  it('hurt tightens the gaze excursion versus normal, for the same input target', () => {
    const normal = new PortraitStateMachine({ headSway: 2, blink: 2, expression: 2 });
    const hurt = new PortraitStateMachine({ headSway: 2, blink: 2, expression: 2 });
    hurt.setExpression('hurt');
    normal.setGazeTarget(1, 0);
    hurt.setGazeTarget(1, 0);
    let normalYaw = 0;
    let hurtYaw = 0;
    for (let i = 0; i < 300; i++) {
      normalYaw = normal.update(1 / 60).yawDeg;
      hurtYaw = hurt.update(1 / 60).yawDeg;
    }
    expect(hurtYaw).toBeLessThan(normalYaw);
  });

  it('blink() forces a blink promptly rather than waiting for the scheduled interval', () => {
    const state = new PortraitStateMachine({ blink: 999 });
    state.forceBlink();
    let sawClosed = false;
    for (let i = 0; i < 20; i++) {
      const frame = state.update(1 / 60);
      if (frame.eyeState === 'closed' || frame.eyeState === 'closing') sawClosed = true;
    }
    expect(sawClosed).toBe(true);
  });
});
