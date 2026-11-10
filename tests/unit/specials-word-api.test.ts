// @vitest-environment jsdom
/**
 * The debug call of the FFX-2 Special look's test word (step A; game case: FFX-2 only in meaning; the call is plumbing, inert in production): `window.__pyrefly.specials(on?)`.
 * The object `installDebugApi` puts on `window.__pyrefly` carries it, it sets and reads the next-battle switch, and in a production build (`__PYREFLY_SPECIALS__` false) it does nothing.
 *
 * Removal: take `specials: specialsDebug` out of `src/debug/api.ts` and the first case fails.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { specialsDebug, specialsOn } from '../../src/app/specialsWord.ts';
import { installDebugApi } from '../../src/debug/api.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  specialsDebug(false);
  delete (window as { __pyrefly?: unknown }).__pyrefly;
});

/** An app whose every member is a no-op: enough for `installDebugApi`, which only registers screens and reads lazily. */
const fakeApp = (): Parameters<typeof installDebugApi>[0] => new Proxy({}, { get: () => () => undefined }) as unknown as Parameters<typeof installDebugApi>[0];

describe('window.__pyrefly.specials', () => {
  it('is on the api object installDebugApi returns and puts on the window', () => {
    const api = installDebugApi(fakeApp());
    expect(typeof api.specials).toBe('function');
    expect(window.__pyrefly).toBe(api);
  });

  it('sets the next-battle switch, reads it with no argument, and false clears it', () => {
    const api = installDebugApi(fakeApp());
    expect(api.specials()).toBe(false);
    expect(api.specials(true)).toBe(true);
    expect(specialsOn('')).toBe(true);
    expect(api.specials()).toBe(true);
    expect(api.specials(false)).toBe(false);
    expect(specialsOn('')).toBe(false);
  });

  it('does nothing and answers false in a production build', () => {
    vi.stubGlobal('__PYREFLY_SPECIALS__', false);
    const api = installDebugApi(fakeApp());
    expect(api.specials(true)).toBe(false);
    expect(specialsOn('')).toBe(false);
  });
});
