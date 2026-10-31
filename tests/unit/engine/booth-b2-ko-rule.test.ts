/**
 * THE KNOCK-OUT RULE, APPLIED TO BATCH 2 (release 70, branch `booth-b3`, the merge of `booth-b2` and `booth-leblanc`; Bailey 2026-10-30: the booth treatment for every selectable chapter; the driver's rule of 2026-10-31).
 *
 * THE RULE. The moments piece turns a party figure's hurt-to-KO swap into a hard cut (`PaintedActorLife.koCutWindow`: it needs `momentsOn()` AND `smearOn()`), and CHK-027 fails a hard cut whose swap jerk is over 0.5 of the figure's
 * drawn height (`critic/policy.json` `continuity.smear.maxJerkShare`), the largest cut a planned smear excuses. In every treated chapter beyond the booth pair the moments play only if every dress the player can field there reads
 * under 0.5 with the real actor's KO cut; otherwise the chapter holds `moments` with its reason and its "Lifts when" (a browser KO run per dress shows no unexcused swap jerk). The booth pair is the approved target and is not judged here.
 *
 * WHAT READS. The registration table cannot give the number (three lanes tried it; `docs/handoff/booth-ffx2-b3.md` section 4, `booth-ffx-b3a.md` section 3, `booth-ffx-b3b.md` section 4): it depends on where the lying body lies,
 * which is per stage. What reads is the harness's own swap jerk at the hurt-to-KO cut, taken in the page (`MEASURED` below: the r69-fix control runs `rikku-ko/` and the booth-leblanc `j4`, 1600 x 900). A dress with no read is NOT under
 * the cap: unknown is a hold. The offline instruments (`ko-step-tmp.py`, `ko-step-tmp.mjs`) under-read the measured FFX-2 dresses by 0.64 to 0.77 and rank them wrongly, so none of their numbers is used here.
 *
 * BATCH 2.
 *  - Chapter II (FFX only): `smear` is held (the swap exception's other half), so `smearOn()` is false and `koCutWindow()` is undefined: the KO is the plain cross whatever the moments do. The rule's trigger cannot occur; the moments play.
 *    Pinned below with the real actor, and as the one reason this chapter is allowed to play moments (`KO_CLEARED` is empty: a chapter that plays both pieces must be named there with its evidence).
 *  - Chapters V, XV and XI (FFX-2 only): all three field the Farplane build; the girls' Garment Grids hold Gunner and Thief beside the worn dress, and the harness read those paintings over the cap in Leblanc (Rikku Thief 0.61 to 0.63, Yuna
 *    Gunner 0.50 to 0.52); the other dresses have no read. They hold `moments`.
 *
 * THE r70 VERDICT PASS (2026-10-31, `docs/handoff/booth-b3.md` section 12) took Chapters V and XI back off the treated list (a clipped sky; FFX-2 only). Their holds stay in the table and the cases below still read them; the cases that need the
 *   chapter treated (the piece answers today's, the smear still plays, the real actor's KO) run while the chapter is listed and are skipped while it is not, so one line back on the list turns them back on.
 *
 * BATCH 3 AND THE REVIEW OF `booth-b3` (2026-10-31).
 *  - Chapter XIV (FFX only): the first merge let it play the cut on an estimate; the review's M1 held it to the rule as written (a dress with no read is not under the cap), so it holds `moments` (job J5 lifts it). Only Yuna could ever take
 *    the cut there: her five aeons are not toppling bodies (`KoFall.canTopple`), pinned below, and she is alone with no Switch, so the exposure was her own KO.
 *  - Trema and Leblanc (FFX-2 only) field Gunner and Thief on their grids too (review m3): pinned below beside Chapters V, XV and XI, and the approved Chapter IV (the booth pair, not changed by the rule) fields them as well.
 *  - The excuse CHK-027 really applies is the LARGER of `maxJerkPx` (120 px at 1600 wide) and half the drawn height (review m7), so the 0.5 share rule used here only ever over-holds a figure drawn under 240 px and never under-holds. A hold is
 *    lifted on pixels AND on share, as the harness judges it.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { reset, yuna } from './head-lock-fixture.ts';
import { canTopple, fallRun, koMode } from '../../../src/engine/KoFall.ts';
import type { KoFacts } from '../../../src/engine/KoFall.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, isTreatedChapter, setTreatedScope, treatedHold } from '../../../src/engine/motion/DemoGate.ts';
import { setCurvesChapter } from '../../../src/engine/motion/CurvesSwitch.ts';
import { momentsOn, setMomentsMode } from '../../../src/engine/motion/MomentsSwitch.ts';
import { setSmearStyle, smearOn } from '../../../src/engine/motion/SmearSwitch.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { GARMENT_GRIDS } from '../../../src/data/ffx2/garment-grids/index.ts';
import { garmentGridRegistryFrom } from '../../../src/battle/ffx2/adapters.ts';
import { gridNodeContents } from '../../../src/battle/ffx2/setup.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { isListed } from '../booth-r70-withdrawn.ts';

afterEach(() => {
  setTreatedScope(null);
  setCurvesChapter(undefined);
  setMomentsMode(null);
  setSmearStyle(null);
  reset();
});

const BOOTH = ['seymour-flux', 'ffx2-bahamut'];
/** The cap CHK-027 excuses a planned smear up to (`critic/policy.json` `continuity.smear.maxJerkShare`). */
const CAP = 0.5;

