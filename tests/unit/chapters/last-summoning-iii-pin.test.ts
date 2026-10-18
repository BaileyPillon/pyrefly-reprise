/**
 * **Chapter III is byte for byte what it was** (the hidden chapter 28, The Last Summoning; **FFX only**; decision D-651: "Chapter III itself stays UNCHANGED").
 *
 * The hidden chapter is built on Chapter III's data (Braska's Final Aeon, the Yu Pagodas, the possessed aeons, Yu Yevon, the Dream's End preset) and on
 * the engine, and it fixes records the shipped chain never reaches (the possessed Yojimbo's and Magus Sisters' moves). This file pins Chapter III's whole
 * chain on **twelve seeds**: the chapter's own line (`intendedStrategy`) plays every link on the real engine and the full event log of each link is hashed
 * (SHA-256, 16 hex characters; `helpers/ffxChainDigest.ts`), then the outcome.
 *
 * **Recorded BEFORE any change of this lane**, on the merged tree (origin/r49-rc f939b87f2 + the research note e109fda7a + the RE session's engine
 * 05b77e62c and f081ec1a1, tip 6e1e211b1). The chain uses only the five mandatory aeons (`possessedAeonGroups`), so it never builds the possessed
 * Yojimbo, Anima or the Sisters. The same file passes **AFTER** the record fixes, the chain builder, the offering screen and the rest (the run is in
 * `docs/handoff/ch-last-summoning.md`). A digest that moves is a change of Chapter III to explain, never a number to re-pin.
 *
 * Eleven seeds are a seven-link victory; seed 3 is a defeat on link 1 (the line is not tuned, and nothing here is a balance measurement).
 *
 * **Release 52 (2026-10-17): three seeds moved, and why.** On the release tree, where this lane meets release 51's re-parity lanes, seeds 1, 2 and 4 read differently (seed 1 link 4, seed 2 links 5 and 6,
 * seed 4 link 3; the nine other seeds and every outcome are unchanged). The cause is not the hidden chapter: it is release 51's Overdrive lane (FFX only, `docs/handoff/re-parity-rc9-ffx-overdrives.md`
 * section 5, which names exactly these seeds), which gave Energy Rain the game's limit of 3 s where the engine had 2.6 s. The line rolls Tidus's Swordplay from a stand-in (one draw for the 75 percent
 * test and, on a success, one draw for the time left); the draws are the same and in the same order, and the time left is read against 3,000 instead of 2,600, so the timing bonus differs by a point or two
 * in a few of Tidus's Energy Rains. **Proved by ablation on the release tree:** with Energy Rain's limit put back to 2.6 s (`kernel/minigame-swordplay.ts`, one number, then restored) all twelve rows of
 * `BEFORE` read exactly. `BEFORE` stays as the record of the hidden chapter's own proof (its lane changed nothing of Chapter III); `NOW` is `BEFORE` with the three rows the Overdrive lane moved, and it is
 * what the test asserts.
 */

import { describe, expect, it } from 'vitest';
import { chapterChainDigest, sha16 } from '../helpers/ffxChainDigest.ts';

