/**
 * Parity tests for the FFX battle RNG kernel (`src/battle/ffx/kernel/rng.ts`): the tables, one draw, the
 * stream index and the New Game seeding. (The Escape and start-type rolls are in `parity-ffx-rolls.test.ts`.)
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D; functions
 * 0x007988f0 (draw), 0x0078d210 (stream index), 0x00798890 / 0x007989a0 / 0x00798950 (New Game seeding).
 * Spec: `research/re-ffx-rng-hit.md`.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comments of the first block;
 * - the independent Python restatement `D:\Tools\ffx-parity\ffx\data\rng_ref.py` (outside the repo),
 *   run on 2026-10-08 for the vector tables below;
 * - emulator golden vectors, later: the last block loads `tests/fixtures/parity/ffx/rng_next.json` when it
 *   exists (see `helpers/ffxParityFixture.ts`) and is skipped until then.
 */

import { describe, expect, it } from 'vitest';
import {
  FfxBattleRng,
  RNG_MULT,
  RNG_STREAM_COUNT,
  RNG_XOR16,
  RngMode,
  isMonsterChrId,
  rngNextState,
  rngOutput,
  rngStreamIndex,
  seedLcgNext,
  seedProduct,
  seedStates,
  timeByteXorPlusOne,
} from '../../src/battle/ffx/kernel/rng.ts';
import { expandVectorInput, loadFfxParityFixture } from './helpers/ffxParityFixture.ts';

describe('FFX RNG tables (exe 0x00c42208 and 0x00c42318)', () => {
  it('has 68 streams, each with a u32 multiplier and a u16 xor word', () => {
    expect(RNG_STREAM_COUNT).toBe(68);
    expect(RNG_MULT).toHaveLength(68);
    expect(RNG_XOR16).toHaveLength(68);
    for (const m of RNG_MULT) expect(m >= 0 && m <= 0xffffffff && Number.isInteger(m)).toBe(true);
    for (const x of RNG_XOR16) expect(x >= 0 && x <= 0xffff && Number.isInteger(x)).toBe(true);
  });

  it('matches the values read from the exe image (ends, the stream blocks, and two checksums)', () => {
    // First entries, the party/aeon/monster blocks' first streams, and the last entries.
    expect(RNG_MULT[0]).toBe(2100005341);
    expect(RNG_XOR16[0]).toBe(10259);
    expect(RNG_MULT[20]).toBe(3956199176);
    expect(RNG_XOR16[20]).toBe(574);
    expect(RNG_MULT[28]).toBe(904938180);
    expect(RNG_XOR16[28]).toBe(9373);
    expect(RNG_MULT[67]).toBe(706005400);
    expect(RNG_XOR16[67]).toBe(36458);
    // Sum and xor-fold of the whole tables, computed from the 2026-10-08 dump of the live image.
    expect(RNG_MULT.reduce((a, b) => a + b, 0)).toBe(133329159791);
    expect(RNG_XOR16.reduce((a, b) => a + b, 0)).toBe(2330264);
    expect(RNG_MULT.reduce((a, b) => (a ^ b) >>> 0, 0)).toBe(2823752009);
    expect(RNG_XOR16.reduce((a, b) => a ^ b, 0)).toBe(50378);
  });
});

