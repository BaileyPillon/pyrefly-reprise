// @vitest-environment jsdom
/**
 * PR-0186 (FFX only, Chapter III; Bailey's pick D-249, plan section 8 Q7 option a): the Sensor card
 * folds while the player aims in the Yu Pagoda fight, so it no longer covers Pagoda B's base or the
 * Final Aeon's lower body. Every other chapter, and the phone, keep the open card.
 */
import { describe, expect, it } from 'vitest';
import { SensorPanel } from '../../src/ui/ffx/SensorPanel.ts';
import { foldWhileAiming, isYuPagodaFight } from '../../src/ui/ffx/sensorAimFold.ts';
import { makeFakeCombatants } from '../../src/ui/ffx/testFixtures.ts';

const boss = makeFakeCombatants()['seymour-flux']!;

describe('the Sensor card while aiming (PR-0186)', () => {
  it('only the Yu Pagoda fight folds, and never on the phone', () => {
    const ch3 = ['braskas-final-aeon', 'yu-pagoda-left', 'yu-pagoda-right'];
    expect(isYuPagodaFight(ch3)).toBe(true);
    expect(foldWhileAiming(ch3, false)).toBe(true);
    expect(foldWhileAiming(ch3, true)).toBe(false);
    expect(foldWhileAiming(['seymour-flux', 'mortiorchis'], false)).toBe(false);
  });

  it('focus(target, true) opens the card on its folded chip; a plain focus opens it', () => {
    const folded = new SensorPanel();
    folded.focus(boss, true);
    expect(folded.el.hidden).toBe(false);
    expect(folded.isFolded).toBe(true);
    const open = new SensorPanel();
    open.focus(boss);
    expect(open.isFolded).toBe(false);
  });

  it('the chip still reopens it by hand', () => {
    const p = new SensorPanel();
    p.focus(boss, true);
    p.toggle();
    expect(p.isFolded).toBe(false);
  });
});
