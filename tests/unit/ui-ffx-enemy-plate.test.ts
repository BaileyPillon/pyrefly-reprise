// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleState, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { SensorPanel, SENSOR_OPEN_MS } from '../../src/ui/ffx/SensorPanel.ts';
import { commandEffectText, commandHelpText } from '../../src/ui/ffx/commandHelp.ts';
import { stripCitations } from '../../src/ui/common/EnemyIntent.ts';
import {
  makeFakeBattleState,
  makeFakeCombatants,
  makeFakeCommands,
  makeFakeTurnPreview,
} from '../../src/ui/ffx/testFixtures.ts';

/**
 * The fix-3 addendum's screen, in five parts.
 *
 * All five came out of critic round 02 on the live build, and all five are
 * about the same forty minutes: the screen the player looks at while a fight
 * is happening.
 *
 * 1. **The enemy plate had no lifetime.** `SensorPanel.hide()` had no caller
 *    anywhere in the repo, so one Sensor in Chapter 1 left a 100x78 grid-px
 *    card in the middle of the field for the rest of the fight — which is what
 *    starved the advisor's shelf down to 24 px and made the screen read as
 *    crowded.
 * 2. **Enemy health was presented three ways** (#28) and the boss's HP was
 *    invisible in two chapters of three.
 * 3. **The intent slab printed research citations** inside player sentences
 *    (#26), which carried the Part B 8.0 cap.
 * 4. **The command slab said nothing** about the row the player was about to
 *    commit to (#27).
 * 5. **The Overdrive gauge had no label and no ready state** (#37).
 */

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

function enemy(id: 'seymour-flux' | 'mortiorchis') {
  return makeFakeCombatants()[id]!;
}

// ---------------------------------------------------------------- lifetime

describe('the enemy plate has a lifetime', () => {
  it('opens on a Sensor reveal and folds itself to a chip after SENSOR_OPEN_MS', () => {
    const panel = new SensorPanel();
    panel.show(enemy('mortiorchis'));
    expect(panel.el.hidden).toBe(false);
    expect(panel.isFolded).toBe(false);

    // Nothing happens until the clock actually runs out — the plate is there to
    // be read, and half of `SENSOR_OPEN_MS` is not enough to read it.
    panel.update(SENSOR_OPEN_MS / 2000);
    expect(panel.isFolded).toBe(false);

    panel.update(SENSOR_OPEN_MS / 2000 + 0.01);
    expect(panel.isFolded).toBe(true);
    expect(panel.el.hidden).toBe(false);
    expect(panel.el.classList.contains('ffx-sensor--folded')).toBe(true);
  });

  it('a folded chip still names its subject, so reopening is an informed choice', () => {
    const panel = new SensorPanel();
    panel.show(enemy('mortiorchis'));
    panel.update(99);
    expect(panel.el.textContent).toContain('Mortiorchis');
  });

  it('reopening by hand pins it — the clock does not take it away under the player', () => {
    const panel = new SensorPanel();
    panel.show(enemy('mortiorchis'));
    panel.update(99);
    expect(panel.isFolded).toBe(true);

    panel.toggle();
    expect(panel.isFolded).toBe(false);
    panel.update(99);
    expect(panel.isFolded).toBe(false);
  });

  it('a fresh HP figure for the subject already up does not restart the clock', () => {
    const panel = new SensorPanel();
    const boss = enemy('mortiorchis');
    panel.show(boss);
    panel.update(SENSOR_OPEN_MS / 2000);
    // The mount takes a hit: same subject, new numbers.
    panel.focus({ ...boss, hp: boss.hp - 900 });
    panel.update(SENSOR_OPEN_MS / 2000 + 0.01);
    expect(panel.isFolded).toBe(true);
  });

  it('`hide()` finally has a caller: a decided battle takes the plate off the field', () => {
    const { hud } = mountHud();
    const state = makeFakeBattleState();
    hud.sync(state, makeFakeTurnPreview());
    hud.onEvent({ seq: 1, type: 'sensor', targetId: 'mortiorchis', text: '' } as never);
    expect(hud.enemyPlate.el.hidden).toBe(false);

    const decided: BattleState = { ...state, result: { outcome: 'victory', turns: 12 } as never };
    hud.sync(decided, makeFakeTurnPreview());
    expect(hud.enemyPlate.el.hidden).toBe(true);
  });

  // Chapter VIII end-to-end evidence F5 (commit 7119762f): Cid's Sensor
  // auto-reveal (`revealForSensorAuto` walks every id in `state.enemyIds`
  // with no `untargetable` filter) fired a `'sensor'` event for him right
  // after Evrae's own, and the plate opened on it — a blank "Cid" card at
  // the panel's fixed grid spot, unanchored to any figure because nothing
  // ever aimed at him. `flags.untargetable` is the same marker
  // `predicates.ts#targetable` reads to keep him off the aim cursor in the
  // first place. FFX only [AGENTS.md rule 14]: Cid, the Fahrenheit and
  // `SensorPanel` are all FFX's.
  it('an untargetable combatant (Cid on the Fahrenheit) never opens the enemy plate', () => {
    const { hud } = mountHud();
    const state = makeFakeBattleState();
    const cid: FFXCombatant = {
      ...enemy('mortiorchis'),
      id: 'cid',
      name: 'Cid',
      flags: { untargetable: true, hideHpBar: true },
      immunityFlags: ['immune-to-sensor'],
    };
    const withCid: BattleState = {
      ...state,
      enemyIds: [...state.enemyIds, 'cid'],
      combatants: { ...state.combatants, cid },
    };
    hud.sync(withCid, makeFakeTurnPreview());
    hud.onEvent({ seq: 1, type: 'sensor', targetId: 'mortiorchis', full: false, text: '' } as never);
    expect(hud.enemyPlate.el.hidden).toBe(false);
    expect(hud.enemyPlate.el.textContent).toContain('Mortiorchis');

    // Cid's own reveal must not steal the plate off the real target.
    hud.onEvent({ seq: 2, type: 'sensor', targetId: 'cid', full: false, text: '' } as never);
    expect(hud.enemyPlate.el.textContent).toContain('Mortiorchis');
    expect(hud.enemyPlate.el.textContent).not.toContain('Cid');
  });
});