describe('FFX RNG: one step, worked by hand (exe 0x007988f0)', () => {
  // state' = (int32(v) >> 16) + (v << 16) mod 2^32, v = (mult * state mod 2^32) ^ xor16; out = state' & 0x7fffffff.

  it('stream 20 from state 1: v is negative as an int32, so the shift right sign-extends', () => {
    // mult[20] = 3956199176 = 0xEBCECF08, xor16[20] = 574 = 0x023E, state = 1.
    // product = 0xEBCECF08;  v = 0xEBCECF08 ^ 0x023E = 0xEBCECD36 = -338768586 as int32.
    // v >> 16 (arithmetic) = floor(-338768586 / 65536) = -5170 = 0xFFFFEBCE;   v << 16 = 0xCD360000.
    // new state = 0xCD360000 + 0xFFFFEBCE mod 2^32 = 0xCD35EBCE = 3442863054.
    // output = 0xCD35EBCE & 0x7FFFFFFF = 0x4D35EBCE = 1295379406 (a logical shift would give 0xCD36EBCE instead).
    expect(rngNextState(20, 1)).toBe(0xcd35ebce);
    expect(rngNextState(20, 1)).toBe(3442863054);
    expect(rngOutput(rngNextState(20, 1))).toBe(1295379406);
  });

  it('stream 28 from state 0x80000000: an even multiplier wipes the product, v is positive', () => {
    // mult[28] = 904938180 is even, so mult * 2^31 mod 2^32 = 0.   v = 0 ^ 9373 = 0x249D.
    // v >> 16 = 0;  v << 16 = 0x249D0000 = 614268928.  new state = 614268928;  output = 614268928.
    expect(rngNextState(28, 0x80000000)).toBe(614268928);
    expect(rngOutput(614268928)).toBe(614268928);
  });

  it('stream 0 from state 0xFFFFFFFF (= -1): product is 2^32 - mult', () => {
    // mult[0] = 2100005341 = 0x7D2B89DD;  product = 2^32 - 2100005341 = 0x82D47623.
    // xor16[0] = 10259 = 0x2813;  v = 0x82D47623 ^ 0x2813 = 0x82D45E30 = -2100011472 as int32.
    // v >> 16 = -32044 = 0xFFFF82D4;  v << 16 = 0x5E300000;  new = 0x5E300000 + 0xFFFF82D4 = 0x5E2F82D4.
    expect(rngNextState(0, 0xffffffff)).toBe(0x5e2f82d4);
    expect(rngOutput(0x5e2f82d4)).toBe(1580171988);
  });

  it('stream 67 from state 0x10000: the new state has bit 31 set and the output drops it', () => {
    // mult[67] = 706005400, low 16 bits 0xC998;  state << 16 keeps only that:  product = 0xC9980000.
    // xor16[67] = 36458 = 0x8E6A;  v = 0xC9988E6A = -912748950;  v >> 16 = -13928 = 0xFFFFC998;  v << 16 = 0x8E6A0000.
    // new state = 0x8E6A0000 + 0xFFFFC998 = 0x8E69C998 = 2389297560;  output = 0x0E69C998 = 241813912.
    expect(rngNextState(67, 0x10000)).toBe(2389297560);
    expect(rngOutput(2389297560)).toBe(241813912);
  });

  it('draws advance only the drawn stream, and the state keeps all 32 bits', () => {
    const rng = new FfxBattleRng();
    rng.state[20] = 1;
    rng.state[28] = 1;
    expect(rng.next(20)).toBe(1295379406);
    expect(rng.state[20]).toBe(3442863054);
    expect(rng.state[28]).toBe(1);
    expect(rng.next(28)).toBe(1717122544);
    expect(rng.state[20]).toBe(3442863054);
  });

  it('refuses a stream outside 0..67 instead of reading past the tables', () => {
    expect(() => rngNextState(68, 1)).toThrow(RangeError);
    expect(() => rngNextState(-1, 1)).toThrow(RangeError);
    expect(() => new FfxBattleRng().next(68)).toThrow(RangeError);
  });

  it('clone is independent of the original', () => {
    const a = FfxBattleRng.fromSeedProduct(1);
    const b = a.clone();
    const first = a.next(5);
    expect(b.state[5]).toBe(seedStates(1)[5]); // drawing from `a` left the copy alone
    expect(b.next(5)).toBe(first); // and the copy replays the same value
  });
});

