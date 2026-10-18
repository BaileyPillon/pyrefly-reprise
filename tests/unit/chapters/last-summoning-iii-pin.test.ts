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
 * `BEFORE` read exactly. `BEFORE` stays as the record of the hidden chapter's own proof (its lane changed nothing of Chapter III); `RELEASE_52` is `BEFORE` with the three rows the Overdrive lane moved.
 *
 * **Release 53 (2026-10-17): all twelve seeds moved, and why.** Release 53 merges RC10's FFX hit-order lane (`docs/handoff/re-parity-rc10-ffx-hit-order.md`, FFX only), which makes a group command draw its variance,
 * critical-hit and status rolls for the targets in the game's SLOT order (Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku, then the aeons, then the monsters) where the engine drew them in the party's formation
 * order, and lands an action's hits round by round. Chapter III's links open with Blade Blitz at the party: the base calculates Lulu first (formation order), the tip Yuna first (slot 1), and every draw after it
 * is dealt to a different character (that handoff's section 5.1 lists Chapter III as 0 of 12 identical logs). Every seed's first link reads differently (and some later links, not all), **and no
 * outcome moved**: seed 3 is still the defeat on link 1, the eleven others are still seven-link victories over the same seven formations. **Proved by ablation on the release 53 tree:** with
 * `HIT_CALC_SLOT_ORDER`, `HIT_ORDER_ROUND_ROBIN` and `DRAIN_RECOIL_ONE_RECORD` (`src/battle/ffx/hit-order.ts`, the lane's three rollback switches) all put to false, all twelve rows of `RELEASE_52` read exactly
 * (14 of 14 tests of this file as they stood passed; the switches were then put back). `RELEASE_53` is what Chapter III reads on the release 53 tree, and it stays as the record with the two tables before it.
 *
 * **Boss data ON (2026-10-17, FFX only): eleven of the twelve seeds moved, and why.** Bailey chose "All six (Recommended)" for RC10's boss-data switches (`src/battle/ffx/boss-data-corrections.ts`,
 * `docs/handoff/re-parity-rc10-ffx-boss-data.md` section 11), and Chapter III's rows are among those the game's records correct: the Yu Pagodas' and Yu Yevon's Defence (and Yu Yevon's Magic Defence) are
 * 1 in the game where the rows read 0, so each blow or spell on them lands about 0.7 percent weaker, which shifts a few damage numbers by a point and the rolls after them (D1). Seed 3, the defeat on its first
 * link, is the one seed it does not reach; the other eleven change in some links only (2 to 5 of the 7), and **no outcome, no number of links and no formation moved**. **Proved by ablation on this tree:** with all six
 * switches false all twelve rows of `RELEASE_53` read exactly; with D1 alone on, the twelve rows of `NOW` read (equal to all six on); with D3, D7, D8, D9 and D10 on and D1 off, or each of the five alone, all twelve
 * rows of `RELEASE_53` read (the five move no digest of this chain). `NOW` is what Chapter III reads with the switches as shipped, and it is what the test asserts.
 */

import { describe, expect, it } from 'vitest';
import { chapterChainDigest, sha16 } from '../helpers/ffxChainDigest.ts';
import { setBossDataSwitches } from '../../../src/battle/ffx/boss-data-corrections.ts';

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

/** What Chapter III read on the release 52 tree: `BEFORE`, with the three moved rows. */
const RELEASE_52: Readonly<Record<number, string>> = { ...BEFORE, ...MOVED_BY_THE_OVERDRIVE_LANE };

/** What Chapter III reads on the release 53 tree: the twelve rows RC10's hit-order lane moved (see the header; read from the release 53 tree's own run, whole-table digest 1a75c7ad63ce11ae). */
const RELEASE_53: Readonly<Record<number, string>> = {
  1: 'd6afd80f44b44e89:victory b4fc81c50ae62729:victory 2dc0c7f818b45e95:victory cb98eaa0075d2b13:victory a86a95e34b022c08:victory 20a7bd6936260852:victory c4097e732b6b791c:victory',
  2: 'a3935a1059d729c7:victory d78d1085e1a1318e:victory 51b493eeb8cda593:victory fa524ab719904f7d:victory 8ebf250428d2f4c3:victory 3b61e63950439088:victory e42029a56c95e6ed:victory',
  3: 'ec1cfe8a7902e35b:defeat',
  4: '02ae5c9551851e1e:victory 166e3e5547aec6c9:victory f40b89c343eae51b:victory bcb6bd6352700875:victory 54ea68bce6287b56:victory cc271eecab3d1551:victory 28fcb2a12f98770a:victory',
  5: '812493cca3351f56:victory bd7077dba11b74ee:victory ecdadf9baca3ae60:victory 5d925e96b17cfe18:victory 5f04420cf1016666:victory e4c08c00ba4d21c8:victory 5283ed30d06a2c5b:victory',
  6: '24d41f9769be1bb8:victory 1b40c0095668f813:victory 29e5cc43dd10a0d0:victory 12f28c455a9fdf3b:victory 1907ff16135dd7fb:victory 24568f6745a03ef7:victory a84fac33e3fb712f:victory',
  7: 'f24212315fbf4c99:victory 9eba2aff8f421263:victory 2fece7f57db94e10:victory e2c3b86889b033db:victory 086ee62380266d4d:victory a8b4fdbf7def1c90:victory 97c561b3f10984ac:victory',
  8: 'c75777b90c959ba7:victory 8d6fd9ccb549b223:victory b91e9db7951a26d1:victory ddd891f318b3f6ed:victory 66847ee8a31b1665:victory bb3bf3ade6f68756:victory 188fccc652499ab6:victory',
  9: 'dec0a5dae07a1321:victory c452237cfab21fbd:victory 3e8f27661817a6a2:victory da0da26264b54623:victory af16f6bad20c29fd:victory 47a8c9cd87623062:victory 726b46d5bead7ff1:victory',
  10: '9c1db34fb251a176:victory 6868bb4184b59fcd:victory 83e7542cbd7b0027:victory f2c44334b77f7df6:victory 4ca258ae2cdbffd9:victory 90f9534f94fd4170:victory 9aeeebd60b479091:victory',
  11: '92893773947efa83:victory 960bd8a3bd295aa3:victory 7e079e1c4f10ba2a:victory bc62766350792449:victory 1f34d8063ffae9e4:victory a698d76089fa4ddc:victory 0607123504460421:victory',
  12: 'd46c6b0c17faa02b:victory 13a83e344bdf871b:victory 7021e2cb56f5d0d2:victory 856e1e08ccdd0a97:victory 04849d7981dd60de:victory f22d2035c505f2a7:victory 9f161768c3431625:victory',
};

/** What Chapter III reads with RC10's six boss-data switches ON, as shipped from 2026-10-17 (see the header; the tree's own run, whole-table digest 81dec25351f5f13d). */
const NOW: Readonly<Record<number, string>> = {
  1: 'd6afd80f44b44e89:victory 4e98fd050e16dac8:victory 2dc0c7f818b45e95:victory 90ade832106931e0:victory 2987f2e3d55cc77f:victory 6ef0a57dfbd781c5:victory 379d7ba6ebd259e1:victory',
  2: 'a3935a1059d729c7:victory d78d1085e1a1318e:victory 51b493eeb8cda593:victory 6f0ddfd428656cac:victory 8ebf250428d2f4c3:victory b1cf0297d86a7b6e:victory 09465941cf26372e:victory',
  3: 'ec1cfe8a7902e35b:defeat',
  4: '02ae5c9551851e1e:victory 166e3e5547aec6c9:victory 78019427dee0ad12:victory bcb6bd6352700875:victory 54ea68bce6287b56:victory cc271eecab3d1551:victory e73427c44ca8aeea:victory',
  5: '812493cca3351f56:victory 9d302c70796b09d9:victory ecdadf9baca3ae60:victory 5d925e96b17cfe18:victory 5f04420cf1016666:victory 784495c3a1e2affc:victory bb6a8441b7d98d30:victory',
  6: '24d41f9769be1bb8:victory 1b40c0095668f813:victory 29e5cc43dd10a0d0:victory 12f28c455a9fdf3b:victory 1907ff16135dd7fb:victory d78629d45c7460bc:victory ed6b09eddb546b6a:victory',
  7: 'f24212315fbf4c99:victory 9eba2aff8f421263:victory 2fece7f57db94e10:victory acced37bd78148ba:victory 4f65ccc35f5d07e2:victory a48acabd30ccf5ae:victory c5309ef62ac68d91:victory',
  8: 'c75777b90c959ba7:victory 8d6fd9ccb549b223:victory b91e9db7951a26d1:victory ddd891f318b3f6ed:victory 97e4264cd4ecb159:victory 17e396b39edecf89:victory 251cbae0d40b6659:victory',
  9: 'dec0a5dae07a1321:victory c452237cfab21fbd:victory 3e8f27661817a6a2:victory da0da26264b54623:victory af16f6bad20c29fd:victory 69221e0133278902:victory b79f8fcb957e4946:victory',
  10: '9c1db34fb251a176:victory 6868bb4184b59fcd:victory 83e7542cbd7b0027:victory f2c44334b77f7df6:victory 4ca258ae2cdbffd9:victory 057277854d984c81:victory aa7949c4509a1b3c:victory',
  11: '92893773947efa83:victory 528b5c101138d977:victory 7e079e1c4f10ba2a:victory bc62766350792449:victory 1f34d8063ffae9e4:victory 2e675b176069bcf9:victory a5466bb391091dd1:victory',
  12: 'd46c6b0c17faa02b:victory 13a83e344bdf871b:victory 7021e2cb56f5d0d2:victory 856e1e08ccdd0a97:victory 04849d7981dd60de:victory 85d1456ff1555c09:victory 7eec9c0c2cf3136f:victory',
};

/** Play the twelve seeds of Chapter III under a switch set and put the switches back. */
async function playTwelve(on: Parameters<typeof setBossDataSwitches>[0]): Promise<string[]> {
  const restore = setBossDataSwitches(on);
  try {
    const out: string[] = [];
    for (let seed = 1; seed <= 12; seed++) out.push((await chapterChainDigest('braskas-final-aeon', seed)).parts.join(' '));
    return out;
  } finally {
    restore();
  }
}

const ALL_FALSE = { D1: false, D3: false, D7: false, D8: false, D9: false, D10: false };

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
        expect(RELEASE_52[seed], `seed ${seed}`).toBe(BEFORE[seed]);
        continue;
      }
      const before = BEFORE[seed]!.split(' ');
      const after = moved.split(' ');
      expect(after.length, `seed ${seed}`).toBe(before.length);
      expect(after.map((p) => p.split(':')[1]), `seed ${seed}: every outcome is the same`).toEqual(before.map((p) => p.split(':')[1]));
      expect(after.filter((p, i) => p !== before[i]).length, `seed ${seed}: some links moved`).toBeGreaterThan(0);
    }
  });

  it("release 53: every one of the twelve seeds moved (RC10's hit order), none in its outcome, its number of links or the formations fought", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const before = RELEASE_52[seed]!.split(' ');
      const after = RELEASE_53[seed]!.split(' ');
      expect(after.length, `seed ${seed}: the same number of links`).toBe(before.length);
      expect(after.map((p) => p.split(':')[1]), `seed ${seed}: every outcome is the same`).toEqual(before.map((p) => p.split(':')[1]));
      expect(after[0], `seed ${seed}: the first link moved`).not.toBe(before[0]);
    }
    expect(Object.values(RELEASE_53).filter((row) => row.endsWith(':defeat'))).toEqual([RELEASE_53[3]]); // seed 3 is the only defeat, as it was
  });

  it('boss data ON: eleven of the twelve seeds moved (D1, the Defence floors), none in its outcome, its number of links or the formations; seed 3, the defeat on link 1, did not', () => {
    const moved: number[] = [];
    for (let seed = 1; seed <= 12; seed++) {
      const before = RELEASE_53[seed]!.split(' ');
      const after = NOW[seed]!.split(' ');
      expect(after.length, `seed ${seed}: the same number of links`).toBe(before.length);
      expect(after.map((p) => p.split(':')[1]), `seed ${seed}: every outcome is the same`).toEqual(before.map((p) => p.split(':')[1]));
      if (NOW[seed] !== RELEASE_53[seed]) moved.push(seed);
    }
    expect(moved).toEqual([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(Object.values(NOW).filter((row) => row.endsWith(':defeat'))).toEqual([NOW[3]]);
  });

  it('the off-state proof: with all six boss-data switches false, Chapter III reads release 53 exactly; with the five that are not D1 on and D1 off, too (they move no digest of this chain)', async () => {
    const off = await playTwelve(ALL_FALSE);
    const allButD1 = await playTwelve({ ...ALL_FALSE, D3: true, D7: true, D8: true, D9: true, D10: true });
    for (let seed = 1; seed <= 12; seed++) {
      expect(off[seed - 1], `seed ${seed}: all six off`).toBe(RELEASE_53[seed]);
      expect(allButD1[seed - 1], `seed ${seed}: D3, D7, D8, D9, D10 on`).toBe(RELEASE_53[seed]);
    }
  }, 120_000);

  it('the whole BEFORE table, as one digest: a26660257ba2716c; release 52: 29cff1931cbb6349; the whole RELEASE_53 table: 1a75c7ad63ce11ae; and the whole NOW table (boss data ON): 81dec25351f5f13d', () => {
    // The twelve rows of the table, `seed=row`, joined by newlines and hashed: the single value the handoff quotes. The literal was computed from the
    // BEFORE run's own output, not from this file, so a typo in a row above cannot hide behind it.
    const lines: string[] = [];
    for (let seed = 1; seed <= 12; seed++) lines.push(`${seed}=${BEFORE[seed]}`);
    expect(sha16(lines.join('\n'))).toBe('a26660257ba2716c');
    const r52: string[] = [];
    for (let seed = 1; seed <= 12; seed++) r52.push(`${seed}=${RELEASE_52[seed]}`);
    expect(sha16(r52.join('\n'))).toBe('29cff1931cbb6349');
    const r53: string[] = [];
    for (let seed = 1; seed <= 12; seed++) r53.push(`${seed}=${RELEASE_53[seed]}`);
    expect(sha16(r53.join('\n'))).toBe('1a75c7ad63ce11ae'); // from the run's own output (the print before this table was pasted), not from the rows above
    const now: string[] = [];
    for (let seed = 1; seed <= 12; seed++) now.push(`${seed}=${NOW[seed]}`);
    expect(sha16(now.join('\n'))).toBe('81dec25351f5f13d'); // from the scratch run's own output, not from the rows above
  });
});
