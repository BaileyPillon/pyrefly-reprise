// @vitest-environment jsdom
/**
 * Chapter VII fix pass (the end-to-end run on commit 06338dbc), the two FFX
 * HUD items:
 *
 * - **(1) A departed combatant's Sensor chip goes with it.** "I GUADO GUARDIAN
 *   B" stayed on the field after both Guardians had shattered, all through
 *   Anima's act. Read off the synced state, so every way of leaving clears it:
 *   a KO, a shatter / Eject, a removal, a hidden reveal-slot.
 * - **(4) A scripted enemy beat names the enemy.** The battle rule that
 *   summons Anima fires inside Rikku's action, and the banner read "Rikku ·
 *   Seymour summons Anima".
 *
 * Game case: **FFX only** [AGENTS.md rule 14]: the Sensor plate and the
 * `.ig-banner` speaker slab are the FFX HUD's (FFX-2's boss strip already
 * drops a removed or hidden enemy, `BossGauges.ts`, and prints no speaker).
 * Shared by every FFX chapter.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { BattleState, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { SensorPanel } from '../../src/ui/ffx/SensorPanel.ts';
import { bannerSpeaker } from '../../src/ui/ffx/bannerSpeaker.ts';
import { applyEventToVitals, captureVitals, projectState } from '../../src/engine/BattlePresenterVitals.ts';
import { makeFakeBattleState, makeFakeCombatants, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

const hosts: HTMLElement[] = [];
function mountHud(): { hud: FFXBattleHud; host: HTMLElement } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);
  const hud = new FFXBattleHud();
  hud.mount(host);
  return { hud, host };
}
afterEach(() => {
  for (const h of hosts.splice(0)) h.remove();
});

/** The fixture battle with the Mortiorchis replaced by `patch`. */
function withMortiorchis(state: BattleState, patch: Partial<FFXCombatant>): BattleState {
  const m = state.combatants['mortiorchis'] as FFXCombatant;
  return { ...state, combatants: { ...state.combatants, mortiorchis: { ...m, ...patch } } };
}

describe('(1) a departed combatant takes its Sensor plate and chip with it', () => {
  const leaving: Array<[string, Partial<FFXCombatant>]> = [
    ['KO', { alive: false, hp: 0 }],
    ['shattered / ejected', { alive: false, hp: 0, statuses: {} }],
    ['removed', { removed: true }],
    ['hidden (a reveal slot)', { flags: { hidden: true } }],
  ];
  for (const [how, patch] of leaving) {
    it(`clears the folded chip when its subject is ${how}`, () => {
      const { hud } = mountHud();
      const state = makeFakeBattleState();
      hud.sync(state, makeFakeTurnPreview());
      hud.onEvent({ seq: 1, type: 'sensor', targetId: 'mortiorchis', text: '' } as never);
      hud.enemyPlate.toggle(); // folded to the one-line "I MORTIORCHIS" chip
      expect(hud.enemyPlate.isFolded).toBe(true);
      expect(hud.enemyPlate.el.hidden).toBe(false);

      hud.sync(withMortiorchis(state, patch), makeFakeTurnPreview());
      expect(hud.enemyPlate.el.hidden).toBe(true);
      // Sensor's read of it is still known; only the plate left.
      expect(hud.enemyPlate.isScanned('mortiorchis')).toBe(true);
    });
  }

  it('keeps the plate while its subject is still on the field, whoever else leaves', () => {
    const { hud } = mountHud();
    const state = makeFakeBattleState();
    hud.sync(state, makeFakeTurnPreview());
    hud.onEvent({ seq: 1, type: 'sensor', targetId: 'mortiorchis', text: '' } as never);
    const seymourGone: BattleState = {
      ...state,
      combatants: { ...state.combatants, 'seymour-flux': { ...state.combatants['seymour-flux']!, removed: true } },
    };
    hud.sync(seymourGone, makeFakeTurnPreview());
    expect(hud.enemyPlate.el.hidden).toBe(false);
    expect(hud.enemyPlate.el.textContent).toContain('Mortiorchis');
  });

  // Repair pass (the verifier's Chapter VIII run): the last enemy's fall plays
  // with no full `sync` before the result, so "I EVRAE" stayed up over empty
  // sky for 3.5 s. The per-event projection (`syncVitals`) now releases it at
  // the blow, for a KO and for a shatter / Eject alike.
  const atTheBlow: Array<[string, object]> = [
    ['a KO (the last enemy falling, no sync after it)', { type: 'ko', targetId: 'mortiorchis' }],
    [
      'a shatter (status-add eject, before `removed` is synced)',
      { type: 'status-add', targetId: 'mortiorchis', status: 'eject', instance: { id: 'eject', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } },
    ],
  ];
  for (const [how, event] of atTheBlow) {
    it(`clears the plate at the blow, from the projected vitals alone: ${how}`, () => {
      const { hud } = mountHud();
      const state = makeFakeBattleState();
      hud.sync(state, makeFakeTurnPreview());
      hud.onEvent({ seq: 1, type: 'sensor', targetId: 'mortiorchis', text: '' } as never);
      hud.enemyPlate.toggle();
      expect(hud.enemyPlate.el.hidden).toBe(false);

      const vitals = captureVitals(state);
      expect(applyEventToVitals(vitals, { seq: 2, ...event } as never)).toBe(true);
      hud.syncVitals(projectState(state, vitals)); // no `sync`: the presenter is mid-burst
      expect(hud.enemyPlate.el.hidden).toBe(true);
      expect(hud.enemyPlate.isScanned('mortiorchis')).toBe(true);
    });
  }

  it('a hit that does not fell the subject keeps the plate at the blow', () => {
    const { hud } = mountHud();
    const state = makeFakeBattleState();
    hud.sync(state, makeFakeTurnPreview());
    hud.onEvent({ seq: 1, type: 'sensor', targetId: 'mortiorchis', text: '' } as never);
    const vitals = captureVitals(state);
    applyEventToVitals(vitals, { seq: 2, type: 'damage', targetId: 'mortiorchis', amount: 1, crit: false, hitIndex: 0, hitCount: 1 } as never);
    hud.syncVitals(projectState(state, vitals));
    expect(hud.enemyPlate.el.hidden).toBe(false);
  });

  it('SensorPanel.release on its own: nothing to release is a no-op', () => {
    const panel = new SensorPanel();
    panel.release({});
    expect(panel.el.hidden).toBe(true);
    const m = makeFakeCombatants()['mortiorchis']!;
    panel.show(m);
    panel.release({ mortiorchis: m });
    expect(panel.el.hidden).toBe(false);
    panel.release({});
    expect(panel.el.hidden).toBe(true);
  });
});