// Reference vectors from rng_ref.py: [stream, initial state of that stream, [first three outputs]].
const STEP_VECTORS: ReadonlyArray<readonly [number, number, readonly number[]]> = [
  [0, 0x00000001, [567180587, 957101431, 2124930595]],
  [0, 0x7fffffff, [1580204756, 1293352593, 1950214768]],
  [0, 0x80000000, [672301056, 672333432, 1300928699]],
  [0, 0xffffffff, [1580171988, 1293367715, 1420050501]],
  [0, 0x00003039, [170264715, 1793878976, 1825778946]],
  [2, 0x00000001, [1082003131, 597939871, 522215794]],
  [2, 0x7fffffff, [1065382212, 666171618, 1348904473]],
  [2, 0x80000000, [732463104, 732469251, 1076614737]],
  [2, 0xffffffff, [1065349444, 666190583, 1373079717]],
  [2, 0x00003039, [2037804019, 297510420, 2103753630]],
  [20, 0x00000001, [1295379406, 1917705502, 684589150]],
  [20, 0x7fffffff, [851842097, 1119222514, 128864341]],
  [20, 0x80000000, [37617664, 37630960, 767457552]],
  [20, 0xffffffff, [851842097, 1119222514, 128864341]],
  [20, 0x00003039, [452347869, 1943383715, 1076203277]],
  [27, 0x00000001, [453464635, 703798301, 8335976]],
  [27, 0x7fffffff, [1694150084, 1608548834, 1264913720]],
  [27, 0x80000000, [1662582784, 1662571758, 1627191817]],
  [27, 0xffffffff, [1694150084, 1608548834, 1264913720]],
  [27, 0x00003039, [1035374047, 1262171449, 397849250]],
  [28, 0x00000001, [1717122544, 257727797, 571014688]],
  [28, 0x7fffffff, [429967887, 903912514, 34951200]],
  [28, 0x80000000, [614268928, 614236724, 860698149]],
  [28, 0xffffffff, [429967887, 903912514, 34951200]],
  [28, 0x00003039, [960040707, 1624323934, 996503188]],
  [36, 0x00000001, [1752971363, 154515525, 2105521243]],
  [36, 0x7fffffff, [394413980, 860040071, 1522140134]],
  [36, 0x80000000, [720797696, 720822487, 675935528]],
  [36, 0xffffffff, [394381212, 859998785, 2042342376]],
  [36, 0x00003039, [1241787027, 690348566, 1191500381]],
  [43, 0x00000001, [87809308, 1633108194, 1548574711]],
  [43, 0x7fffffff, [2059510499, 477994363, 1434828385]],
  [43, 0x80000000, [83001344, 83047061, 2139633262]],
  [43, 0xffffffff, [2059543267, 478010978, 936174478]],
  [43, 0x00003039, [870552495, 494034067, 1764620082]],
  [44, 0x00000001, [975064218, 421021297, 176007839]],
  [44, 0x7fffffff, [1172419429, 1746300148, 576982782]],
  [44, 0x80000000, [1011613696, 1011619928, 1618733581]],
  [44, 0xffffffff, [1172419429, 1746300148, 576982782]],
  [44, 0x00003039, [1947076503, 1142024525, 887513645]],
  [52, 0x00000001, [445051713, 566700952, 41427824]],
  [52, 0x7fffffff, [1702399166, 1447173370, 975575382]],
  [52, 0x80000000, [315588608, 315596932, 1040957273]],
  [52, 0xffffffff, [1702431934, 1447158054, 557452453]],
  [52, 0x00003039, [965702439, 1217464019, 2070198652]],
  [59, 0x00000001, [900899933, 1695205884, 4760169]],
  [59, 0x7fffffff, [1246714786, 150302121, 585324610]],
  [59, 0x80000000, [1538326528, 1538344290, 2104787581]],
  [59, 0xffffffff, [1246714786, 150302121, 585324610]],
  [59, 0x00003039, [96679306, 1822777966, 1399641283]],
  [60, 0x00000001, [1835083284, 257587620, 657060831]],
  [60, 0x7fffffff, [312433131, 724220673, 2053179688]],
  [60, 0x80000000, [1477804032, 1477813630, 1535369706]],
  [60, 0xffffffff, [312400363, 724262982, 1721509299]],
  [60, 0x00003039, [1869175970, 1096257824, 1307992016]],
  [67, 0x00000001, [1207052820, 562719842, 1113203953]],
  [67, 0x7fffffff, [939644395, 149026408, 2074738881]],
  [67, 0x80000000, [241827840, 241813744, 820621395]],
  [67, 0xffffffff, [939644395, 149026408, 2074738881]],
  [67, 0x00003039, [1823622253, 1003600918, 2105179884]],
];

describe('FFX RNG: first three values of a stream, against the independent Python restatement', () => {
  it.each(STEP_VECTORS.map((v): [number, string, (typeof STEP_VECTORS)[number]] => [v[0], `0x${v[1].toString(16)}`, v]))(
    'stream %i from state %s',
    (_stream, _label, [stream, state, expected]) => {
      const rng = new FfxBattleRng();
      rng.state[stream] = state;
      expect([rng.next(stream), rng.next(stream), rng.next(stream)]).toEqual([...expected]);
    },
  );

  it('every output is below 2^31', () => {
    const rng = new FfxBattleRng(seedStates(12345));
    for (let i = 0; i < 2000; i++) expect(rng.next(i % RNG_STREAM_COUNT)).toBeLessThan(0x80000000);
  });
});