// ------------------------------------------------------ one health read-out

describe('one enemy-health presentation, and Sensor is what unlocks it', () => {
  it('an unscanned enemy shows its name and no HP figure — FFX gives it no bar', () => {
    const panel = new SensorPanel();
    panel.focus(enemy('seymour-flux'));
    const text = panel.el.textContent ?? '';
    expect(text).toContain('Seymour');
    expect(text).toContain('? ? ?');
    expect(text).not.toContain('32000');
    expect(panel.el.querySelectorAll('.ffx-sensor__chip')).toHaveLength(0);
    expect(panel.el.querySelector('.ffx-sensor__unknown')).not.toBeNull();
    // The bar is drawn, at zero: the frame is the same in both states, so the
    // plate does not change shape when Sensor lands.
    expect(parseFloat(panel.el.querySelector<HTMLElement>('.ffx-sensor__bar i')!.style.width)).toBe(0);
  });

  it('once Sensor has read it the numbers stay, even when the plate is re-focused later', () => {
    const panel = new SensorPanel();
    const boss = enemy('mortiorchis');
    panel.show(boss);
    expect(panel.el.textContent).toContain('48000');
    expect(panel.isScanned('mortiorchis')).toBe(true);

    // Aim somewhere else, then come back: what Sensor told you is not forgotten.
    panel.focus(enemy('seymour-flux'));
    expect(panel.el.textContent).toContain('? ? ?');
    panel.focus(boss);
    expect(panel.el.textContent).toContain('48000');
  });

  it('a new battle starts blind', () => {
    const panel = new SensorPanel();
    panel.show(enemy('mortiorchis'));
    panel.reset();
    expect(panel.isScanned('mortiorchis')).toBe(false);
    expect(panel.el.hidden).toBe(true);
  });

  it('the plate follows the aim, and never follows it onto a party member', () => {
    const { hud } = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    const commands = makeFakeCommands();
    void hud.chooseCommand('tidus', commands, () => makeFakeTurnPreview());

    // Attack -> the picker opens on the first enemy candidate.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    expect(hud.enemyPlate.el.hidden).toBe(false);
    expect(hud.enemyPlate.el.textContent).toContain('Seymour');

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    expect(hud.enemyPlate.el.textContent).toContain('Mortiorchis');
  });
});

// ------------------------------------------------------------- the citations

