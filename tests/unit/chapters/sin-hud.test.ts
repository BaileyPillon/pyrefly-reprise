// @vitest-environment jsdom
/**
 * **The Sin HUD** (FFX only; Chapters XVII and XVIII): the link 4 clock (M1-A,
 * the mouth ring) and the Fins' range and charge plate (M4-B), package M's
 * recommended frames (the driver's picks under D-279).
 *
 * The clock's states come from the real engine on the real Overdrive Sin data
 * (hard rule 3). The Fin plate reads flags that package F publishes; F is not
 * merged on this branch, so its tests set `airship.range` and `sin.fin.charged`
 * on a real Left Fin battle by hand and say so. The last blocks are the absence
 * tests: no Sin flags, no Sin HUD.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AtbSnapshot, BattleEngine, BattleState, FFXPartyBuild, TurnPreview } from '../../../src/battle/common/types.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { GIGA_GRAVITON_TURN, GAZE_THRESHOLD } from '../../../src/battle/ffx/ai/overdrive-sin-rules.ts';
import { sinFinsCoreBuild } from '../../../src/data/ffx/builds/sin-fahrenheit.ts';
import { fahrenheitBuild } from '../../../src/data/ffx/builds/fahrenheit.ts';
import { sinLeftFinGroup } from '../../../src/data/ffx/enemies/sin-fins.ts';
import { evraeGroup } from '../../../src/data/ffx/enemies/evrae.ts';
import type { EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FIN_CHARGED_TEXT, FIN_FAR_TEXT, ordinal, sinClockView, sinFinPlateView } from '../../../src/ui/ffx/sinHudModel.ts';
import { SinHud, clockHtml, withSinHud } from '../../../src/ui/ffx/SinHud.ts';
import {
  ADVISOR_PANEL_SELECTORS,
  CHAPTER_PANEL_SELECTORS,
  INTENT_AVOID_SELECTORS,
  OMNIS_READOUT_SELECTORS,
  SIN_HUD_SELECTORS,
} from '../../../src/ui/ffx/hudAvoidSelectors.ts';
import { makeFakeBattleState } from '../../../src/ui/ffx/testFixtures.ts';
import type { HudPort } from '../../../src/engine/HudPort.ts';
import { content, defend, newEngine } from '../helpers/sinUnits.ts';

function engineOn(group: EnemyGroupDef, party: FFXPartyBuild, seed = 1): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

const stateOf = (e: BattleEngine): BattleState => e.state() as BattleState;
const flagsOf = (e: BattleEngine): Record<string, unknown> => e.state().flags as Record<string, unknown>;

/** Step the engine until Sin's clock moves (or the battle ends), answering every party turn with Defend. */
function untilSinTurn(e: BattleEngine, max = 400): boolean {
  const before = flagsOf(e)['sin.turn'];
  for (let i = 0; i < max; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') return false;
    if (d.kind === 'player-input') e.submit(defend());
    if (flagsOf(e)['sin.turn'] !== before) return true;
  }
  return false;
}

function mountHud(): { hud: SinHud; stage: HTMLElement; host: HTMLElement } {
  const host = document.createElement('div');
  host.className = 'ffxhud ig';
  const stage = document.createElement('div');
  stage.className = 'ffxhud__stage';
  host.append(stage);
  document.body.append(host);
  const hud = new SinHud();
  hud.mount(stage, host);
  return { hud, stage, host };
}

afterEach(() => {
  document.body.innerHTML = '';
  delete document.documentElement.dataset['phoneBattle'];
});

// ------------------------------------------------------------------ the clock

