/**
 * Release 73, lane "r73-bytes" review (major 2; BOTH games, measurement seam only; `docs/handoff/r73-bytes.md`): the browser job has to say, automatically, how many idle lighting maps had landed and how many
 * rig looks were still on their way AT `pyrefly:enter:shown` and at the first menu, because the lane's look claim ("no look change") rests on them and no agent can look at a screen. The books are read by
 * `EntryMarks.entryMark`, which attaches the debug probe's reading (`debug/artApi.ts` installs it) to every `pyrefly:enter:*` mark as its `detail`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { bytesReading, installArtDebug } from '../../src/debug/artApi.ts';
import { entryMark, setEntryMarkProbe } from '../../src/engine/EntryMarks.ts';
import { noteBytesCut, resetHoldForTests } from '../../src/engine/LoadHold.ts';
import { relightStats } from '../../src/engine/look/relight/FigureRelight.ts';

const marksNamed = (step: string): PerformanceEntry[] => performance.getEntriesByName(`pyrefly:enter:${step}`, 'mark');

afterEach(() => {
  setEntryMarkProbe(null);
  performance.clearMarks();
  resetHoldForTests();
  relightStats.loaded = 0;
  relightStats.missing = 0;
  vi.restoreAllMocks();
});

describe('the entry marks and their probe', () => {
  it('with no probe a mark is the plain mark it always was', () => {
    const spy = vi.spyOn(performance, 'mark');
    entryMark('begin');
    expect(spy).toHaveBeenCalledWith('pyrefly:enter:begin');
    expect(marksNamed('begin')).toHaveLength(1);
  });

  it('with a probe the mark carries its reading as the detail, taken at the mark', () => {
    let n = 0;
    setEntryMarkProbe(() => ({ n: ++n }));
    entryMark('stage');
    entryMark('shown');
    expect((marksNamed('stage')[0] as PerformanceMark).detail).toEqual({ n: 1 });
    expect((marksNamed('shown')[0] as PerformanceMark).detail).toEqual({ n: 2 });
  });

  it('a probe that throws, or answers nothing, leaves a plain mark and breaks nothing', () => {
    setEntryMarkProbe(() => {
      throw new Error('boom');
    });
    expect(() => entryMark('hud')).not.toThrow();
    expect(marksNamed('hud')).toHaveLength(1);
    setEntryMarkProbe(() => undefined);
    entryMark('scene');
    expect((marksNamed('scene')[0] as PerformanceMark).detail).toBeNull();
  });
});

describe('what the debug seam hands the probe', () => {
  it('release 73\'s books and how many lighting maps have landed or turned out missing', () => {
    noteBytesCut('idleMaps', 5);
    noteBytesCut('rigLooks', 30);
    noteBytesCut('rigLanded', 22);
    noteBytesCut('rigEarlyLooks', 18);
    noteBytesCut('rigEarlyLanded', 17);
    relightStats.loaded = 4;
    relightStats.missing = 1;
    expect(bytesReading()).toEqual({ audioCues: 0, idleMaps: 5, rigLooks: 30, rigLanded: 22, rigFailed: 0, rigEarlyLooks: 18, rigEarlyLanded: 17, governorNeeds: 0, mapsLoaded: 4, mapsMissing: 1 });
  });

  it('installing the seam puts that reading on every entry mark from then on', () => {
    installArtDebug({}, {} as unknown as App);
    noteBytesCut('rigLooks', 7);
    relightStats.loaded = 3;
    entryMark('shown');
    expect((marksNamed('shown')[0] as PerformanceMark).detail).toMatchObject({ rigLooks: 7, rigLanded: 0, idleMaps: 0, mapsLoaded: 3 });
  });
});
