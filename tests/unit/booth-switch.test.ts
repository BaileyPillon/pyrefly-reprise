// @vitest-environment jsdom
/**
 * THE BOOTH SCREENS' SWITCH (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b "Mixed read"; both games; `src/app/demo/boothSwitch.ts`).
 *
 * Claims: the new end card and attract card are OFF with no address word (today's thanks card and reel exactly), ON with `?booth=new` or the shared `?pack=demo`, OFF again with `?pack=demo&booth=today`;
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
  it('is off with nothing in the address', () => {
    expect(boothModeFromSearch('')).toBe('today');
    expect(boothModeFromSearch(undefined)).toBe('today');
    expect(boothModeFromSearch('?demo=1')).toBe('today');
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
    expect(boothModeFromSearch('?booth=maybe')).toBe('today');
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
    expect(boothMode()).toBe('today'); // the test page has no address word
    setBoothMode('new');
    expect(boothMode()).toBe('new');
    setBoothMode(null);
    expect(boothMode()).toBe('today');
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
