// @vitest-environment jsdom
/**
 * The r63 integration (conference demo, 2026-10-23; both games; Chapter I FFX and Chapter IV FFX-2 only): the three "pro" lanes (the look, the camera, the staging) on ONE switch map. With
 * `?pack=demo` all three are ON; each flips OFF from the address (`?look=today`, `?camera=off`, `?staging=today`, and the master `?pro=off`) and from the switchboard with its own key
 * (`/`, `;`, `\`); no two keys collide; the legend `=` names every key in plain words. Also the house rule the merge had to keep: two files stay under 400 lines.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { proLanes } from '../../../src/engine/motion/DemoGate.ts';
import { proModeFromSearch, setProMode } from '../../../src/engine/look/pro/ProSwitch.ts';
import { parseProCamKeys, proCamConfigured, resetProCamForTests, setProCam } from '../../../src/engine/procam/ProCamSwitch.ts';
import { setStagingMode, stagingMode, stagingModeFromSearch } from '../../../src/engine/pro/staging/StagingSwitch.ts';
import { EXTRA_KEYS, SWITCHES, legendRows, normaliseCode, switchOfCode } from '../../../src/app/demo/switchboardModel.ts';
import { installSwitchboard } from '../../../src/app/demo/switchboard.ts';

afterEach(() => {
  setProMode(null);
  setStagingMode(null);
  resetProCamForTests();
  setProCam(undefined);
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

const camOn = (search: string): boolean => {
  const k = parseProCamKeys(search);
  return k.camera ?? k.pack;
};

describe('the lanes\' address forms', () => {
  it('the master word reads on, off, today, and nothing else', () => {
    expect(proLanes('?pro=off')).toBe('off');
    expect(proLanes('?pro=today')).toBe('off');
    expect(proLanes('?pro=on')).toBe('on');
    expect(proLanes('?pack=demo')).toBe('');
    expect(proLanes('?pro=maybe')).toBe('');
    expect(proLanes(undefined)).toBe('');
  });

  it('with ?pack=demo every lane is ON, and so is it with no key at all since r64 (item 200b); with ?pack=off every lane is OFF', () => {
    expect(proModeFromSearch('?pack=demo')).toBe('pro');
    expect(camOn('?pack=demo')).toBe(true);
    expect(stagingModeFromSearch('?pack=demo')).toBe('pro');
    expect(proModeFromSearch('')).toBe('pro');
    expect(camOn('')).toBe(true);
    expect(stagingModeFromSearch('')).toBe('pro');
    expect(proModeFromSearch('?pack=off')).toBe('today');
    expect(camOn('?pack=off')).toBe(false);
    expect(stagingModeFromSearch('?pack=off')).toBe('today');
  });

  it('each lane\'s own key turns only that lane off, beside the pack', () => {
    expect(proModeFromSearch('?pack=demo&look=today')).toBe('today');
    expect(camOn('?pack=demo&look=today')).toBe(true);
    expect(stagingModeFromSearch('?pack=demo&look=today')).toBe('pro');
    expect(camOn('?pack=demo&camera=off')).toBe(false);
    expect(camOn('?pack=demo&camera=today')).toBe(false);
    expect(proModeFromSearch('?pack=demo&camera=off')).toBe('pro');
    expect(stagingModeFromSearch('?pack=demo&staging=today')).toBe('today');
    expect(stagingModeFromSearch('?pack=demo&staging=off')).toBe('today');
    expect(proModeFromSearch('?pack=demo&staging=today')).toBe('pro');
  });

  it('?pro=off takes all three off at once, beating the pack and each lane\'s own key; ?pro=on turns all three on without the pack, under each lane\'s key', () => {
    const off = '?pack=demo&pro=off';
    expect([proModeFromSearch(off), camOn(off), stagingModeFromSearch(off)]).toEqual(['today', false, 'today']);
    const offForced = '?pack=demo&pro=off&look=pro&camera=pro&staging=pro';
    expect([proModeFromSearch(offForced), camOn(offForced), stagingModeFromSearch(offForced)]).toEqual(['today', false, 'today']);
    const on = '?pro=on';
    expect([proModeFromSearch(on), camOn(on), stagingModeFromSearch(on)]).toEqual(['pro', true, 'pro']);
    const onOne = '?pro=on&camera=off';
    expect([proModeFromSearch(onOne), camOn(onOne), stagingModeFromSearch(onOne)]).toEqual(['pro', false, 'pro']);
  });
});

describe('one switch map', () => {
  const lane = (key: string) => SWITCHES.find((s) => s.key === key)!;

  it('the three lanes have three different keys, / ; and \\, and every key of the board is unique', () => {
    expect(lane('/').name).toBe('look');
    expect(lane(';').name).toBe('camera');
    expect(lane('\\').name).toBe('staging');
    const keys = SWITCHES.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    const codes = SWITCHES.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const e of EXTRA_KEYS) expect(keys).not.toContain(e.key);
    const input = readFileSync('src/app/Input.ts', 'utf8') + readFileSync('src/app/inputKeyMap.ts', 'utf8'); // the key map lives in inputKeyMap.ts since release 68
    for (const c of codes) expect(input, c).not.toContain(`${c}:`);
    expect(switchOfCode('Slash')?.name).toBe('look');
    expect(switchOfCode('Semicolon')?.name).toBe('camera');
    expect(switchOfCode('Backslash')?.name).toBe('staging');
    expect(normaliseCode('Backslash')).toBe('Backslash');
  });

  it('the three lanes flip independently, and the master key sets all three with the rest', () => {
    setProMode('pro');
    setProCam(true);
    setStagingMode('pro');
    expect(lane('/').flip!()).toBe('today');
    expect(proCamConfigured()).toBe(true);
    expect(stagingMode()).toBe('pro');
    expect(lane('/').flip!()).toBe('pro');
    expect(lane(';').flip!()).toBe('today');
    expect(proModeFromSearch('?pack=demo')).toBe('pro');
    expect(stagingMode()).toBe('pro');
    expect(lane(';').flip!()).toBe('pro');
    expect(lane('\\').flip!()).toBe('today');
    expect(proCamConfigured()).toBe(true);
    lane('\\').set!(false);
    lane(';').set!(false);
    expect([lane('\\').isNew(), lane(';').isNew(), lane('/').isNew()]).toEqual([false, false, true]);
    for (const s of SWITCHES) s.set?.(true);
    expect([stagingMode(), proCamConfigured()]).toEqual(['pro', true]);
  });

  it('every key has a plain-words line, and the legend names every key of the board plus 0 and =', () => {
    for (const s of SWITCHES) expect(s.plain.length, s.key).toBeGreaterThan(12);
    const rows = legendRows();
    const keys = rows.map((r) => r.key);
    for (const s of SWITCHES) expect(keys).toContain(s.key);
    expect(keys).toContain('0');
    expect(keys).toContain('=');
    for (const r of rows) expect(r.plain.trim().length, r.key).toBeGreaterThan(10);
    expect(rows.find((r) => r.key === '/')!.plain).toMatch(/ink hits/);
    expect(rows.find((r) => r.key === ';')!.plain).toMatch(/camera/i);
    expect(rows.find((r) => r.key === '\\')!.plain).toMatch(/held breath/);
  });
});

describe('the legend on the page', () => {
  it('= shows the legend (every key, in plain words), then hides the board, then shows the label again', () => {
    window.history.replaceState({}, '', '/?demo=1&pack=demo&switchboard=1');
    const board = installSwitchboard();
    expect(board).not.toBeNull();
    const el = document.querySelector('[data-switchboard]') as HTMLElement;
    expect(el.textContent).toContain('legend'); // the label tells where the legend is
    board!.press('Equal');
    expect(el.classList.contains('sb-legend')).toBe(true);
    expect(el.hidden).toBe(false);
    const text = el.textContent ?? '';
    for (const s of SWITCHES) expect(text, s.key).toContain(s.plain);
    expect(text).toContain('Everything');
    board!.press('Equal');
    expect(el.hidden).toBe(true);
    board!.press('Equal');
    expect(el.hidden).toBe(false);
    expect(el.classList.contains('sb-legend')).toBe(false);
    board!.dispose();
    window.history.replaceState({}, '', '/');
  });
});

describe('the house rule the merge had to keep', () => {
  it('the two files the lanes crowded stay under 400 lines', () => {
    for (const f of ['src/engine/BattlePresenterBeats.ts', 'src/engine/BattleCamera.ts', 'src/engine/BattlePresenterSettle.ts', 'src/engine/fx/c/SpectacleFx.ts', 'src/engine/fx/c/SpectacleTypes.ts', 'src/engine/look/LookRig.ts']) {
      const n = readFileSync(f, 'utf8').split(/\r?\n/).length - 1;
      expect(n, f).toBeLessThan(400);
    }
  });
});