describe('FFX RNG stream index (exe 0x0078d210)', () => {
  it('maps party slots 0..7 to 20..27 for damage, 36..43 for hits, 52..59 for statuses', () => {
    for (let chr = 0; chr < 8; chr++) {
      expect(rngStreamIndex(chr, RngMode.Damage, false)).toBe(20 + chr);
      expect(rngStreamIndex(chr, RngMode.Hit, false)).toBe(36 + chr);
      expect(rngStreamIndex(chr, RngMode.Status, false)).toBe(52 + chr);
    }
  });

  it('maps monsters 0x14..0x1b to 28..35, 44..51, 60..67', () => {
    for (let slot = 0; slot < 8; slot++) {
      const chr = 0x14 + slot;
      expect(rngStreamIndex(chr, 0, false)).toBe(28 + slot);
      expect(rngStreamIndex(chr, 1, false)).toBe(44 + slot);
      expect(rngStreamIndex(chr, 2, false)).toBe(60 + slot);
    }
    expect(rngStreamIndex(0x1b, 2, false)).toBe(67); // the last stream
  });

  it('gives every aeon the shared streams 27, 43, 59, the same as party slot 7', () => {
    for (let chr = 8; chr <= 0x11; chr++) {
      expect(rngStreamIndex(chr, 0, true)).toBe(27);
      expect(rngStreamIndex(chr, 1, true)).toBe(43);
      expect(rngStreamIndex(chr, 2, true)).toBe(59);
    }
    expect(rngStreamIndex(7, 0, false)).toBe(27);
    expect(rngStreamIndex(7, 1, false)).toBe(43);
    expect(rngStreamIndex(7, 2, false)).toBe(59);
  });

  it('tests the monster range first, so the aeon bit never moves a monster', () => {
    expect(rngStreamIndex(0x14, 0, true)).toBe(28);
  });

  it('treats a mode other than 1 or 2 as mode 0 (the exe only tests for 1 and 2)', () => {
    expect(rngStreamIndex(0, 3, false)).toBe(20);
    expect(rngStreamIndex(0, -1, false)).toBe(20);
  });

  it('monster test: (id & 0xff) - 0x14 unsigned below 8', () => {
    expect(isMonsterChrId(0x13)).toBe(false);
    expect(isMonsterChrId(0x14)).toBe(true);
    expect(isMonsterChrId(0x1b)).toBe(true);
    expect(isMonsterChrId(0x1c)).toBe(false);
    expect(isMonsterChrId(0x114)).toBe(true); // only the low byte counts
    expect(isMonsterChrId(0)).toBe(false);
  });
});