/** What the harness read in the page at the hurt-to-KO hard cut (swap jerk over the drawn height, 1600 x 900, `hard true`, paint/plane), by dress. Every other dress has no read. */
const MEASURED: Readonly<Record<string, { lo: number; hi: number; where: string }>> = {
  'rikku-thief': { lo: 0.608, hi: 0.634, where: 'Leblanc (r69-fix rikku-ko control runs and booth-leblanc j4: 14 KOs)' },
  'yuna-gunner': { lo: 0.504, hi: 0.52, where: 'Leblanc (r69-fix leb-now-yuna: 2 KOs)' },
  'rikku-dark-knight': { lo: 0.48, hi: 0.484, where: 'Chapter IV (r69-fix ch4-now-b: 3 KOs)' },
};

/**
 * Chapters beyond the booth pair that play the KO's hard cut (moments and smear both), each with the evidence that every dress the player can field there READS under the cap. None does: Chapter II holds the smear,
 * Leblanc and Chapters III, V, VII, IX, X, XI, XII, XIII, XIV and XV hold the moments. A chapter that joins and plays both pieces is added here in the commit that lets it, with its reads from the page.
 * Chapter XIV (Isaaru in the Via Purifico, FFX) was the one in the first merge, on an estimate and not a read; the review of `booth-b3` (M1, 2026-10-31) found that the rule as written holds it ("a dress with no read is NOT under the cap"),
 * and it now holds `moments` with the J5 lift. Its aeons were never at risk: they cannot take the cut (pinned below).
 */
const KO_CLEARED: Readonly<Record<string, string>> = {};

/** What the harness read for FFX party figures (swap jerk over the drawn height, 1600 x 900): the plain cross (release 68, `hard false`) and, where the booth Chapter I cuts it, the hard cut (`hard true`). */
const FFX_READS: Readonly<Record<string, { plain: [number, number]; hard?: [number, number] }>> = {
  tidus: { plain: [0.079, 0.079], hard: [0.092, 0.112] },
  kimahri: { plain: [0.147, 0.222], hard: [0.495, 0.499] },
  yuna: { plain: [0.095, 0.117] },
};

/** The cut window a party figure's KO is built with in this chapter and scope, with the moments and the smear forced on the way the pack does. */
function koWindow(chapter: string, scope: 'all' | 'pack'): { window: number | undefined; moments: boolean; smear: boolean; cut: boolean | undefined; crossMs: number } {
  setTreatedScope(scope);
  setCurvesChapter(chapter);
  setMomentsMode('new');
  setSmearStyle('paint');
  const window = yuna().koCutWindow();
  const game = TREATED_CHAPTERS[chapter]?.game ?? 'ffx2';
  const run = fallRun('topple', game, window)!;
  return { window, moments: momentsOn(), smear: smearOn(), cut: run.opts.cut, crossMs: run.opts.crossMs };
}

