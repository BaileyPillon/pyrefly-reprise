// @vitest-environment jsdom
/**
 * r64-fixes, the HUD and flow pieces (conference demo; the case of each is in its name):
 *  - FFX only (Chapter I): the party cards ease when an aeon replaces them (`ui/ffx/partySwap.ts`), and the damage numerals dodge the turn strip's whole footprint (`DamageNumbers.footprintOf`);
 *  - both games: the retried fight's theme comes in at the press (`demoDefeat.startRetryTheme`), its figures are built behind the defeat card, the QR plate has a floor, the playtest label leaves the pause tabs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PartyStatusWindow } from '../../src/ui/ffx/PartyStatusWindow.ts';
import { PARTY_IN_DELAY_MS, PARTY_IN_STEP_MS, makePartyGhost, memberKey, membershipChanged, playPartySwap, swapTiming } from '../../src/ui/ffx/partySwap.ts';
import { footprintOf } from '../../src/ui/ffx/DamageNumbers.ts';
import { HUD_F1_TUNE } from '../../src/ui/hudf1/HudF1Switch.ts';
import { retryTheme, startRetryTheme } from '../../src/app/demo/demoDefeat.ts';
import { resultsCueFor, startResultsMusic } from '../../src/app/screens/resultsMusic.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { pauseScreenUp } from '../../src/app/demo/switchboard.ts';

const REPO = join(__dirname, '..', '..');
const src = (rel: string): string => readFileSync(join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');

const member = (id: string, side = 'party'): Record<string, unknown> => ({ id, name: id, side, alive: true, hp: 100, mp: 10, stats: { maxHp: 100, maxMp: 10 }, statuses: {}, portraitKey: id, spriteKey: id });
const combatants = (ids: string[]): never => Object.fromEntries(ids.map((id) => [id, member(id, id === 'ixion' ? 'aeon' : 'party')])) as never;

// ------------------------------------------------------------------------------------------------ the party swap (FFX only)

describe('partySwap: who is on the list', () => {
  it('memberKey is order-free; a change of members is a swap only when something was drawn to leave', () => {
    expect(memberKey(['yuna', 'tidus'])).toBe(memberKey(['tidus', 'yuna']));
    expect(membershipChanged(null, 'ixion', 0)).toBe(false); // the first render
    expect(membershipChanged('tidus|yuna', 'tidus|yuna', 2)).toBe(false); // numbers only
    expect(membershipChanged('kimahri|tidus|yuna', 'ixion', 3)).toBe(true); // the summon
    expect(membershipChanged('ixion', 'kimahri|tidus|yuna', 1)).toBe(true); // the dismissal
    expect(membershipChanged('tidus', 'ixion', 0)).toBe(false); // nothing drawn
  });

  it('the timing is the HUD\'s own step-back (170 out, 220 back), the slide twice the HUD variable, fade-only under reduce motion', () => {
    const root = document.createElement('div');
    root.style.setProperty('--f1-slide', '52px');
    document.body.append(root);
    const t = swapTiming(root, false);
    expect(t.outMs).toBe(HUD_F1_TUNE.slideOutMs);
    expect(t.inMs).toBe(HUD_F1_TUNE.slideBackMs);
    expect(t.slidePx).toBe(104);
    expect(swapTiming(root, true).reduce).toBe(true);
    root.remove();
  });
});

describe('partySwap: the PartyStatusWindow in the F1 HUD', () => {
  let host: HTMLElement;
  let w: PartyStatusWindow;
  beforeEach(() => {
    host = document.createElement('div');
    host.className = 'hud-f1';
    w = new PartyStatusWindow();
    host.append(w.el);
    document.body.append(host);
  });
  afterEach(() => host.remove());

  it('an aeon replacing the party leaves a ghost of the three cards (no data-role, aria-hidden) and starts the moves; a render of numbers does not', () => {
    const animated: Array<{ el: Element; frames: unknown; opts: KeyframeAnimationOptions }> = [];
    const proto = HTMLElement.prototype as unknown as { animate?: unknown };
    proto.animate = function (this: Element, frames: unknown, opts: KeyframeAnimationOptions) {
      animated.push({ el: this, frames, opts });
      return {} as Animation;
    };
    try {
      w.render(['tidus', 'yuna', 'kimahri'], combatants(['tidus', 'yuna', 'kimahri']), null);
      w.render(['tidus', 'yuna', 'kimahri'], combatants(['tidus', 'yuna', 'kimahri']), 'tidus'); // numbers and the acting row only
      expect(host.querySelectorAll('.f1-party-ghost')).toHaveLength(0);
      expect(animated).toHaveLength(0);
      w.render(['ixion'], combatants(['ixion']), 'ixion'); // the summon
      const ghost = host.querySelector<HTMLElement>('.f1-party-ghost');
      expect(ghost).not.toBeNull();
      expect(ghost!.querySelectorAll('.ig-stat')).toHaveLength(3);
      expect(ghost!.hasAttribute('data-role')).toBe(false);
      expect(ghost!.getAttribute('aria-hidden')).toBe('true');
      expect(host.querySelectorAll('[data-role="party-status"]')).toHaveLength(1);
      expect(w.el.querySelectorAll('.ig-stat')).toHaveLength(1);
      // the ghost goes out over the HUD's 170 ms, the new card comes in 220 ms after the ghost has started (one step per card)
      const out = animated.find((a) => a.el === ghost)!;
      expect(out.opts.duration).toBe(170);
      const incoming = animated.filter((a) => a.el !== ghost);
      expect(incoming).toHaveLength(1);
      expect(incoming[0]!.opts.duration).toBe(220);
      expect(incoming[0]!.opts.delay).toBe(PARTY_IN_DELAY_MS);
      // and back: the dismissal does the same the other way round
      animated.length = 0;
      w.render(['tidus', 'yuna', 'kimahri'], combatants(['tidus', 'yuna', 'kimahri']), null);
      const rows = animated.filter((a) => (a.el as HTMLElement).classList.contains('ig-stat'));
      expect(rows.map((r) => r.opts.delay)).toEqual([0, 1, 2].map((i) => PARTY_IN_DELAY_MS + i * PARTY_IN_STEP_MS));
    } finally {
      delete proto.animate;
    }
  });

  it('where the browser has no animate (this test\'s jsdom) the ghost is removed and nothing throws', () => {
    w.render(['tidus', 'yuna', 'kimahri'], combatants(['tidus', 'yuna', 'kimahri']), null);
    w.render(['ixion'], combatants(['ixion']), null);
    expect(host.querySelectorAll('.f1-party-ghost')).toHaveLength(0);
    expect(w.el.querySelectorAll('.ig-stat')).toHaveLength(1);
  });

  it('outside the F1 HUD the swap does not happen at all (today\'s HUD renders as it always did)', () => {
    const plain = new PartyStatusWindow();
    const holder = document.createElement('div');
    holder.append(plain.el);
    document.body.append(holder);
    plain.render(['tidus', 'yuna', 'kimahri'], combatants(['tidus', 'yuna', 'kimahri']), null);
    plain.render(['ixion'], combatants(['ixion']), null);
    expect(holder.querySelectorAll('.f1-party-ghost')).toHaveLength(0);
    holder.remove();
  });

  it('makePartyGhost needs a parent: an unmounted list has none', () => {
    expect(makePartyGhost(document.createElement('div'))).toBeNull();
    const out = playPartySwap(document.createElement('div'), null, { outMs: 170, inMs: 220, slidePx: 104, reduce: false });
    expect(out).toBe(0);
  });
});

// ------------------------------------------------------------------------------------------------ the numeral's dodge (FFX only)

describe('footprintOf: the turn strip is dodged by everything drawn in it', () => {
  it('the union of the box and every descendant that has a box (the names and chips that hang below it), not the box alone', () => {
    const box = document.createElement('div');
    const name = document.createElement('span');
    const chip = document.createElement('i');
    const hidden = document.createElement('b');
    box.append(name, chip, hidden);
    document.body.append(box);
    const rect = (l: number, t: number, r: number, b: number): DOMRect => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t, x: l, y: t, toJSON: () => ({}) }) as DOMRect;
    box.getBoundingClientRect = () => rect(1860, 88, 2502, 266);
    name.getBoundingClientRect = () => rect(2300, 270, 2500, 300);
    chip.getBoundingClientRect = () => rect(2300, 300, 2400, 356);
    hidden.getBoundingClientRect = () => rect(0, 0, 0, 0); // a row the F1 strip hides (display none)
    expect(footprintOf(box)).toEqual({ left: 1860, top: 88, right: 2502, bottom: 356 });
    box.remove();
  });

  it('the FFX numerals list the turn strip by its footprint', () => {
    const s = src('src/ui/ffx/DamageNumbers.ts');
    expect(s).toContain("const FOOTPRINT_PANELS: ReadonlySet<string> = new Set(['.ig-ctb']);");
    expect(s).toContain('FOOTPRINT_PANELS.has(selector) ? footprintOf(el) : el.getBoundingClientRect()');
  });
});

// ------------------------------------------------------------------------------------------------ the retry (both games)

describe('startRetryTheme: the retried fight\'s theme at the press', () => {
  afterEach(() => setDemoMode(null));

  it('asks for the cue the chain will ask for, for both demo fights, and only in demo mode', () => {
    setDemoMode(true);
    for (const id of ['seymour-flux', 'ffx2-bahamut']) {
      const asked: Array<[string, { fade?: number } | undefined]> = [];
      const chapter = getChapter(id)!;
      const track = startRetryTheme(chapter, { playMusic: (n, o) => void asked.push([n, o]) });
      expect(track).toBe(chapter.music.battle);
      expect(asked).toEqual([[chapter.music.battle, { fade: 0.8 }]]);
    }
    const none: string[] = [];
    expect(startRetryTheme(getChapter('yunalesca')!, { playMusic: (n) => void none.push(n) })).toBeNull(); // not a demo fight
    setDemoMode(false);
    expect(startRetryTheme(getChapter('seymour-flux')!, { playMusic: (n) => void none.push(n) })).toBeNull(); // not demo mode
    expect(none).toEqual([]);
  });

  it('a mixer that throws or rejects never takes the flow down', async () => {
    setDemoMode(true);
    const chapter = getChapter('seymour-flux')!;
    expect(startRetryTheme(chapter, { playMusic: () => { throw new Error('no audio'); } })).toBeNull();
    expect(startRetryTheme(chapter, { playMusic: () => Promise.reject(new Error('no file')) })).toBe(chapter.music.battle);
    await Promise.resolve();
  });

  it("a lost demo fight's defeat cue keeps the fight's own theme decoded (upcoming), so the retry does not decode it again", () => {
    setDemoMode(true);
    const chapter = getChapter('ffx2-bahamut')!;
    const asked: Array<[string, unknown]> = [];
    const port = { requestedMusic: null, playMusic: (n: string, o?: unknown) => void asked.push([n, o]), stopMusic: () => undefined };
    const cue = resultsCueFor(chapter, 'defeat');
    expect(cue?.kind).toBe('defeat');
    startResultsMusic(port, cue, [retryTheme(chapter)!]);
    expect(asked).toHaveLength(1);
    expect(asked[0]![1]).toEqual({ fade: cue!.fade, upcoming: [chapter.music.battle] });
    asked.length = 0;
    startResultsMusic(port, cue); // no upcoming: the old call, unchanged
    expect(asked[0]![1]).toEqual({ fade: cue!.fade });
    setDemoMode(false);
    expect(retryTheme(chapter)).toBeUndefined();
  });

  it('a theme the mixer is already heading for is not asked twice', () => {
    setDemoMode(true);
    const chapter = getChapter('seymour-flux')!;
    const asked: string[] = [];
    expect(startRetryTheme(chapter, { requestedMusic: chapter.music.battle, playMusic: (n) => void asked.push(n) })).toBe(chapter.music.battle);
    expect(asked).toEqual([]);
  });

  it('the flow hands the retried fight a screen word to ask for its theme as it opens (review F3: an ask at the press was dropped by the exit of the lost screen), after the hurried-opening line the r63 test reads, and the warm builds the figures behind the defeat card too', () => {
    const flow = src('src/app/screens/BattleScreenFlow.ts');
    expect(flow).toContain('if (demoQuickRetry(id, attempt)) openingHurry = true;');
    expect(flow).toContain('...(demoQuickRetry(id, attempt) && !retryThemeSwitchedOff() ? { retryTheme: true } : {})');
    expect(flow).not.toContain('startRetryTheme(chapter, audio)'); // no ask at the press: the lost screen's exit stops the music right after it and drops the request
    expect(src('src/app/screens/BattleScreen.ts')).toContain('if (this.opts.retryTheme) startRetryTheme(chapter, audio);');
    expect(flow).toContain('startResultsMusic(audio, cue, keepForRetry ? [keepForRetry] : undefined)');
    const warm = src('src/app/demo/demoWarm.ts');
    expect(warm).toContain('const figuresAhead = prebuildOn();');
    expect(warm).not.toContain('const figuresAhead = !light && prebuildOn();');
    expect(warm).toContain("'pro-defeat'");
  });
});

// ------------------------------------------------------------------------------------------------ the small overlaps

describe('the two small overlaps', () => {
  it('the QR plate has a floor under the caption\'s 12 px floor, and its words never wrap', () => {
    const css = src('src/app/demo/demo.css');
    expect(css).toContain('width: max(calc(128 * var(--fe-k, 1px)), 156px);');
    expect(css).toMatch(/\.demo-qr__cap span \{\n  white-space: nowrap;/);
  });

  it('the playtest label drops to the bottom edge while the pause screen is up (its last line sat over the tab row)', () => {
    expect(pauseScreenUp()).toBe(false);
    const stage = document.createElement('div');
    stage.className = 'pause__stage lb-stage';
    document.body.append(stage);
    expect(pauseScreenUp()).toBe(true);
    stage.remove();
    const s = src('src/app/demo/switchboard.ts');
    expect(s).toContain('.sb.sb-pause{top:auto;bottom:4px}');
    expect(s).toContain("el.classList.toggle('sb-pause', pauseScreenUp());");
  });
});

void vi;