// Reference seeds from rng_ref.py (seed_all): clockXor = pp_RngTimeByteXor result, arg = the New Game sum.
const SEED_VECTORS = [
  { clockXor: 1, arg: 0x0, product: 1, first8: [1520130368, 846530240, 636781782, 1453532456, 486314314, 1013376504, 520968374, 235052031], last4: [1458953160, 169673237, 1971164619, 239847337], sum: 69369757810,
    draws: { 0: [1683134623, 1884296367, 704658584], 20: [2079733621, 1419115951, 1816507554], 27: [1031461870, 922559822, 205341383], 28: [1129890370, 437598697, 1291384990], 36: [2035921081, 209965773, 1706566963], 52: [638000014, 1603402779, 402435174], 67: [858935286, 779715039, 1023523465] } },
  { clockXor: 256, arg: 0x0, product: 256, first8: [18461691, 121401637, 1993179647, 2060470097, 1512700861, 751145016, 172808832, 1890903797], last4: [1676883578, 2018969976, 546117051, 1476123070], sum: 79514346274,
    draws: { 0: [448560810, 2060500240, 1858293008], 20: [479060502, 1485684210, 531521472], 27: [605747342, 1404903596, 389064564], 28: [162588242, 1582624177, 957913405], 36: [1931684159, 163729430, 218443177], 52: [7371380, 800823995, 2136812911], 67: [2025466455, 2093117075, 472022463] } },
  { clockXor: 77, arg: 0x12345678, product: 2042495589, first8: [1858143411, 1205052476, 467697996, 53572583, 1666735833, 2060557557, 803093028, 946379934], last4: [1467173606, 720594743, 1374163194, 752318902], sum: 75700812162,
    draws: { 0: [1905531189, 936504126, 1788170374], 20: [1079358179, 640000509, 550909886], 27: [530875013, 1083097695, 742069995], 28: [1627969990, 1661254283, 217100550], 36: [1532622265, 931383741, 1768422056], 52: [155355196, 1051953464, 1893216033], 67: [611986616, 187319303, 1833060109] } },
  { clockXor: 1, arg: 0xffffffff, product: 0, first8: [1735662, 1528494989, 165038515, 13867031, 977820151, 1470656332, 1764845570, 1526648487], last4: [1023536904, 1650274636, 1932621480, 1149018033], sum: 76582603567,
    draws: { 0: [1919240745, 1584820227, 1703130545], 20: [1601563849, 1870029539, 640035154], 27: [2104829722, 638879897, 1526126591], 28: [1931275646, 1961186176, 1251829530], 36: [446242169, 407128199, 96066555], 52: [486331276, 1447281882, 616938229], 67: [1148323636, 344605548, 1514782071] } },
  { clockXor: 200, arg: 0x80000000, product: 200, first8: [887230939, 815550251, 1361830511, 1459585898, 587677081, 479330789, 1385030746, 834063848], last4: [2134280775, 1463296257, 1285134440, 1430080025], sum: 75942400544,
    draws: { 0: [890999168, 865274410, 1750166894], 20: [568168973, 290827643, 1659261933], 27: [1750791548, 126919692, 980461730], 28: [65618337, 1708719473, 135850601], 36: [2040615967, 2257477, 2139110616], 52: [1865705011, 1099267340, 1304711895], 67: [296853381, 764559386, 1998203186] } },
  { clockXor: 3, arg: 0x3e8, product: 3003, first8: [277542694, 1613970965, 561889061, 1020109597, 1436925866, 675769830, 2045968874, 193378650], last4: [1390806211, 2116260701, 1592133124, 1204378468], sum: 79871650676,
    draws: { 0: [433895324, 1438577920, 689102326], 20: [914208206, 1112391603, 950371193], 27: [825943837, 1316971130, 1498767473], 28: [1851566416, 1708961176, 1023219766], 36: [1441105196, 202567672, 291470606], 52: [1991077301, 1649582381, 1016820513], 67: [1225409567, 1191302656, 510284317] } },
] as const;