describe('(4) a scripted enemy beat names the enemy, not whoever acted last', () => {
  const combatants = {
    rikku: { id: 'rikku', name: 'Rikku', side: 'party' },
    'seymour-macalania': { id: 'seymour-macalania', name: 'Seymour', side: 'enemy' },
    'guado-guardian-b': { id: 'guado-guardian-b', name: 'Guado Guardian B', side: 'enemy' },
    'seymour-flux': { id: 'seymour-flux', name: 'Seymour Flux', side: 'enemy' },
  } as never;

  it('"Seymour summons Anima" during Rikku\'s action is Seymour\'s line', () => {
    expect(bannerSpeaker('Seymour summons Anima', 'telegraph', 'rikku', combatants)).toEqual({
      name: 'Seymour',
      chip: 'summons Anima',
    });
    expect(bannerSpeaker('Seymour dismisses Anima', 'telegraph', 'rikku', combatants).name).toBe('Seymour');
  });

  it('a shatter names the Guardian; the longest name wins', () => {
    expect(bannerSpeaker('Guado Guardian B shatters', 'status', 'rikku', combatants)).toEqual({
      name: 'Guado Guardian B',
      chip: 'shatters',
    });
    expect(bannerSpeaker('Seymour Flux uses Flare', 'ability', 'rikku', combatants).name).toBe('Seymour Flux');
  });

  it('the acting party member keeps her own lines', () => {
    expect(bannerSpeaker('Stole Hi-Potion!', 'system', 'rikku', combatants)).toEqual({ name: 'Rikku', chip: 'Stole Hi-Potion!' });
    expect(bannerSpeaker('Rikku hesitates', 'system', 'rikku', combatants)).toEqual({ name: 'Rikku', chip: 'hesitates' });
  });

  it('an enemy-side telegraph that names nobody is not credited to the party member', () => {
    expect(bannerSpeaker('Possessed by Yu Yevon!', 'telegraph', 'rikku', combatants)).toEqual({
      name: '',
      chip: 'Possessed by Yu Yevon!',
    });
    // An enemy's own telegraph still carries its name.
    expect(bannerSpeaker('Possessed by Yu Yevon!', 'telegraph', 'seymour-macalania', combatants).name).toBe('Seymour');
  });

  it('the real HUD banner: Tidus acting, the enemy beat names the enemy', () => {
    const { hud, host } = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.onEvent({ seq: 1, type: 'turn-start', actorId: 'tidus' } as never);
    hud.onEvent({ seq: 2, type: 'message', text: 'Seymour summons Anima', kind: 'telegraph' } as never);
    const name = host.querySelector<HTMLElement>('.ig-banner [data-role="name"]')!;
    const chip = host.querySelector<HTMLElement>('.ig-banner [data-role="chip"]')!;
    expect(name.textContent).toBe('Seymour');
    expect(chip.textContent).toBe('summons Anima');
    hud.onEvent({ seq: 3, type: 'message', text: 'Tidus attacks', kind: 'ability' } as never);
    expect(name.textContent).toBe('Tidus');
  });
});