/** The dresses (`girl-dress`) a chapter's girls can wear in a fight: the worn one and every node of her Garment Grid, from the real build through the engine's own layout (`gridNodeContents`) and the real grid registry. */
function fieldable(chapterId: string): string[] {
  const grids = garmentGridRegistryFrom(Object.values(GARMENT_GRIDS));
  const build = getChapter(chapterId)!.buildRef as FFX2PartyBuild;
  const out: string[] = [];
  for (const m of build.members) {
    const nodes = grids.get(m.garmentGrid.id)?.nodes ?? 6;
    for (const dress of gridNodeContents(m, nodes)) if (dress) out.push(`${m.id}-${dress}`);
  }
  return out;
}

/** The rule on a set of dresses: every one has a read, and every read is under the cap. */
const allUnderCap = (dresses: readonly string[]): boolean => dresses.every((d) => MEASURED[d] !== undefined && MEASURED[d]!.hi < CAP);

const B2_FFX2 = ['ffx2-vegnagun-shuyin', 'ffx2-den-of-woe', 'ffx2-fallen-aeons'] as const;

describe('Chapter II: the KO is the plain cross, because the smear is held (the rule\'s trigger cannot occur)', () => {
  it('moments play, the smear does not, so the real actor builds no cut window and the KO crosses over the plain run', () => {
    const k = koWindow('yunalesca', 'all');
    expect(k.moments).toBe(true);
    expect(k.smear).toBe(false);
    expect(k.window).toBeUndefined();
    expect(k.cut).toBeUndefined();
    const plain = fallRun('topple', 'ffx')!;
    expect(k.crossMs).toBe(plain.opts.crossMs);
    expect(k.crossMs).toBeGreaterThan(60); // a blend over several frames, not a cut of a few milliseconds
    expect(treatedHold('yunalesca', 'smear')).toMatch(/Lifts when/);
    expect(treatedHold('yunalesca', 'moments')).toBeUndefined();
  });

  it('the invariant: a treated chapter beyond the booth pair that plays moments and smear together is named in KO_CLEARED with its evidence, and nothing else is', () => {
    setTreatedScope('all');
    const playsCut = Object.keys(TREATED_CHAPTERS).filter((id) => !BOOTH.includes(id) && isTreatedChapter(id, 'moments') && isTreatedChapter(id, 'smear'));
    expect(playsCut.sort()).toEqual(Object.keys(KO_CLEARED).sort());
    for (const id of BOOTH) expect([isTreatedChapter(id, 'moments'), isTreatedChapter(id, 'smear')], id).toEqual([true, true]); // the approved target keeps the cut
  });

  it('every chapter beyond the booth pair holds the moments or the smear (so none cuts the KO unread), and a hold on either is written to be lifted', () => {
    for (const id of Object.keys(TREATED_CHAPTERS)) {
      if (BOOTH.includes(id)) continue;
      const m = treatedHold(id, 'moments');
      const s = treatedHold(id, 'smear');
      if (KO_CLEARED[id] === undefined) expect(m !== undefined || s !== undefined, id).toBe(true);
      for (const why of [m, s]) if (why !== undefined) expect(why, id).toMatch(/Lifts when/);
    }
  });
});

const XIV = 'isaaru-via-purifico';
/** Yuna's five aeons in the Via Purifico (`booth-ffx-b3b-classes`: Valefor, Ifrit, Ixion, Shiva and Bahamut), by their art ids. */
const XIV_AEONS = ['valefor', 'ifrit', 'shiva', 'ixion', 'bahamut'] as const;
/** The facts `living.ts` reads for a party figure whose KO painting is a lying body, motion allowed (REDUCE MOTION off). */
const toLying = (name: string): KoFacts => ({ rm: false, samePlane: false, samePainting: false, fromProne: false, toProne: true, name, partySide: true });