const GROUPS = ['braskas-final-aeon', 'possessed-valefor', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-bahamut', 'yu-yevon'];

/** Seed -> the digest of each link, `hash:outcome`, as recorded before this lane changed anything. */
const BEFORE: Readonly<Record<number, string>> = {
  1: '5e08fe33bd187ede:victory f0e86d618825163a:victory 2dc0c7f818b45e95:victory 349b30dac49da1e1:victory a86a95e34b022c08:victory 20a7bd6936260852:victory c4097e732b6b791c:victory',
  2: 'bd8cbfcdeab752da:victory e9bceaec425b412e:victory 8142c90eaed125fc:victory 80a5fe45f7539ce7:victory 5aa5dd7746b02414:victory 5989a88d2a33130c:victory 39affba4f9c2f836:victory',
  3: '8d92043f2f076a1e:defeat',
  4: '065c748c513f4911:victory 166e3e5547aec6c9:victory 3c6ccd36414a39e6:victory d86f7a5a47c46d5a:victory 67f9e95b4dbd65d9:victory 802793ded5736938:victory d9e1a30e1f1d9d9b:victory',
  5: '9c7eb17751b0f799:victory bd7077dba11b74ee:victory ecdadf9baca3ae60:victory 5d925e96b17cfe18:victory 5f04420cf1016666:victory 393abe835eedbd2a:victory 5283ed30d06a2c5b:victory',
  6: '73ebd47891dff469:victory 1b40c0095668f813:victory 29e5cc43dd10a0d0:victory 12f28c455a9fdf3b:victory eed5b7ea7aaf4701:victory 99e15fc48f0e3da2:victory 6e345f3c483eb2cf:victory',
  7: 'f4c0d7aa14e8f9ec:victory 9eba2aff8f421263:victory 2fece7f57db94e10:victory e2c3b86889b033db:victory 086ee62380266d4d:victory a8b4fdbf7def1c90:victory 97c561b3f10984ac:victory',
  8: 'c14693ee92c20ba9:victory 3a2d183b592c2989:victory af45a3e7b1d0d642:victory 334eebb7902c7b85:victory 3986348dbad44aa2:victory c6351d922f7b13e3:victory 6a543d4f77226d6e:victory',
  9: '5f72f0f727bd8100:victory c452237cfab21fbd:victory 3e8f27661817a6a2:victory da0da26264b54623:victory af16f6bad20c29fd:victory 3a7f4cd60ec9ff0e:victory 08be0ac0b6d3b9f6:victory',
  10: 'c3becee2ab37a675:victory 6868bb4184b59fcd:victory 83e7542cbd7b0027:victory f2c44334b77f7df6:victory 4ca258ae2cdbffd9:victory 6a031d854661bdae:victory 1cc03d29aea29637:victory',
  11: '12e8eab6856905e5:victory 204ce622e0003b7a:victory f6aba660b1ee5b4c:victory 2a6f32717cc91d56:victory 1f34d8063ffae9e4:victory a698d76089fa4ddc:victory 3679603921a72544:victory',
  12: '660ec7f50c52d4fd:victory 13a83e344bdf871b:victory 7021e2cb56f5d0d2:victory 856e1e08ccdd0a97:victory 04849d7981dd60de:victory f22d2035c505f2a7:victory 9f161768c3431625:victory',
};

/** The three rows release 51's Overdrive lane moved (Energy Rain's limit 3 s; see the header). Read from the release tree's own run: the links that moved are the fourth (seed 1), the fifth and sixth (seed 2) and the third (seed 4). */
const MOVED_BY_THE_OVERDRIVE_LANE: Readonly<Record<number, string>> = {
  1: '5e08fe33bd187ede:victory f0e86d618825163a:victory 2dc0c7f818b45e95:victory 6887836c3abc9435:victory a86a95e34b022c08:victory 20a7bd6936260852:victory c4097e732b6b791c:victory',
  2: 'bd8cbfcdeab752da:victory e9bceaec425b412e:victory 8142c90eaed125fc:victory 80a5fe45f7539ce7:victory 509418dc428d0c4b:victory 118c4d9e7178e71e:victory 39affba4f9c2f836:victory',
  4: '065c748c513f4911:victory 166e3e5547aec6c9:victory 23499ef516629772:victory d86f7a5a47c46d5a:victory 67f9e95b4dbd65d9:victory 802793ded5736938:victory d9e1a30e1f1d9d9b:victory',
};

/** What Chapter III reads on the release tree: `BEFORE`, with the three moved rows. */
const NOW: Readonly<Record<number, string>> = { ...BEFORE, ...MOVED_BY_THE_OVERDRIVE_LANE };

describe("Chapter III, twelve seeds, byte for byte (the hidden Last Summoning must not move it)", () => {
  for (let seed = 1; seed <= 12; seed++) {
    it(`seed ${seed}: every link's log digest and outcome`, async () => {
      const got = await chapterChainDigest('braskas-final-aeon', seed);
      expect(got.parts.join(' ')).toBe(NOW[seed]);
      // The formations fought are the shipped chain's, five aeons and no Anima, Yojimbo or Sister.
      expect(got.groups).toEqual(GROUPS.slice(0, got.parts.length));
    }, 60_000);
  }

  it("the nine seeds the Overdrive lane did not touch are BEFORE's rows, and the three it moved differ in some links only, never in an outcome", () => {
    expect(Object.keys(MOVED_BY_THE_OVERDRIVE_LANE).map(Number)).toEqual([1, 2, 4]);
    for (let seed = 1; seed <= 12; seed++) {
      const moved = MOVED_BY_THE_OVERDRIVE_LANE[seed];
      if (moved === undefined) {
        expect(NOW[seed], `seed ${seed}`).toBe(BEFORE[seed]);
        continue;
      }
      const before = BEFORE[seed]!.split(' ');
      const after = moved.split(' ');
      expect(after.length, `seed ${seed}`).toBe(before.length);
      expect(after.map((p) => p.split(':')[1]), `seed ${seed}: every outcome is the same`).toEqual(before.map((p) => p.split(':')[1]));
      expect(after.filter((p, i) => p !== before[i]).length, `seed ${seed}: some links moved`).toBeGreaterThan(0);
    }
  });

  it('the whole BEFORE table, as one digest: a26660257ba2716c; and the whole NOW table: 29cff1931cbb6349', () => {
    // The twelve rows of the table, `seed=row`, joined by newlines and hashed: the single value the handoff quotes. The literal was computed from the
    // BEFORE run's own output, not from this file, so a typo in a row above cannot hide behind it.
    const lines: string[] = [];
    for (let seed = 1; seed <= 12; seed++) lines.push(`${seed}=${BEFORE[seed]}`);
    expect(sha16(lines.join('\n'))).toBe('a26660257ba2716c');
    const now: string[] = [];
    for (let seed = 1; seed <= 12; seed++) now.push(`${seed}=${NOW[seed]}`);
    expect(sha16(now.join('\n'))).toBe('29cff1931cbb6349');
  });
});