describe('FFX RNG New Game seeding (exe 0x00798890, 0x007989a0, 0x00798950)', () => {
  it('the seed LCG, worked by hand for k = 1', () => {
    // LCG word = k * 0x420c56d7 + 0x2e0a = 0x420C56D7 + 0x2E0A = 0x420C84E1.
    // Warm-up step: t = 0x420C84E1 * 0x5D588B65 + 0x3C35 mod 2^32 = 0x456ED3FA;  t >> 16 = 0x456E;
    //   t << 16 = 0xD3FA0000;  word = 0xD3FA456E (the call's result is thrown away).
    // First kept step: t = 0xD3FA456E * 0x5D588B65 + 0x3C35 mod 2^32 = 0x59405A9B;  t >> 16 = 0x5940;
    //   t << 16 = 0x5A9B0000;  word = 0x5A9B5940;  stream 0's state = word & 0x7FFFFFFF = 0x5A9B5940 = 1520130368.
    const word0 = (Math.imul(1, 0x420c56d7) + 0x2e0a) >>> 0;
    expect(word0).toBe(0x420c84e1);
    const warm = seedLcgNext(word0);
    expect(warm).toBe(0xd3fa456e);
    const first = seedLcgNext(warm);
    expect(first).toBe(0x5a9b5940);
    expect(seedStates(1)[0]).toBe(1520130368);
  });

  it('seedProduct is clockXor * (arg + 1) mod 2^32', () => {
    expect(seedProduct(1, 0)).toBe(1);
    expect(seedProduct(256, 0)).toBe(256);
    expect(seedProduct(1, 0xffffffff)).toBe(0); // arg + 1 wraps to 0
    expect(seedProduct(200, 0x80000000)).toBe(200); // 0x80000001 * 200 mod 2^32
    // 77 * 0x12345679 = 77 * 305419897 = 23517332069 = 5 * 2^32 + 2042495589.
    expect(seedProduct(77, 0x12345678)).toBe(2042495589);
    expect(seedProduct(3, 1000)).toBe(3003);
  });

  it('timeByteXorPlusOne XORs the eight clock bytes and adds one (1..256)', () => {
    expect(timeByteXorPlusOne([0, 0, 0, 0, 0, 0, 0, 0])).toBe(1);
    expect(timeByteXorPlusOne([1, 2, 3, 4, 5, 6, 7, 8])).toBe(9); // 1^2^3^4^5^6^7^8 = 8
    expect(timeByteXorPlusOne([0xff, 0xff, 0, 0, 0, 0, 0, 0])).toBe(1);
    expect(timeByteXorPlusOne([0xff, 0, 0, 0, 0, 0, 0, 0])).toBe(256);
  });

  it('fills all 68 states of seed product 1 exactly like the reference', () => {
    const states = seedStates(1);
    expect(states).toHaveLength(68);
    expect(Array.from(states.slice(0, 8))).toEqual(SEED_VECTORS[0].first8);
    expect(Array.from(states.slice(-4))).toEqual(SEED_VECTORS[0].last4);
  });

  it.each(SEED_VECTORS.map((s): [string, (typeof SEED_VECTORS)[number]] => [`clockXor ${s.clockXor}, arg 0x${s.arg.toString(16)}`, s]))(
    'seed %s: product, states and the first draws of seven streams',
    (_label, s) => {
      expect(seedProduct(s.clockXor, s.arg)).toBe(s.product);
      const states = seedStates(s.product);
      expect(Array.from(states.slice(0, 8))).toEqual([...s.first8]);
      expect(Array.from(states.slice(-4))).toEqual([...s.last4]);
      expect(states.reduce((a, b) => a + b, 0)).toBe(s.sum);
      expect(states.every((v) => v < 0x80000000)).toBe(true); // every seeded state is masked to 31 bits
      for (const [stream, expected] of Object.entries(s.draws)) {
        const rng = FfxBattleRng.fromSeedProduct(s.product);
        expect([rng.next(Number(stream)), rng.next(Number(stream)), rng.next(Number(stream))]).toEqual([...expected]);
      }
    },
  );

  it('nextFor draws the stream the game would pick for that character and purpose', () => {
    const a = FfxBattleRng.fromSeedProduct(1);
    const b = FfxBattleRng.fromSeedProduct(1);
    expect(a.nextFor(0x14, RngMode.Hit, false)).toBe(b.next(44));
    expect(a.nextFor(9, RngMode.Damage, true)).toBe(b.next(27));
  });
});

// ---------------------------------------------------------------------------------------------
// Golden vectors from the emulator harness: `tests/fixtures/parity/ffx/rng_next.json` (schema
// ffx-parity-vectors/1; function 0x007988f0 run as real machine code). The block is skipped until that file has
// been copied in. Vector shape, as the harness documents it:
//   in   { stream, state }  or, for a sequence, { stream, state, calls }   (state = the stream's state word)
//   out  { values: [...], states: [...] }    the return value and the stream's state after each call
// ---------------------------------------------------------------------------------------------
const golden = loadFfxParityFixture('rng_next');
describe.skipIf(golden === null)('golden vectors from the emulator harness (tests/fixtures/parity/ffx/rng_next.json)', () => {
  it('every vector matches pp_BtlRng: each returned value and each state after it', () => {
    for (const v of golden?.vectors ?? []) {
      const input = expandVectorInput(golden?.defaults ?? {}, v.in);
      const stream = Number(input['stream']);
      const calls = input['calls'] === undefined ? 1 : Number(input['calls']);
      const values = v.out['values'] as number[];
      const states = v.out['states'] as number[];
      expect(values, `vector ${v.id} (${v.class}) length`).toHaveLength(calls);
      const rng = new FfxBattleRng();
      rng.state[stream] = Number(input['state']);
      for (let i = 0; i < calls; i++) {
        expect(rng.next(stream), `vector ${v.id} (${v.class}) call ${i} value`).toBe(values[i]);
        expect(rng.state[stream], `vector ${v.id} (${v.class}) call ${i} state`).toBe(states[i]);
      }
    }
  });
});
