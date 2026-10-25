// @vitest-environment jsdom
/**
 * THE BOOTH SCREENS' SWITCH (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b "Mixed read"; both games; `src/app/demo/boothSwitch.ts`).
 *
 * Claims: the new end card and attract card are ON with no address word since r64 (item 200b: the conference pack is the default), ON with `?booth=new` or the shared `?pack=demo`, OFF again with `?pack=off` or `?booth=today` (today's thanks card and reel exactly);
 * they need demo mode on top (a plain page with `?booth=new` shows nothing new); `?card=end|attract` names a standalone card and nothing else does; `?attract=reel` keeps release 61's reel behind the card.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { attractIsCard, attractReelFromSearch, boothCardFromSearch, boothMode, boothModeFromSearch, boothNewOn, setBoothMode } from '../../src/app/demo/boothSwitch.ts';

afterEach(() => {
  setBoothMode(null);
  setDemoMode(null);
  window.history.replaceState(null, '', '/');
});

describe('the booth screens switch: the address', () => {
  it('is on with nothing in the address (r64, item 200b), off with no page and with ?pack=off or ?booth=today', () => {
    expect(boothModeFromSearch('')).toBe('new');
    expect(boothModeFromSearch('?demo=1')).toBe('new');
    expect(boothModeFromSearch(undefined)).toBe('today');
    expect(boothModeFromSearch('?pack=off')).toBe('today');
    expect(boothModeFromSearch('?demo=1&pack=off')).toBe('today');
    expect(boothModeFromSearch('?booth=today')).toBe('today');
    expect(boothModeFromSearch('?pack=off&booth=new')).toBe('new'); // the lane's own word still wins
  });

  it('is on with ?booth=new and with the shared ?pack=demo', () => {
    expect(boothModeFromSearch('?booth=new')).toBe('new');
    expect(boothModeFromSearch('?demo=1&pack=demo')).toBe('new');
  });

  it('is off again with ?booth=today, whatever the pack says (the A/B)', () => {
    expect(boothModeFromSearch('?pack=demo&booth=today')).toBe('today');
    expect(boothModeFromSearch('?booth=today&pack=demo')).toBe('today');
  });

  it('reads the words case-insensitively and ignores a word it does not know', () => {
    expect(boothModeFromSearch('?booth=NEW')).toBe('new');
    expect(boothModeFromSearch('?booth=maybe')).toBe('new'); // an unknown word names nothing: the default decides
    expect(boothModeFromSearch('?pack=off&booth=maybe')).toBe('today');
  });

  it('names a standalone card only for end or attract', () => {
    expect(boothCardFromSearch('?card=end')).toBe('end');
    expect(boothCardFromSearch('?card=attract')).toBe('attract');
    expect(boothCardFromSearch('?card=title')).toBeNull();
    expect(boothCardFromSearch('')).toBeNull();
    expect(boothCardFromSearch(undefined)).toBeNull();
  });

  it('keeps the reel only with ?attract=reel', () => {
    expect(attractReelFromSearch('?attract=reel')).toBe(true);
    expect(attractReelFromSearch('?attract=card')).toBe(false);
    expect(attractReelFromSearch('')).toBe(false);
  });
});

describe('the booth screens switch: the page', () => {
  it('needs demo mode on top of the switch', () => {
    setBoothMode('new');
    setDemoMode(false);
    expect(boothNewOn()).toBe(false);
    setDemoMode(true);
    expect(boothNewOn()).toBe(true);
    setBoothMode('today');
    expect(boothNewOn()).toBe(false);
  });

  it('reads the page address once and lets the debug setter override it', () => {
    expect(boothMode()).toBe('new'); // the test page has no address word: r64's default
    setBoothMode('today');
    expect(boothMode()).toBe('today');
    window.history.replaceState(null, '', '/?pack=off');
    setBoothMode(null);
    expect(boothMode()).toBe('today'); // the old behaviour, by the address
  });

  it('starts the card at idle, and the reel when the address keeps it', () => {
    setDemoMode(true);
    setBoothMode('new');
    expect(attractIsCard()).toBe(true);
    window.history.replaceState(null, '', '/?attract=reel');
    expect(attractIsCard()).toBe(false);
    window.history.replaceState(null, '', '/');
    setBoothMode('today');
    expect(attractIsCard()).toBe(false);
  });
});