describe('Chapter XIV (batch 3b, FFX only): Yuna alone has no read at a hard cut, so the moments are held (the review of booth-b3, M1)', () => {
  it("the real actor builds release 68's KO there: no window, the plain cross; the smear still plays, under ?treated=pack nothing changes, and the booth pair next to it keeps the cut", () => {
    const k = koWindow(XIV, 'all');
    expect([k.moments, k.smear]).toEqual([false, true]);
    expect(k.window).toBeUndefined();
    expect(k.cut).toBeUndefined();
    expect(k.crossMs).toBe(fallRun('topple', 'ffx')!.opts.crossMs);
    expect(k.crossMs).toBeGreaterThan(60); // a blend over several frames, not a cut of a few milliseconds
    expect(koWindow(XIV, 'pack').window).toBeUndefined();
    expect(koWindow('seymour-flux', 'all').window).toBeGreaterThan(0);
    expect(Object.keys(KO_CLEARED)).toEqual([]); // no chapter beyond the booth pair plays the cut on any evidence
  });

  it("an estimate is not a read: Yuna's worst recorded plain-cross read times the largest plain-to-hard ratio an FFX figure shows stays under the cap, and that is exactly why the hold is there (no FFX Yuna has been read at a hard cut)", () => {
    const ratio = Math.max(...Object.values(FFX_READS).filter((r) => r.hard).map((r) => r.hard![1] / r.plain[0])); // Kimahri 0.499 / 0.147
    expect(ratio).toBeCloseTo(3.39, 1);
    expect(FFX_READS['yuna']!.plain[1] * ratio).toBeLessThan(CAP);
    expect(FFX_READS['yuna']!.plain[1] * ratio).toBeGreaterThan(0.35); // the margin is real but not wide
    expect(FFX_READS['yuna']!.hard).toBeUndefined(); // ...and there is no read to put in its place
    expect(FFX_READS['kimahri']!.hard![1]).toBeLessThan(CAP); // the approved Chapter I's own Kimahri sits 0.001 under it, where the same estimators said 0.43
  });

  it('her five aeons can never take the cut: none is a toppling body, so the KO is a buckle and a cross whatever the moments do, and fallRun cuts only a topple (Yuna is the one body at risk)', () => {
    for (const aeon of XIV_AEONS) {
      expect(canTopple(aeon, true), aeon).toBe(false);
      expect(koMode(toLying(aeon)), aeon).toBe('buckle-cross');
    }
    expect(koMode(toLying('yuna'))).toBe('topple');
    for (const mode of ['cross', 'buckle-cross', 'flip'] as const) expect(fallRun(mode, 'ffx', 38)?.opts.cut, mode).toBeUndefined();
    expect(fallRun('topple', 'ffx', 38)!.opts.cut).toBe(true);
    const build = getChapter(XIV)!.buildRef as { activeSlots: string[] };
    expect(build.activeSlots).toEqual(['yuna']); // forced solo, no Switch: her KO is the party wipe, so the exposure is the defeat frame
  });

  it('the hold says so: Yuna alone, no read, the aeons never cut, the estimate is not a read, the plain cross it keeps, job J5 and what lifts it (judged by pixels and by share)', () => {
    const why = treatedHold(XIV, 'moments')!;
    expect(why.length).toBeGreaterThanOrEqual(80);
    expect(why).toMatch(/^FFX, Chapter XIV/);
    expect(why).toMatch(/Only Yuna can take the cut here: her five aeons never do/);
    expect(why).toMatch(/NO READ of FFX Yuna/);
    expect(why).toMatch(/an estimate is not a read/);
    expect(why).toMatch(/release 68's plain cross/);
    expect(why).toMatch(/CHK-027/);
    expect(why).toMatch(/Lifts when job J5 of docs\/handoff\/booth-ffx-b3b\.md/);
    expect(why).toMatch(/by pixels and by share/);
    expect(Object.keys(PIECE_HOLDS[XIV]!).sort()).toEqual(['breath', 'cam', 'moments']);
    expect(treatedHold(XIV, 'smear')).toBeUndefined(); // only the piece the rule names is lost
  });
});

describe('Chapters V, XV and XI: the girls can field Gunner and Thief, the harness read them over the cap, so the moments are held', () => {
  const EXPECTED = [
    'yuna-white-mage', 'yuna-gunner', 'yuna-thief', 'yuna-warrior', 'yuna-lady-luck',
    'rikku-dark-knight', 'rikku-gunner', 'rikku-thief', 'rikku-warrior', 'rikku-lady-luck',
    'paine-dark-knight', 'paine-gunner', 'paine-thief', 'paine-warrior', 'paine-lady-luck', 'paine-white-mage',
  ];

  it.each(B2_FFX2)('%s: the Farplane build\'s Garment Grids (through the engine\'s layout) put exactly these sixteen dresses in a fight', (id) => {
    expect(fieldable(id).sort()).toEqual([...EXPECTED].sort());
  });

  it.each(B2_FFX2)('%s: a dress is on the grids that the harness read over the cap, and most have no read: the rule fails and the chapter holds moments', (id) => {
    const dresses = fieldable(id);
    expect(dresses).toContain('rikku-thief');
    expect(dresses).toContain('yuna-gunner');
    expect(MEASURED['rikku-thief']!.lo).toBeGreaterThanOrEqual(CAP);
    expect(MEASURED['yuna-gunner']!.lo).toBeGreaterThanOrEqual(CAP);
    expect(dresses.filter((d) => MEASURED[d] === undefined).length).toBeGreaterThan(10);
    expect(allUnderCap(dresses)).toBe(false);
    expect(treatedHold(id, 'moments')).toBeDefined();
    setTreatedScope('all');
    expect(isTreatedChapter(id, 'moments')).toBe(false); // reached under `all`, and the piece answers today's (or not reached at all: the r70 withdrawn two)
    expect(isTreatedChapter(id, 'smear')).toBe(isListed(id));
    expect(isTreatedChapter(id)).toBe(isListed(id));
  });

  it.each(B2_FFX2)("%s: the real actor builds release 68's KO (no window, the plain cross), the piece the hold names is the only one lost, and under ?treated=pack nothing changes", (id) => {
    const k = koWindow(id, 'all');
    expect(k.moments).toBe(false);
    expect(k.smear).toBe(isListed(id)); // the smear still plays; only its KO cut waits for the moments (a withdrawn chapter plays neither: release 68's frame)
    expect(k.window).toBeUndefined();
    expect(k.cut).toBeUndefined();
    expect(k.crossMs).toBe(fallRun('topple', 'ffx2')!.opts.crossMs);
    expect(koWindow(id, 'pack').window).toBeUndefined();
    expect(koWindow('ffx2-bahamut', 'all').window).toBeGreaterThan(0); // the booth pair keeps the cut
  });

  it.each(B2_FFX2)('%s: the hold names the grids, the two dresses over the cap with their reads, the chapter\'s own plain-cross consequence, CHK-027 and what lifts it', (id) => {
    const why = treatedHold(id, 'moments')!;
    expect(why.length).toBeGreaterThanOrEqual(80);
    expect(why).toMatch(/Garment Grids/);
    expect(why).toMatch(/Rikku Thief 0\.61 to 0\.63/);
    expect(why).toMatch(/Yuna Gunner 0\.50 to 0\.52/);
    expect(why).toMatch(/CHK-027/);
    expect(why).toMatch(/plain cross/);
    expect(why).toMatch(/Lifts when a continuity run of a KO per dress/);
    expect(Object.keys(PIECE_HOLDS[id]!)).toContain('moments');
  });
});

describe('Trema and Leblanc (FFX-2 only): the girls\' grids field Gunner and Thief here too, so the moments stay held (review m3)', () => {
  const TREMA = 'ffx2-trema';
  const LEBLANC = 'ffx2-leblanc';

  it('the real grids of Trema put the dresses the hold names in a fight, Gunner and Thief on all three girls among them', () => {
    expect(fieldable(TREMA).sort()).toEqual(
      ['yuna-dark-knight', 'yuna-white-mage', 'yuna-gunner', 'yuna-thief', 'yuna-lady-luck', 'rikku-alchemist', 'rikku-gunner', 'rikku-thief', 'rikku-warrior', 'rikku-lady-luck', 'paine-dark-knight', 'paine-warrior', 'paine-gunner', 'paine-thief', 'paine-lady-luck'].sort(),
    );
  });

  it('the real grids of Leblanc (a different build: Songstress and the Mages where Trema has the Dark Knight and the Alchemist) put Gunner and Thief on Yuna and Rikku and Gunner on Paine', () => {
    expect(fieldable(LEBLANC).sort()).toEqual(
      ['yuna-gunner', 'yuna-songstress', 'yuna-white-mage', 'yuna-black-mage', 'yuna-thief', 'rikku-thief', 'rikku-black-mage', 'rikku-gunner', 'rikku-warrior', 'rikku-white-mage', 'paine-warrior', 'paine-white-mage', 'paine-gunner', 'paine-songstress'].sort(),
    );
  });

  it.each([TREMA, LEBLANC])('%s: the grids field both dresses the harness read over the cap, most dresses have no read, so the rule fails and the chapter holds moments with its reason', (id) => {
    const dresses = fieldable(id);
    expect(dresses).toEqual(expect.arrayContaining(['rikku-thief', 'yuna-gunner', 'rikku-gunner', 'yuna-thief', 'paine-gunner']));
    expect(dresses.filter((d) => MEASURED[d] === undefined).length).toBeGreaterThan(8);
    expect(allUnderCap(dresses)).toBe(false);
    expect(treatedHold(id, 'moments')).toMatch(/Lifts when/);
    setTreatedScope('all');
    expect(isTreatedChapter(id, 'moments')).toBe(false);
    expect(isTreatedChapter(id)).toBe(true);
  });

  it.each([TREMA, LEBLANC])("%s: the real actor builds release 68's KO (no window, the plain cross), and under ?treated=pack nothing changes", (id) => {
    const k = koWindow(id, 'all');
    expect([k.moments, k.window, k.cut]).toEqual([false, undefined, undefined]);
    expect(k.crossMs).toBe(fallRun('topple', 'ffx2')!.opts.crossMs);
    expect(koWindow(id, 'pack').window).toBeUndefined();
  });

  it('Trema\'s hold names the over-cap pair beside the three starting dresses (the grid fields Gunner and Thief, Rikku Thief 0.61 to 0.63 and Yuna Gunner 0.50 to 0.52)', () => {
    const why = treatedHold(TREMA, 'moments')!;
    expect(why).toMatch(/Gunner and Thief/);
    expect(why).toMatch(/Rikku Thief 0\.61 to 0\.63/);
    expect(why).toMatch(/Yuna Gunner 0\.50 to 0\.52/);
  });
});

describe('the table of reads is the one the holds quote (Leblanc\'s hold and these three say the same numbers)', () => {
  it('Leblanc\'s moments hold quotes Rikku Thief 0.62 to 0.63 and Yuna Gunner 0.50 to 0.52, inside the table\'s ranges', () => {
    const why = treatedHold('ffx2-leblanc', 'moments')!;
    expect(why).toMatch(/0\.62 to 0\.63/);
    expect(why).toMatch(/0\.50 to 0\.52/);
    expect(MEASURED['rikku-thief']!.lo).toBeLessThanOrEqual(0.62);
    expect(MEASURED['rikku-thief']!.hi).toBeGreaterThanOrEqual(0.63);
    expect(MEASURED['yuna-gunner']!.lo).toBeLessThanOrEqual(0.504);
    expect(MEASURED['yuna-gunner']!.hi).toBeGreaterThanOrEqual(0.52);
  });

  it('Leblanc fields the same two paintings over the cap, and the booth pair\'s Chapter IV fields them too (the approved pair is not changed by the rule; the read of its Thief and Gunner is owed)', () => {
    expect(fieldable('ffx2-leblanc')).toEqual(expect.arrayContaining(['rikku-thief', 'yuna-gunner']));
    expect(fieldable('ffx2-bahamut')).toEqual(expect.arrayContaining(['rikku-thief', 'yuna-gunner']));
    expect(MEASURED['rikku-dark-knight']!.hi).toBeLessThan(CAP);
  });
});

describe('the dome\'s Tidus 0.75 is a REDUCE MOTION run, not the moments\' cut (review m2)', () => {
  it.each(['seymour-anima-macalania', 'yojimbo-cavern', 'seymour-natus'])('%s: the hold quotes it as a REDUCE MOTION run with no planned smear, and no longer as a hard cut', (id) => {
    const why = treatedHold(id, 'moments')!;
    expect(why).toMatch(/0\.75 \(Tidus, the dome of Chapter II: a REDUCE MOTION run, whose cut has no planned smear/);
    expect(why).not.toMatch(/a hard cut with no planned smear/);
    expect(why).toMatch(/Lifts when/);
  });

  it('the dome has no moments cut to read: its smear is held, so the KO there is the plain cross whatever the address says', () => {
    expect(koWindow('yunalesca', 'all').window).toBeUndefined();
    expect(koWindow('yunalesca', 'pack').window).toBeUndefined();
  });
});
