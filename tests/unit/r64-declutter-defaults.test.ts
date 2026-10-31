// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { demoPanelStart } from '../../src/app/demo/demoHud.ts';
import { activeSave, readSetting } from '../../src/app/SaveData.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { ALL_COACH_IDS } from '../../src/ui/coach/coachCopy.ts';
import { resetCoach, shouldShow } from '../../src/ui/coach/coachState.ts';
import { FIRST_RUN_IDS } from '../../src/ui/coach/firstRunCopy.ts';
import { EnemyIntentPanel } from '../../src/ui/common/EnemyIntent.ts';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { setHudF1Mode, setHudF1TextMode } from '../../src/ui/hudf1/HudF1Switch.ts';

/**
 * r64 declutter (Bailey's approved F1 target, decisions 191 to 193 "Less on screen" and "Steps back in action"; 2026-10-24 "you make the calls"; BOTH games, presentation only: no number, ability, turn order or rule moves).
 *
 * The defect (live build, public address, a fresh profile, Chapter IV): the guide, the enemy-move read-out and Rikku's first-use card were all up at the first menu, beside the F1 boss ribbon AND FFX-2's own enemy strip
 * (two boss bars), and the guide and the read-out stayed up through an action. The F1 target has five groups at the first menu and four in an action, with "enemy details, guide and tips behind X (Intel)".
 *
 *  1. The guide and the enemy-move read-out START FOLDED while the F1 HUD is the one drawing, on the public address and the booth's, and what the player does with G or E in that fight is not written to the save.
 *  2. The in-battle teaching cards are not drawn while the F1 HUD is on (the cue and the prompt bar are the teaching); nothing is marked seen, so every other chapter and `?pack=off` teach as ever.
 *  3. The enemy strip is no second boss bar, and what Intel opened steps back with the command block (the style sheets say so).
 *  4. Everything is as it was with the switch off (`?pack=off`, `?hud=today`), in another chapter, and in the booth's own start.
 */
beforeEach(() => {
  resetCoach();
  setDemoMode(null);
  setHudF1Mode('f1');
  setDemoChapter('ffx2-bahamut');
  try {
    sessionStorage.clear();
  } catch {
    /* jsdom always has one */
  }
});
afterEach(() => {
  setHudF1Mode(null);
  setHudF1TextMode(null);
  setDemoChapter(undefined);
  setDemoMode(null);
  resetCoach();
  document.documentElement.removeAttribute('data-text-size');
  document.documentElement.removeAttribute('data-text-size-wide');
});

describe('1. the guide and the enemy-move read-out start folded with the F1 HUD on', () => {
  it('demoPanelStart folds the guide and the intent in both demo chapters and swallows the answer; the advisor keeps its own setting', () => {
    for (const chapter of ['seymour-flux', 'ffx2-bahamut']) {
      setDemoChapter(chapter);
      for (const panel of ['guide', 'intent'] as const) {
        const o = demoPanelStart(panel);
        expect(o.readVisible?.(), `${chapter} ${panel} starts folded`).toBe(false);
        expect(typeof o.writeVisible, `${chapter} ${panel} write is swallowed`).toBe('function');
      }
      expect(demoPanelStart('advisor'), `${chapter} advisor is the player's own`).toEqual({});
    }
  });

  it('a real StrategyGuide and EnemyIntentPanel built with those options are folded, and G / E in the fight leave the save alone', () => {
    const before = { guide: readSetting('guideVisible'), intent: readSetting('intentVisible') };
    expect(before).toEqual({ guide: true, intent: true }); // the shipped defaults: the saved answer is "show", and the F1 HUD still starts folded
    const guide = new StrategyGuide({ game: 'ffx2', anchors: { top: 44, bottom: 104 }, ...demoPanelStart('guide') });
    const intent = new EnemyIntentPanel({ game: 'ffx2', ...demoPanelStart('intent') });
    expect(guide.isVisible).toBe(false);
    expect(intent.isVisible).toBe(false);
    guide.setVisible(true);
    intent.setVisible(true);
    expect(guide.isVisible, 'G opens it for the fight').toBe(true);
    expect(intent.isVisible, 'E opens it for the fight').toBe(true);
    guide.setVisible(false);
    intent.setVisible(false);
    expect({ guide: readSetting('guideVisible'), intent: readSetting('intentVisible') }, 'the player\'s own switches are untouched').toEqual(before);
    expect(activeSave()?.settings.guideVisible ?? true).toBe(true);
  });

  it('is unchanged with ?pack=off / ?hud=today, with a text size other than 100, and in any other chapter', () => {
    setHudF1Mode('today');
    expect(demoPanelStart('guide')).toEqual({});
    expect(demoPanelStart('intent')).toEqual({});
    setHudF1Mode('f1');
    document.documentElement.dataset['textSize'] = '115';
    expect(demoPanelStart('guide'), 'the F1 HUD grows with TEXT SIZE now (a11y-text), so it still starts folded at 115').not.toEqual({});
    setHudF1TextMode('today'); // release 67 step-down: today's HUD at 115, nothing folded
    expect(demoPanelStart('guide')).toEqual({});
    setHudF1TextMode(null);
    document.documentElement.removeAttribute('data-text-size');
    setDemoChapter('sinspawn-gui');
    expect(demoPanelStart('guide')).toEqual({});
    expect(demoPanelStart('intent')).toEqual({});
    setDemoChapter(undefined); // no battle named at all (a menu, a unit test)
    expect(demoPanelStart('guide')).toEqual({});
    const guide = new StrategyGuide({ game: 'ffx2', anchors: { top: 44, bottom: 104 }, ...demoPanelStart('guide') });
    expect(guide.isVisible, 'the saved default (on) reaches the guide when the F1 HUD is not drawing').toBe(true);
  });

  it("the booth's own start (?demo=1) is exactly what it was: guide and intent folded, advisor shown, writes swallowed, F1 or not", () => {
    for (const f1 of ['f1', 'today'] as const) {
      setHudF1Mode(f1);
      setDemoMode(true);
      expect(demoPanelStart('guide').readVisible?.()).toBe(false);
      expect(demoPanelStart('intent').readVisible?.()).toBe(false);
      expect(demoPanelStart('advisor').readVisible?.()).toBe(true);
      setDemoMode(null);
    }
  });
});

