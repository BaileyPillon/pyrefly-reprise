/**
 * Release 66 (the motion-fluidity pass, lanes L1 to L5 merged): every address word the five lanes added read release 65's look when the address said nothing, and when it said something the word
 * did not know. One place to read the table; each lane's own test file pins the same words in depth (named beside each row).
 *
 * **Release 67 moved three of them to Bailey's picks** (the driver's call under his delegation, 2026-10-28): `?stance` reads `v1a`, `?swapcause` reads `pick` and `?hit` reads `knock`; **and message 2's
 * two lane L2 picks: `?run` reads `flow` and `?rigko` reads `whole`** (plus `?curves`, an older word, which reads `real-snappy` in the pack: `motion-core-curves`, `release67-picks`). This file pins those
 * five at the new defaults; `today` is still a word on each and is release 66's look (`release67-picks.test.ts` pins that `?stance=today&swapcause=today&hit=today` gives release 66's defaults, and where
 * each pick plays). Every other row below is unchanged.
 *
 * | word | default (nothing in the address) | lane test |
 * |---|---|---|
 * | `?interlude=` | `all` (A, on: a girl keeps `ready` into her spell or item; `attack` is release 65's hold) | ffx2-interlude |
 * | `?stance=` `?swapcause=` `?swapclass=` `?swapscope=` | **`v1a`, `pick`** (release 67; `today` on a page with the pack off), every class, `pack` | fluidity-swaps-actor, ffx2-stance, release67-picks |
 * | `?hit=` | **`knock`** (release 67; `today` is release 66's) | mf03, release67-picks |
 * | `?run=` `?rigko=` | **`flow`, `whole`** (release 67; `today` is release 66's) | mf04-run-ease, mf11-rig-handoff, release67-picks |
 * | `?kotopple=` `?hurtstring=` `?summon=` `?ramps=` `?shakeband=` `?strikeshape=` | `today` | mf09 to mf27, mf12, mf14 |
 * | `?atbbars=` `?ctbslide=` `?gridease=` `?triggerhappy=` (and `?fluidui=`) | off | atb-live, ctb-slide, trigger-happy-smooth |
 * | `?beats=` | the frame clock (A, on; `wall` is release 65's `setTimeout` waits) | beat-clock |
 * | `?alphathumb=` | `on` (A; `off` is release 64/65's reading, `exact` keeps only the exact breathing field) | alpha-thumb |
 * | `?govern=fixed` | off (B; release 65's reading) | governor-fixed-reading |
 *
 * Game case: both (the table is shared plumbing; each word's own game is in the handoff notes and the CHANGELOG entry). Pure: no DOM, no `three`.
 */
import { describe, expect, it } from 'vitest';
import { MOVE_DEFAULTS, MOVE_WORDS, moveDefault, moveWordFromSearch, type MoveKey } from '../../src/engine/motion/MoveSwitch.ts';
import { CAUSE_DEFAULT, causeFromSearch, classesFromSearch, interludeFromSearch, SWAP_CLASSES, scopeFromSearch, STANCE_DEFAULT, stanceFromSearch } from '../../src/engine/motion/SwapSwitch.ts';
import { fluidWord } from '../../src/ui/common/fluidUi.ts';
import { beatsWall } from '../../src/engine/BeatClock.ts';
import { alphaThumbWord } from '../../src/engine/look/AlphaThumb.ts';
import { governFixed } from '../../src/engine/governor/DemoGovernor.ts';

const NOTHING = ['', '?', '?nonsense=1', '?x=y&z=w'];

/** Release 67: the three lane L2 words that are not today by default (`hit` from message 1, `run` and `rigko` from message 2). */
const PICKED: Partial<Record<MoveKey, string>> = { hit: 'knock', run: 'flow', rigko: 'whole' };

describe('lane L2 words: every one reads its default (today, but for the release 67 picks `hit=knock`, `run=flow`, `rigko=whole`) when the address does not name one of its values', () => {
  for (const key of Object.keys(MOVE_WORDS) as MoveKey[]) {
    const want = PICKED[key] ?? 'today';
    it(`?${key}= is '${want}' with no word, an empty word, or a word it does not know`, () => {
      expect(MOVE_WORDS[key][0]).toBe('today'); // today stays the first listed value, a word of its own
      expect(moveDefault(key)).toBe(want);
      for (const s of [...NOTHING, `?${key}=`, `?${key}=nonsense`, undefined]) expect(moveWordFromSearch(s, key)).toBe(want);
      expect(moveWordFromSearch(`?${key}=today`, key)).toBe('today'); // and the word today is release 66's look, always
    });
    it(`?${key}= reads each of its listed values`, () => {
      for (const v of MOVE_WORDS[key]) expect(moveWordFromSearch(`?${key}=${v}`, key)).toBe(v);
    });
  }
  it('has exactly the nine words the handoff lists, and exactly three picks among them', () => {
    expect(Object.keys(MOVE_WORDS).sort()).toEqual(['hit', 'hurtstring', 'kotopple', 'ramps', 'rigko', 'run', 'shakeband', 'strikeshape', 'summon']);
    expect(MOVE_DEFAULTS).toEqual({ hit: 'knock', run: 'flow', rigko: 'whole' });
  });
});

describe('lane L1 words: the interlude is on, the looks are the release 67 picks', () => {
  it('?interlude= is all (post-flicker\'s hold extended to spells and items) unless it says attack', () => {
    for (const s of [...NOTHING, '?interlude=nonsense', undefined]) expect(interludeFromSearch(s)).toBe('all');
    expect(interludeFromSearch('?interlude=attack')).toBe('attack');
  });
  it('?stance= is v1a and ?swapcause= is pick with nothing and with a word that is not theirs; with no page at all (a test, a tool), or the pack off, they are today', () => {
    expect([STANCE_DEFAULT, CAUSE_DEFAULT]).toEqual(['v1a', 'pick']);
    for (const s of [...NOTHING, '?stance=nonsense', '?swapcause=nonsense']) {
      expect(stanceFromSearch(s)).toBe('v1a');
      expect(causeFromSearch(s)).toBe('pick');
    }
    for (const s of [undefined, '?pack=off', '?pack=today', '?pack=off&stance=v1b&swapcause=cut']) {
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