describe('the link 4 clock reads the engine flags (M1-A)', () => {
  it('opens at 13 turns left, mouth shut, 3 + 9 + 1 segments, nothing lit, the S-1 line on', () => {
    const v = sinClockView(stateOf(newEngine(1)))!;
    expect(v).not.toBeNull();
    expect(v.total).toBe(GIGA_GRAVITON_TURN);
    expect(v.turn).toBe(0);
    expect(v.left).toBe(13);
    expect(v.stage).toBe(0);
    expect(v.stageWord).toBe('Mouth shut');
    expect(v.segments.map((s) => s.kind)).toEqual([...Array(3).fill('pull'), ...Array(9).fill('window'), 'last']);
    expect(v.segments.some((s) => s.lit)).toBe(false);
    expect(v.alarm).toBe(false);
    expect(v.estimate?.desk).toBe("Giga-Graviton on Sin's 13th turn: our estimate (the sources say 12 or 13)");
    expect(v.estimate?.phone).toBe('13th turn: our estimate (12 or 13)');
    expect(v.gaze).toEqual({ count: 0, threshold: GAZE_THRESHOLD, left: GAZE_THRESHOLD });
  });

  it("counts down with Sin's own turns, one segment per turn, the current one outlined", () => {
    const e = newEngine(3);
    const seen: number[] = [];
    for (let k = 1; k <= 6; k++) {
      expect(untilSinTurn(e), `Sin's turn ${k}`).toBe(true);
      const v = sinClockView(stateOf(e))!;
      expect(v.turn).toBe(k);
      expect(v.left).toBe(flagsOf(e)['sin.turnsLeft']);
      expect(v.stage).toBe(flagsOf(e)['sin.mouthStage']);
      expect(v.segments.filter((s) => s.lit).length).toBe(k);
      expect(v.segments.filter((s) => s.now).map((s) => s.index)).toEqual([k]);
      seen.push(v.left);
    }
    expect(seen).toEqual([12, 11, 10, 9, 8, 7]);
  });

  it('pulses the last segment and turns the numeral red from one turn left', () => {
    const e = newEngine(5);
    while (sinClockView(stateOf(e))!.left > 1) expect(untilSinTurn(e)).toBe(true);
    const v = sinClockView(stateOf(e))!;
    expect(v.left).toBe(1);
    expect(v.alarm).toBe(true);
    expect(v.stageWord).toBe('Mouth fully open');
    const html = clockHtml(v, false);
    expect(html).toContain('ffx-sinclock__num--alarm');
    expect(html).toMatch(/ffx-sinclock__seg--last[^"]*is-alarm/);
  });

  it("follows S-1's other reading: a 12-turn clock is 3 + 8 + 1 and its line says 12th", () => {
    const v = sinClockView(stateOf(newEngine(1, 12)))!;
    expect(v.total).toBe(12);
    expect(v.segments.map((s) => s.kind).filter((k) => k === 'window')).toHaveLength(8);
    expect(v.estimate?.desk).toContain("Sin's 12th turn");
  });

  it('reads the Gaze count toward six', () => {
    const e = newEngine(1);
    flagsOf(e)['sin.gazeCounter'] = 4;
    expect(sinClockView(stateOf(e))!.gaze).toEqual({ count: 4, threshold: 6, left: 2 });
  });

  it('ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st']);
  });
});

// ------------------------------------------------------------------ the Fin plate

describe("the Fins' plate reads the range and the charge (M4-B)", () => {
  it('stays null in a Fin battle until the range flag exists (package F publishes it)', () => {
    const e = engineOn(sinLeftFinGroup, sinFinsCoreBuild);
    if (flagsOf(e)['airship.range'] === undefined) expect(sinFinPlateView(stateOf(e))).toBeNull();
    else expect(sinFinPlateView(stateOf(e))).not.toBeNull();
  });

  it('NEAR and charged: the red bar; FAR: the quiet line; NEAR uncharged: neither (flags set by hand)', () => {
    const e = engineOn(sinLeftFinGroup, sinFinsCoreBuild);
    const f = flagsOf(e);
    f['airship.range'] = 'near';
    f['sin.fin.charged'] = true;
    let v = sinFinPlateView(stateOf(e))!;
    expect(v).toMatchObject({ finId: 'left-fin', name: 'Left Fin', range: 'near', charged: true, line: 'charged' });
    f['sin.fin.charged'] = false;
    expect(sinFinPlateView(stateOf(e))!.line).toBeNull();
    f['airship.range'] = 'far';
    v = sinFinPlateView(stateOf(e))!;
    expect(v).toMatchObject({ range: 'far', line: 'far' });
  });

  it('paints the words of the frame', () => {
    const e = engineOn(sinLeftFinGroup, sinFinsCoreBuild);
    Object.assign(flagsOf(e), { 'airship.range': 'near', 'sin.fin.charged': true });
    const { hud } = mountHud();
    hud.sync(stateOf(e));
    expect(hud.finEl.hidden).toBe(false);
    expect(hud.finEl.textContent).toContain('Left Fin');
    expect(hud.finEl.textContent).toContain('NEAR');
    expect(hud.finEl.textContent).toContain(FIN_CHARGED_TEXT);
    expect(hud.clockEl.hidden).toBe(true);
    Object.assign(flagsOf(e), { 'airship.range': 'far', 'sin.fin.charged': false });
    hud.sync(stateOf(e));
    expect(hud.finEl.textContent).toContain(FIN_FAR_TEXT);
  });
});

// ------------------------------------------------------------------ mount and unmount