describe('2. no in-battle teaching card while the F1 HUD is on', () => {
  const battleIds = [...ALL_COACH_IDS.filter((id) => id !== 'briefing'), 'firstrun-battle'];
  const elsewhere = ['briefing', 'firstrun-board', 'firstrun-prep', 'sphere-grid-card'];

  it('every first-use line and the guided first run\'s battle step answer false in Chapter I and Chapter IV; the briefing, the board and prep steps and the Sphere Grid card are untouched', () => {
    for (const chapter of ['seymour-flux', 'ffx2-bahamut']) {
      setDemoChapter(chapter);
      for (const id of battleIds) expect(shouldShow(id), `${chapter} ${id}`).toBe(false);
      for (const id of elsewhere) expect(shouldShow(id), `${chapter} ${id}`).toBe(true);
    }
    expect(FIRST_RUN_IDS).toContain('firstrun-battle');
  });

  it('teaches as it always did with ?pack=off, in another chapter and with no battle running (and marks nothing seen)', () => {
    setHudF1Mode('today');
    for (const id of [...battleIds, ...elsewhere]) expect(shouldShow(id), `off ${id}`).toBe(true);
    setHudF1Mode('f1');
    setDemoChapter('sinspawn-gui');
    for (const id of [...battleIds, ...elsewhere]) expect(shouldShow(id), `other chapter ${id}`).toBe(true);
    setDemoChapter(undefined);
    for (const id of [...battleIds, ...elsewhere]) expect(shouldShow(id), `no battle ${id}`).toBe(true);
  });
});

describe('3. the style sheets: one boss bar, details behind Intel, and Intel steps back in an action', () => {
  const css = (name: string): string => readFileSync(`src/ui/hudf1/${name}`, 'utf8');

  it("Chapter IV's own enemy strip is hidden at the first menu and, behind Intel, loses its name and its bar (the ribbon is the only boss bar)", () => {
    const s = css('hudf1-ffx2.css');
    expect(s).toMatch(/\.ffx2hud\.hud-f1 \.ffx2hud__enemies \{[^}]*opacity: 0; pointer-events: none;/);
    expect(s).toMatch(/\.ffx2hud\.hud-f1\.f1-intel \.ffx2hud__enemies \{[^}]*opacity: 1;/);
    expect(s).toMatch(/\.ffx2boss__head \.ig-bosshp__name,\s*\n\.ffx2hud\.hud-f1 \.ffx2hud__enemies \.ffx2boss__head \.ig-bosshp__track \{ display: none; \}/);
    expect(s, 'the strip is never display: none (the guide rail is anchored under its box)').not.toMatch(/\.ffx2hud__enemies \{[^}]*display: none/);
  });

  it('whatever Intel opened slides out in f1-acting like the command block, and not under REDUCE MOTION', () => {
    const s = css('hudf1-act.css');
    for (const sel of ['.sgd', '.mad', '.eint__panel', '.eint__toggle', '.sthint', '.ffx-sensor']) {
      expect(s, sel).toContain(`.hud-f1.f1-acting ${sel}`);
      expect(s, `${sel} under REDUCE MOTION`).toContain(`html[data-reduce-motion] .hud-f1.f1-acting ${sel}`);
    }
    expect(s).toContain('.ffx2hud.hud-f1.f1-acting .ffx2hud__enemies');
    expect(s).toMatch(/opacity: 0 !important; pointer-events: none !important;/);
  });
});
