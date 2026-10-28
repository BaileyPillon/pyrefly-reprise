/**
 * Release 66 (the motion-fluidity pass, lanes L1 to L5 merged): every address word the five lanes added reads release 65's look when the address says nothing, and when it says something the word
 * does not know. One place to read the table; each lane's own test file pins the same words in depth (named beside each row).
 *
 * | word | default (nothing in the address) | lane test |
 * |---|---|---|
 * | `?interlude=` | `all` (A, on: a girl keeps `ready` into her spell or item; `attack` is release 65's hold) | ffx2-interlude |
 * | `?stance=` `?swapcause=` `?swapclass=` `?swapscope=` | `today`, `today`, every class (inert while the cause is today), `pack` | fluidity-swaps-actor, ffx2-stance |
 * | `?hit=` `?run=` `?kotopple=` `?rigko=` `?hurtstring=` `?summon=` `?ramps=` `?shakeband=` `?strikeshape=` | `today` | mf03 to mf27, mf11, mf12 |
 * | `?atbbars=` `?ctbslide=` `?gridease=` `?triggerhappy=` (and `?fluidui=`) | off | atb-live, ctb-slide, trigger-happy-smooth |
 * | `?beats=` | the frame clock (A, on; `wall` is release 65's `setTimeout` waits) | beat-clock |
 * | `?alphathumb=` | `on` (A; `off` is release 64/65's reading, `exact` keeps only the exact breathing field) | alpha-thumb |
 * | `?govern=fixed` | off (B; release 65's reading) | governor-fixed-reading |
 *
 * Game case: both (the table is shared plumbing; each word's own game is in the handoff notes and the CHANGELOG entry). Pure: no DOM, no `three`.
 */
import { describe, expect, it } from 'vitest';
import { MOVE_WORDS, moveWordFromSearch, type MoveKey } from '../../src/engine/motion/MoveSwitch.ts';
import { causeFromSearch, classesFromSearch, interludeFromSearch, SWAP_CLASSES, scopeFromSearch, stanceFromSearch } from '../../src/engine/motion/SwapSwitch.ts';
import { fluidWord } from '../../src/ui/common/fluidUi.ts';
import { beatsWall } from '../../src/engine/BeatClock.ts';
import { alphaThumbWord } from '../../src/engine/look/AlphaThumb.ts';
import { governFixed } from '../../src/engine/governor/DemoGovernor.ts';

const NOTHING = ['', '?', '?nonsense=1', '?x=y&z=w'];

describe('lane L2 words: every one reads today when the address does not name one of its values', () => {
  for (const key of Object.keys(MOVE_WORDS) as MoveKey[]) {
    it(`?${key}= is '${MOVE_WORDS[key][0]}' with no word, an empty word, or a word it does not know`, () => {
      expect(MOVE_WORDS[key][0]).toBe('today');
      for (const s of [...NOTHING, `?${key}=`, `?${key}=nonsense`, undefined]) expect(moveWordFromSearch(s, key)).toBe('today');
    });
    it(`?${key}= reads each of its listed values`, () => {
      for (const v of MOVE_WORDS[key]) expect(moveWordFromSearch(`?${key}=${v}`, key)).toBe(v);
    });
  }
  it('has exactly the nine words the handoff lists', () => {
    expect(Object.keys(MOVE_WORDS).sort()).toEqual(['hit', 'hurtstring', 'kotopple', 'ramps', 'rigko', 'run', 'shakeband', 'strikeshape', 'summon']);
  });
});

describe('lane L1 words: the interlude is on, the looks are today', () => {
  it('?interlude= is all (post-flicker\'s hold extended to spells and items) unless it says attack', () => {
    for (const s of [...NOTHING, '?interlude=nonsense', undefined]) expect(interludeFromSearch(s)).toBe('all');
    expect(interludeFromSearch('?interlude=attack')).toBe('attack');
  });
  it('?stance= and ?swapcause= are today with nothing, with a word that is not theirs, and (as they play in the pack chapters only) off the pack', () => {
    for (const s of [...NOTHING, '?stance=nonsense', '?swapcause=nonsense', undefined]) {
      expect(stanceFromSearch(s)).toBe('today');
      expect(causeFromSearch(s)).toBe('today');
    }
  });
  it('?swapscope= is the pack chapters; ?swapclass= names every class when absent and none for a word that names none', () => {
    for (const s of [...NOTHING, '?swapscope=nonsense', undefined]) expect(scopeFromSearch(s)).toBe('pack');
    expect([...classesFromSearch('')].sort()).toEqual([...SWAP_CLASSES].sort());
    expect(classesFromSearch('?swapclass=nonsense').size).toBe(0);
  });
});

describe('lane L3 words: the four interface pieces are off, the beat clock is the frame clock', () => {
  const pieces: Array<[own: string, on: string]> = [['atbbars', 'smooth'], ['ctbslide', 'flip'], ['gridease', 'on'], ['triggerhappy', 'smooth']];
  for (const [own, on] of pieces) {
    it(`?${own}=${on} turns its piece on; nothing, another value, or today leaves it off; ?fluidui=on turns it on and its own off word beats that`, () => {
      for (const s of [...NOTHING, `?${own}=nonsense`, `?${own}=today`, `?${own}=off`, undefined]) expect(fluidWord(own, on, s ?? '')).toBe(false);
      expect(fluidWord(own, on, `?${own}=${on}`)).toBe(true);
      expect(fluidWord(own, on, '?fluidui=on')).toBe(true);
      expect(fluidWord(own, on, `?fluidui=on&${own}=today`)).toBe(false);
      expect(fluidWord(own, on, '?fluidui=off')).toBe(false);
    });
  }
  it('?beats= is the frame clock (not wall) with no address', () => {
    expect(beatsWall()).toBe(false);
  });
});

describe('lane L4 words: the worker is on, the governor is release 65\'s', () => {
  it('?alphathumb= is on unless it says off or exact', () => {
    for (const s of [...NOTHING, '?alphathumb=nonsense', '?alphathumb=on']) expect(alphaThumbWord(s)).toBe('on');
    expect(alphaThumbWord('?alphathumb=off')).toBe('off');
    expect(alphaThumbWord('?alphathumb=exact')).toBe('exact');
  });
  it('?govern=fixed is off with nothing and with the older words', () => {
    for (const s of [...NOTHING, '?govern=on', '?govern=off', '?govern=today', undefined]) expect(governFixed(s)).toBe(false);
    expect(governFixed('?govern=fixed')).toBe(true);
  });
});