describe('mount, layout and unmount', () => {
  it("shows on Sin's battle in the stage, moves to the HUD root on the phone, and leaves on dispose", () => {
    const { hud, stage, host } = mountHud();
    const e = newEngine(1);
    hud.sync(stateOf(e));
    expect(hud.el.hidden).toBe(false);
    expect(hud.el.parentElement).toBe(stage);
    expect(host.hasAttribute('data-sin-hud')).toBe(true);
    expect(hud.clockEl.querySelectorAll('.ffx-sinclock__seg')).toHaveLength(13);
    expect(hud.clockEl.textContent).toContain('TURNS LEFT');
    expect(hud.gazeEl.textContent).toContain('Gaze in 6');
    expect(hud.finEl.hidden).toBe(true); // Overdrive Sin has a range, but no Fin

    document.documentElement.dataset['phoneBattle'] = 'ffx';
    hud.sync(stateOf(e));
    expect(hud.layoutMode).toBe('phone');
    expect(hud.el.parentElement).toBe(host);
    expect(hud.el.classList.contains('ffx-sinhud--phone')).toBe(true);
    expect(hud.clockEl.textContent).toContain('GIGA-GRAVITON IN 13');
    expect(hud.clockEl.textContent).toContain('Shut');

    hud.dispose();
    expect(hud.el.isConnected).toBe(false);
    expect(host.hasAttribute('data-sin-hud')).toBe(false);
  });

  it('hides again when the battle ends', () => {
    const { hud } = mountHud();
    const e = newEngine(1);
    hud.sync(stateOf(e));
    expect(hud.el.hidden).toBe(false);
    hud.sync({ ...stateOf(e), result: { outcome: 'victory' } } as unknown as BattleState);
    expect(hud.el.hidden).toBe(true);
  });

  it('withSinHud taps mount, sync and unmount and returns the same HUD', () => {
    const el = document.createElement('div');
    const stage = document.createElement('div');
    stage.className = 'ffxhud__stage';
    el.append(stage);
    const calls: string[] = [];
    const base = {
      el,
      mount: (root: HTMLElement) => { root.append(el); calls.push('mount'); },
      unmount: () => { el.remove(); calls.push('unmount'); },
      sync: (_s: BattleState, _p: TurnPreview[] | AtbSnapshot) => { calls.push('sync'); },
      onEvent: () => undefined,
    } as unknown as HudPort & { el: HTMLElement };
    const hud = withSinHud(base);
    expect(hud).toBe(base);
    hud.mount(document.body);
    hud.sync(stateOf(newEngine(1)), []);
    const sin = (hud as unknown as { sinHud: SinHud }).sinHud;
    expect(sin.el.parentElement).toBe(stage);
    expect(sin.el.hidden).toBe(false);
    hud.unmount();
    expect(sin.el.isConnected).toBe(false);
    expect(calls).toEqual(['mount', 'sync', 'unmount']);
  });

  it('every solid piece is on the lists the floating panels dodge; the inset wrapper is not', () => {
    for (const s of ['.ffx-sinclock', '.ffx-sinhud__gaze', '.ffx-sinfin']) {
      expect(SIN_HUD_SELECTORS as readonly string[]).toContain(s);
      expect(CHAPTER_PANEL_SELECTORS as readonly string[]).toContain(s);
      expect(INTENT_AVOID_SELECTORS as readonly string[]).toContain(s);
    }
    expect(CHAPTER_PANEL_SELECTORS as readonly string[]).not.toContain('.ffx-sinhud');
    // The move advisor's card treats the same three as obstacles, with Chapter XII's read-out as before.
    expect([...ADVISOR_PANEL_SELECTORS]).toEqual([...OMNIS_READOUT_SELECTORS, ...SIN_HUD_SELECTORS]);
  });
});

// ------------------------------------------------------------------ absence

describe('absence: no Sin flags, no Sin HUD (every other chapter)', () => {
  it('Chapter VIII (Evrae) publishes the range but has no Fin and no clock: hidden', () => {
    const e = engineOn(evraeGroup, fahrenheitBuild);
    expect(flagsOf(e)['airship.range']).toBeDefined();
    expect(sinClockView(stateOf(e))).toBeNull();
    expect(sinFinPlateView(stateOf(e))).toBeNull();
    const { hud, host } = mountHud();
    hud.sync(stateOf(e));
    expect(hud.el.hidden).toBe(true);
    expect(host.hasAttribute('data-sin-hud')).toBe(false);
  });

  it('a generic FFX battle state: hidden', () => {
    const { hud } = mountHud();
    hud.sync(makeFakeBattleState());
    expect(hud.el.hidden).toBe(true);
    expect(hud.view()).toEqual({ clock: null, fin: null });
    hud.sync(null);
    expect(hud.el.hidden).toBe(true);
  });
});
