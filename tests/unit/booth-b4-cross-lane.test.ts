/**
 * BATCH 4 TOGETHER: THE CROSS-LANE CHECKS OF THE MERGE OF `booth-ffx-b4-hud`, `booth-ffx2-b4-sky` AND `booth-b4-last` (release 71 candidate, branch `booth-b4`, cut from `r70-int`; both games for the checks).
 *
 * Each lane tested its own chapters on its own base (the HUD lane saw twelve treated chapters, the sky lane twelve, the last lane fourteen). These read the merged state from the source, so a later edit to the list, a hold
 * table or a stylesheet that breaks one lane's reach through another's fails here:
 *
 *  1. THE LIST: 17 of the 19 listed chapters are treated (Chapter XVII, `sin-fins-core`, and, since the second focused review of the candidate, Chapter XVIII, `sin-face`, are the ones that are not; Chapters IX and XII left in the r71 verdicts and came back in r72-hud), 10 of them FFX and 7 FFX-2 (rule 14, from the registry), each of the batch's seven on `since` r71.
 *  2. THE ONE HOLDS READER: `PIECE_HOLDS` carries the rows of `PieceHolds.ts` AND of `PieceHoldsLast.ts` (the very row objects), every treated chapter but the booth pair has a row, and no row belongs to an unlisted chapter.
 *  3. THE MEASURING WORD `?skygrade=a|b|c`: off by default, and when set it reaches Chapter V and Chapter XI and no other chapter, in either game (not the HUD lane's IX and XII, not the last lane's four).
 *  4. THE STYLESHEETS: `hudf1-chapters.css` (IX and XII) names only the Zanmato gauge's and the Omnis readout's own classes under `.ffxhud.hud-f1`; `sin-hud.css`'s F1 rules (XVIII) hang from `.hud-f1 .ffx-sinhud`;
 *     the two panels stay hidden in every other battle: the Mirror Aeons chapter's Dark Yojimbo carries the Dark Aeons' gauge tag, not Yojimbo's, so the Zanmato gauge never shows there.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { WITHDRAWN_R70 } from './booth-r70-withdrawn.ts';
import { LAST_HOLDS } from '../../src/engine/motion/PieceHoldsLast.ts';
import { SKY_CHAPTERS, setSkyOption, skyGradeFor, skyOption } from '../../src/engine/look/pro/SkyGrade.ts';
import { chapterLook } from '../../src/engine/look/LookConfig.ts';
import { proArenaFor, setProMode } from '../../src/engine/look/pro/ProSwitch.ts';
import { DARK_GAUGE_RULES } from '../../src/battle/ffx/ai/dark-aeons-setup.ts';
import { ZANMATO_GAUGE_RULES } from '../../src/ui/ffx/zanmatoGaugeModel.ts';

const HUD_LANE = ['yojimbo-cavern', 'seymour-omnis'] as const; // FFX only
const SKY_LANE = ['ffx2-vegnagun-shuyin', 'ffx2-fallen-aeons'] as const; // FFX-2 only
const LAST_LANE = { ffx: ['evrae-airship', 'mirror-aeons'], ffx2: ['ffx2-ixion-djose'] } as const; // the treated three of `booth-b4-last`, less Sin's face (FFX only), which the second focused review of the candidate took off the list (R71-C1); its rows stay in `PieceHoldsLast.ts`
const LAST_WITHDRAWN = ['sin-face'] as const;
const BOOTH = ['seymour-flux', 'ffx2-bahamut'];

beforeEach(() => {
  setTreatedScope('all');
  setProMode('pro');
});
afterEach(() => {
  setTreatedScope(null);
  setSkyOption(undefined);
  setProMode(null);
});

describe('the merged list', () => {
  it('treats 17 of the 19 listed chapters; Chapter XVII (sin-fins-core) and, since the second focused review of the candidate, Chapter XVIII (sin-face) are the ones that are not (IX and XII came back in r72-hud), and no hidden or experimental id is on it', () => {
    const ids = Object.keys(TREATED_CHAPTERS);
    expect(CHAPTER_IDS).toHaveLength(19);
    expect(ids).toHaveLength(17);
    expect(CHAPTER_IDS.filter((id) => !ids.includes(id)).sort()).toEqual(['sin-face', 'sin-fins-core']);
    expect(Object.keys(WITHDRAWN_R70).sort()).toEqual([...LAST_WITHDRAWN].sort()); // Sin's face (R71-C1), rows unread; the HUD lane's two are back on the list (r72-hud)
    for (const id of ids) expect(CHAPTER_IDS, id).toContain(id);
  });

  it('is 10 FFX and 7 FFX-2, each in the game the registry says (rule 14), and the batch\'s seven are all `since` r71', () => {
    const byGame = (g: string): string[] => Object.entries(TREATED_CHAPTERS).filter(([, e]) => e.game === g).map(([id]) => id);
    expect(byGame('ffx')).toHaveLength(10);
    expect(byGame('ffx2')).toHaveLength(7);
    for (const [id, e] of Object.entries(TREATED_CHAPTERS)) expect(getChapter(id)?.game, id).toBe(e.game);
    const batch = [...HUD_LANE, ...SKY_LANE, ...LAST_LANE.ffx, ...LAST_LANE.ffx2]; // the HUD lane's IX and XII left the list in the r71 verdicts and came back in r72-hud; Sin's face left after the second focused review
    for (const id of batch) expect(TREATED_CHAPTERS[id]?.since, id).toBe('r71');
    for (const id of [...HUD_LANE, ...LAST_LANE.ffx]) expect(TREATED_CHAPTERS[id]!.game, id).toBe('ffx');
    for (const id of [...SKY_LANE, ...LAST_LANE.ffx2]) expect(TREATED_CHAPTERS[id]!.game, id).toBe('ffx2');
    expect(Object.keys(TREATED_CHAPTERS).filter((id) => TREATED_CHAPTERS[id]!.since === 'r71').sort()).toEqual([...batch].sort());
  });
});

describe('the one holds reader', () => {
  it('PIECE_HOLDS carries the rows of PieceHolds.ts and of PieceHoldsLast.ts (the very objects), each last-lane id once', () => {
    expect(Object.keys(LAST_HOLDS).sort()).toEqual([...LAST_LANE.ffx, ...LAST_LANE.ffx2, ...LAST_WITHDRAWN].sort()); // Sin's face keeps its rows, unread
    for (const id of Object.keys(LAST_HOLDS)) expect(PIECE_HOLDS[id], id).toBe(LAST_HOLDS[id]);
    const src = readFileSync(resolve('src/engine/motion/PieceHolds.ts'), 'utf8');
    for (const id of Object.keys(LAST_HOLDS)) expect(src, `${id} is written once, in PieceHoldsLast.ts`).not.toMatch(new RegExp(`^\\s*'${id}': Object\\.freeze`, 'm'));
    expect(src).toMatch(/\.\.\.LAST_HOLDS/);
  });

  it('every treated chapter but the booth pair has a row, and no row belongs to an unlisted or unknown chapter', () => {
    for (const id of Object.keys(TREATED_CHAPTERS)) if (!BOOTH.includes(id)) expect(PIECE_HOLDS[id], id).toBeDefined();
    for (const id of Object.keys(PIECE_HOLDS)) expect([...Object.keys(TREATED_CHAPTERS), ...Object.keys(WITHDRAWN_R70)], id).toContain(id); // IX, XII and Sin's face keep their rows, unread
    expect(Object.keys(PIECE_HOLDS)).toHaveLength(16);
  });
});

describe('the measuring word ?skygrade=a|b|c', () => {
  it('names no option by default (no address, no word), and the only chapter with a default grade is Chapter XI, grade C (r72; Chapter V has none)', () => {
    setSkyOption(undefined);
    expect(skyOption()).toBeNull();
    for (const id of CHAPTER_IDS) expect(skyGradeFor(id), id).toBe(id === 'ffx2-fallen-aeons' ? 'c' : null);
  });

  it('reaches Chapter V and Chapter XI and no other chapter in either game, whichever option is set', () => {
    expect(Object.keys(SKY_CHAPTERS).sort()).toEqual([...SKY_LANE].sort());
    for (const o of ['a', 'b', 'c'] as const) {
      setSkyOption(o);
      for (const id of CHAPTER_IDS) expect(skyGradeFor(id), `${id} ${o}`).toBe((SKY_LANE as readonly string[]).includes(id) ? o : null);
    }
    setSkyOption('a');
    expect(skyGradeFor(undefined)).toBeNull();
    expect(skyGradeFor('exp-leblanc')).toBeNull();
  });

  it('changes nothing in the other fifteen treated chapters: the look and the arena answer as they do with no word', () => {
    const others = Object.keys(TREATED_CHAPTERS).filter((id) => !(SKY_LANE as readonly string[]).includes(id));
    expect(others).toHaveLength(15);
    setSkyOption(null);
    const before = others.map((id) => [chapterLook(id), proArenaFor(id, '')]);
    for (const o of ['a', 'b', 'c'] as const) {
      setSkyOption(o);
      expect(others.map((id) => [chapterLook(id), proArenaFor(id, '')]), o).toEqual(before);
    }
  });

  it('plays the held look and arena in V only with the word and holds them without it (release 69\'s plate); Chapter XI plays them by default since r72 and holds them again only under `today`', () => {
    setSkyOption(undefined);
    expect(chapterLook('ffx2-vegnagun-shuyin')).toBeNull();
    expect(proArenaFor('ffx2-vegnagun-shuyin', '')).toBe(false);
    expect(chapterLook('ffx2-fallen-aeons')).not.toBeNull();
    expect(proArenaFor('ffx2-fallen-aeons', '')).toBe(true);
    setSkyOption('today');
    for (const id of SKY_LANE) {
      expect(chapterLook(id), id).toBeNull();
      expect(proArenaFor(id, ''), id).toBe(false);
    }
    setSkyOption('b');
    for (const id of SKY_LANE) {
      expect(chapterLook(id), id).not.toBeNull();
      expect(proArenaFor(id, ''), id).toBe(true);
    }
    setTreatedScope('pack'); // `?treated=pack` is release 68's reach: the word reaches nothing there
    for (const id of SKY_LANE) expect(skyGradeFor(id), id).toBeNull();
  });
});

describe('the stylesheets reach only their chapters', () => {
  const rules = (file: string): string[] =>
    readFileSync(resolve(file), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .map((r) => r.split('{')[0]!.trim())
      .filter((s) => s.length > 0);

  it('hudf1-chapters.css (Chapters IX and XII) hangs every selector from .ffxhud.hud-f1 and from the Zanmato gauge\'s or the Omnis readout\'s own class, and names nothing of Sin, the clock or the Gaze pill', () => {
    const sel = rules('src/ui/hudf1/hudf1-chapters.css');
    expect(sel.length).toBeGreaterThanOrEqual(6);
    for (const s of sel) {
      expect(s, s).toContain('.ffxhud.hud-f1');
      // the first lane's two panels, and (r72-hud) the two chapters' own markers: Chapter XII's `data-omnis-readout` on the HUD root, Chapter IX's gauge that is up (`.ffx-zg:not([hidden]):not(.ffx-zg--phone)`)
      expect(s, s).toMatch(/\.ffx-(zg|omr):not\(\.ffx-(zg|omr)--phone\)|\[data-omnis-readout\]|\.ffx-zg:not\(\[hidden\]\):not\(\.ffx-zg--phone\)/);
      expect(s, s).not.toMatch(/sin|clock|gaze/i);
    }
  });

  it('sin-hud.css\'s F1 rules (Chapter XVIII) hang from .hud-f1 .ffx-sinhud and move only the clock column and the Gaze pill', () => {
    const css = readFileSync(resolve('src/ui/ffx/sin-hud.css'), 'utf8');
    const sel = css.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map((r) => r.split('{')[0]!.trim()).filter((s) => s.includes('hud-f1'));
    expect(sel.length).toBeGreaterThanOrEqual(2);
    for (const s of sel) {
      for (const part of s.split(',').map((p) => p.trim())) {
        expect(part, part).toContain('.hud-f1 .ffx-sinhud:not(.ffx-sinhud--phone)');
        expect(part, part).toMatch(/\.ffx-sinclock$|\.ffx-sinhud__gaze$/);
      }
    }
    expect(css).not.toMatch(/ffx-zg|ffx-omr/);
  });

  it('the Zanmato gauge shows only for an enemy tagged \'yojimbo\'; the Mirror Aeons chapter\'s Dark Yojimbo carries the Dark Aeons\' tag, so the IX rules reach nothing there', () => {
    expect(ZANMATO_GAUGE_RULES).toBe('yojimbo');
    expect(DARK_GAUGE_RULES).not.toBe(ZANMATO_GAUGE_RULES);
    const model = readFileSync(resolve('src/ui/ffx/zanmatoGaugeModel.ts'), 'utf8');
    expect(model).toMatch(/enemyGaugeRules === ZANMATO_GAUGE_RULES/);
  });
});