describe('no research citation reaches the player', () => {
  it('takes a citation out of the middle of a sentence and leaves the sentence whole', () => {
    expect(stripCitations('Counters an attack with Lance of Atrophy [ffx-seymour-flux §4.6]')).toBe(
      'Counters an attack with Lance of Atrophy',
    );
    expect(stripCitations('Hits the party [ffx2-bahamut §2.1] for heavy damage')).toBe(
      'Hits the party for heavy damage',
    );
  });

  it('leaves prose that merely contains a bracket alone', () => {
    expect(stripCitations('Zombie (see the guide) then Full-Life')).toBe('Zombie (see the guide) then Full-Life');
  });
});

// ------------------------------------------------------- what a command does

describe('the command slab says what the highlighted row does', () => {
  const rowFor = (label: string): AvailableCommand => makeFakeCommands().find((c) => c.label === label)!;

  it('answers for a leaf ability the engine wrote no help for', () => {
    // Firaga is the fixture's one row with neither `help` nor an enabled state,
    // which is exactly the shape round 02 #27 found printing an MP chip and
    // nothing else.
    const text = commandEffectText(rowFor('Firaga'));
    expect(text.length).toBeGreaterThan(0);
    expect(text.toLowerCase()).toContain('damage');
  });

  it('answers for Attack and for Defend, which resolve to no ability id at all', () => {
    expect(commandEffectText(rowFor('Attack')).length).toBeGreaterThan(0);
    expect(commandEffectText(rowFor('Defend')).toLowerCase()).toContain('halves');
  });

  it('a disabled row says why *and* what it would have done', () => {
    const text = commandHelpText(rowFor('Firaga'));
    expect(text.startsWith('Silenced')).toBe(true);
    expect(text.length).toBeGreaterThan('Silenced'.length + 3);
  });

  it('the slab is filled on the row the menu opens on, before any key is pressed', () => {
    const { hud, host } = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    void hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    const info = host.querySelector<HTMLElement>('.ffx-cmd-info')!;
    expect(info.hidden).toBe(false);
    expect((info.textContent ?? '').trim().length).toBeGreaterThan(0);
  });

  it('aiming keeps the command on the slab instead of replacing it with a name', () => {
    const { hud, host } = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    void hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    const text = host.querySelector<HTMLElement>('.ffx-cmd-info')!.textContent ?? '';
    // The target's own name and scan line live on the enemy plate now.
    expect(text).not.toContain('Seymour');
    expect(text.trim().length).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------------ the gauge

describe('the Overdrive gauge', () => {
  function rowsOf(hud: FFXBattleHud, host: HTMLElement): HTMLElement[] {
    void hud;
    return [...host.querySelectorAll<HTMLElement>('.ig-stat')];
  }

  it('carries a label, and says READY rather than simply being full', () => {
    const { hud, host } = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    const rows = rowsOf(hud, host);
    // Tidus ships at gauge 100 in the fixture, Yuna at 62.
    const tidus = rows.find((r) => r.dataset['actor'] === 'tidus')!;
    const yuna = rows.find((r) => r.dataset['actor'] === 'yuna')!;
    expect(tidus.querySelector('.ffx-stat__od--ready')).not.toBeNull();
    expect(tidus.querySelector('.ffx-stat__od em')!.textContent).toBe('Overdrive');
    expect(yuna.querySelector('.ffx-stat__od--ready')).toBeNull();
    expect(yuna.querySelector('.ffx-stat__od em')!.textContent).toBe('OD');
  });

  it('flashes exactly once, on the render that crosses 100', () => {
    const { hud, host } = mountHud();
    const withAuronGauge = (gauge: number): BattleState => {
      const state = makeFakeBattleState();
      const auron = state.combatants['auron'] as FFXCombatant;
      state.combatants['auron'] = { ...auron, overdrive: { ...auron.overdrive!, gauge } };
      return state;
    };

    hud.sync(withAuronGauge(96), makeFakeTurnPreview());
    expect(host.querySelector('[data-actor="auron"] .ffx-stat__od--filled')).toBeNull();

    const full = withAuronGauge(100);
    hud.sync(full, makeFakeTurnPreview());
    expect(host.querySelector('[data-actor="auron"] .ffx-stat__od--filled')).not.toBeNull();

    // The next sync draws the steady READY state: a fill is an event, not a
    // permanent animation.
    hud.sync(full, makeFakeTurnPreview());
    expect(host.querySelector('[data-actor="auron"] .ffx-stat__od--filled')).toBeNull();
    expect(host.querySelector('[data-actor="auron"] .ffx-stat__od--ready')).not.toBeNull();
  });
});
