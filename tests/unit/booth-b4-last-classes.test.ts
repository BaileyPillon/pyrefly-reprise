/**
 * THE DEFECT CLASSES OF THE EARLIER BATCHES, READ OFFLINE FOR THE LAST FIVE LISTED CHAPTERS (release 71, branch `booth-b4-last`; no browser, server, Playwright or GPU ran: `docs/handoff/booth-b4-last.md` section 4 has every number and says which read is a model and which is data).
 *
 *  - Class 9, a chapter-specific HUD panel against the F1 slab (the r70 majors of Chapters IX and XII): the F1 zones are built from the REAL stylesheets (`helpers/f1Zones.ts`, the a11y-text lane's instrument, a 640 x 360 grid) and each chapter's panel from ITS stylesheet. **The instrument is validated first
 *    on the known defect**: Chapter IX's Zanmato gauge panel, which the r70 browser run found ending against the turn strip, must read as an overlap here. Then Chapter XVII's Fin plate (sits on the strip: the chapter stays out), Chapter XVIII's clock column and Gaze pill (clear at the default TEXT SIZE; overlapping the ribbon, the hero and the cue at 115 and 130 until the review's m1 fix, which steps both right in `sin-hud.css`) and Evrae's deck
 *    (no standing panel; the party and the coil against the F1 zones through the real NEAR rig).
 *  - Class 2, a script cutting the camera while the follower runs: FFX has no follower; Chapter XVI's scripts cut no rig (and its follower is held).
 *  - Class 6, a swap exception must hold the smear: Sin's face and Ixion at Djose hold it, Evrae (lifted in release 69) does not.
 *  - The rim: the two deck foes are flagged (no screen-space rim), the Fins, Genais, the Core, the Dark aeons and Ixion are not (their chapters hold the looks or stay out).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, isTreatedChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { SCOPE_EXCEPTIONS, scopeExcepted } from '../../src/engine/motion/SwapSwitch.ts';
import { TREATED_RIM_FOES } from '../../src/engine/look/pro/RimFigures.ts';
import { RANGE_STAGING } from '../../src/scenes/evrae-airship-range.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS } from '../../src/scenes/evrae-airship-deck.ts';
import { FFX_ZONES, painted, overlap, num, ctx, type Box } from './helpers/f1Zones.ts';
import { evalPair, lastDecl, leafRules, readSource } from './helpers/cssEval.ts';
import { GAP } from '../../src/ui/ffx/hudSafeZones.ts';

afterEach(() => setTreatedScope(null));

// ------------------------------------------------------------------------------------------------ class 9: the HUD panels against the F1 zones

const zg = leafRules(readSource('src/ui/ffx/zanmato-gauge.css'));
const sin = leafRules(readSource('src/ui/ffx/sin-hud.css'));
const old = leafRules(readSource('src/ui/inkgold/slabs.css'));

/** A panel's grid box from its stylesheet, in the frame its widget scales by `640 / frame` (`ZanmatoGauge` 1440 wide, `SinHud` 1600 wide). The HEIGHT is a content-sized estimate (named): every overlap below is decided by the x extent and the first rows. */
const gridBox = (rules: ReturnType<typeof leafRules>, sel: string, frame: number, o: { w?: number; h: number }): Box => {
  const k = 640 / frame;
  return { l: num(rules, sel, 'left') * k, t: num(rules, sel, 'top') * k, w: (o.w ?? num(rules, sel, 'width')) * k, h: o.h * k };
};

const ZONE = (name: string, ts: number): Box => painted(FFX_ZONES.find((z) => z.name === name)!, ts);
const meets = (b: Box, ts: number): string[] => FFX_ZONES.filter((z) => z.name !== 'sensor card (Intel)' && overlap(b, painted(z, ts)) > 0).map((z) => z.name);

/** Chapter IX's Zanmato gauge panel (frame 1440; the title row, the bar, its labels and the line under it: about 120 frame px tall). */
const ZG_PANEL = gridBox(zg, '.ffx-zg__panel', 1440, { h: 120 });
/** Chapter XVII's Fin plate (frame 1600; its width is `max-content` over a minimum of 470; padding, the name row and the charge row: about 92 frame px tall). */
const FIN_PLATE = gridBox(sin, '.ffx-sinfin', 1600, { w: num(sin, '.ffx-sinfin', 'min-width'), h: 92 });
/** Chapter XVIII's clock column (ring box 190, the chip, the estimate: about 286 frame px tall) and its Gaze pill (about 30). */
const CLOCK = gridBox(sin, '.ffx-sinclock', 1600, { h: 286 });
const GAZE = gridBox(sin, '.ffx-sinhud__gaze', 1600, { w: 150, h: 30 });

/** The selector the sheet's text-size step for one of the two Sin elements carries (FFX's attribute; `translate` is declared in the widget's frame px, 0.4 grid px each). */
const sinSel = (ts: number, el: string): string => `html[data-text-size='${Math.round(ts * 100)}']:not([data-phone-battle]) .ffxhud.hud-f1 .ffx-sinhud:not(.ffx-sinhud--phone) .${el}`;
/** A Sin HUD box where it stands at a text size: its place at the default size plus the sheet's `translate` for that size (the zones above are in grid px). */
const sinAt = (b: Box, ts: number, el: string): Box => {
  const t = lastDecl(sin, sinSel(ts, el), 'translate');
  return t === undefined ? b : { ...b, l: b.l + evalPair(t, ctx(ts))[0] * (640 / 1600) };
};
/** The distance between two boxes (0 when they touch or overlap). */
const separation = (a: Box, b: Box): number => Math.hypot(Math.max(0, a.l - (b.l + b.w), b.l - (a.l + a.w)), Math.max(0, a.t - (b.t + b.h), b.t - (a.t + a.h)));

describe('class 9: a chapter-specific HUD panel against the F1 slab, read from the stylesheets', () => {
  it("the instrument reads the KNOWN defect: Chapter IX's Zanmato gauge panel ends against the F1 turn strip at the default text size (the r70 browser run: its '0%' over the TURN ORDER caption)", () => {
    const strip = ZONE('turn strip', 1);
    expect(meets(ZG_PANEL, 1)).toEqual(['turn strip']);
    expect(ZG_PANEL.l + ZG_PANEL.w - strip.l).toBeGreaterThan(15); // the panel's right edge runs about 19 grid px (48 px at 2560) into the strip
    expect(ZG_PANEL.l).toBeLessThan(strip.l);
  });

  it("Chapter XVII's Fin plate (links 1 and 2) sits ON the F1 turn strip at the default text size: it starts 137 grid px left of the strip and is at least 188 wide, so it reaches 51 grid px into it, a major the treatment would introduce (so the chapter stays out)", () => {
    const strip = ZONE('turn strip', 1);
    expect(FIN_PLATE.w).toBeGreaterThanOrEqual(188); // 470 frame px at the minimum
    expect(meets(FIN_PLATE, 1)).toEqual(['turn strip']);
    const x = Math.min(FIN_PLATE.l + FIN_PLATE.w, strip.l + strip.w) - Math.max(FIN_PLATE.l, strip.l);
    expect(x).toBeGreaterThanOrEqual(50);
    // release 68's queue (`slabs.css` `.ig-ctb`: right 19.56, top 49.78, rows shifted left by at most 5 x 3.56) stands right of 530 for any row under 73 grid px wide: the plate is clear of it, so the collision is the treatment's
    const queueRight = 640 - num(old, '.ig-ctb', 'right');
    expect(queueRight - 73 - 5 * 3.56).toBeGreaterThan(FIN_PLATE.l + FIN_PLATE.w);
  });

  it("Chapter XVIII's clock column and Gaze pill, UNMOVED, are clear of every F1 zone at the default text size (the ribbon ends 12 grid px short of the column) and meet the ribbon and the hero from 115 percent (345 grid px squared against the ribbon, then 1,170 at 130) and the Gaze pill meets the cue line: the instrument reads the defect the review found (m1)", () => {
    expect(meets(CLOCK, 1)).toEqual([]);
    expect(meets(GAZE, 1)).toEqual([]);
    expect(CLOCK.l - (ZONE('boss ribbon', 1).l + ZONE('boss ribbon', 1).w)).toBeGreaterThanOrEqual(12);
    expect(meets(CLOCK, 1.15)).toEqual(['boss ribbon', 'hero']);
    expect(meets(CLOCK, 1.3)).toEqual(['boss ribbon', 'hero']);
    expect(Math.round(overlap(CLOCK, ZONE('boss ribbon', 1.15)))).toBe(345); // 12 x 29 grid px: the ribbon grows to 184 wide and reaches x 212 against the column's 200
    expect(Math.round(overlap(CLOCK, ZONE('boss ribbon', 1.3)))).toBe(1170); // 36 x 32.5
    expect(meets(GAZE, 1.15)).toEqual(['hero', 'cue']);
    expect(meets(GAZE, 1.3)).toEqual(['cue']);
  });

  it("review m1 FIXED: the sheet steps the column and the pill right at 115 and 130 (100 and 165 frame px), so with the sheet's own steps both are clear of EVERY F1 zone at all three text sizes, by at least the safe zones' GAP, and the column ends well short of the grown turn strip", () => {
    for (const ts of [1, 1.15, 1.3]) {
      const clock = sinAt(CLOCK, ts, 'ffx-sinclock');
      const gaze = sinAt(GAZE, ts, 'ffx-sinhud__gaze');
      expect(meets(clock, ts), `clock at ${ts}`).toEqual([]);
      expect(meets(gaze, ts), `gaze at ${ts}`).toEqual([]);
      for (const z of FFX_ZONES) {
        expect(separation(clock, painted(z, ts)), `clock to ${z.name} at ${ts}`).toBeGreaterThanOrEqual(GAP);
        expect(separation(gaze, painted(z, ts)), `gaze to ${z.name} at ${ts}`).toBeGreaterThanOrEqual(GAP);
      }
      expect(ZONE('turn strip', ts).l - (clock.l + clock.w), `clock to the turn strip at ${ts}`).toBeGreaterThan(50);
      expect(gaze.l, 'the pill stays under the column, in its left edge').toBe(clock.l);
    }
    expect(sinAt(CLOCK, 1, 'ffx-sinclock')).toEqual(CLOCK); // the default size does not move
    expect(sinAt(CLOCK, 1.15, 'ffx-sinclock').l - CLOCK.l).toBeCloseTo(40, 6);
    expect(sinAt(CLOCK, 1.3, 'ffx-sinclock').l - CLOCK.l).toBeCloseTo(66, 6);
  });

  it("the steps hang from `.hud-f1` and from the landscape widget only (the old HUD, `?treated=pack`, the phone and Chapter XVII while it is out draw the column where it always stood), name both elements, and no rule moves either one at the default size", () => {
    const moving = leafRules(readSource('src/ui/ffx/sin-hud.css')).filter((r) => /translate:/.test(r.body) && /ffx-sinclock|ffx-sinhud__gaze/.test(r.sel));
    expect(moving.map((r) => r.sel).sort()).toEqual(
      ['115', '130'].flatMap((n) => ['ffx-sinclock', 'ffx-sinhud__gaze'].map((el) => sinSel(Number(n) / 100, el))).sort(),
    );
    for (const r of moving) {
      expect(r.sel).toMatch(/^html\[data-text-size='(115|130)'\]:not\(\[data-phone-battle\]\) \.ffxhud\.hud-f1 \.ffx-sinhud:not\(\.ffx-sinhud--phone\) /);
    }
    expect(lastDecl(sin, sinSel(1, 'ffx-sinclock'), 'translate')).toBeUndefined();
  });

  it('Evrae has no standing panel of his own: the order widget is an overlay of the command cascade and its chip docks to the F1 turn strip itself (`AirshipOrders.dockChip(ctbList.el)`), and the Sin HUD is hidden in every battle whose state carries neither Sin\'s clock nor a Fin (`SinHud`)', () => {
    const hud = readSource('src/ui/ffx/FFXBattleHud.ts', false);
    expect(hud).toMatch(/this\.airship\.dockChip\(this\.ctbList\.el, state\)/);
    expect(readSource('src/ui/ffx/SinHud.ts', false)).toMatch(/hidden in every battle whose state carries/);
  });
});

describe('class 9, the party and the coil of the deck against the F1 zones (the real NEAR idle rig, 16:9)', () => {
  const rig = RANGE_STAGING.near.rigs.idle;
  const sub = (a: number[], b: number[]): number[] => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const dot = (a: number[], b: number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const cross = (a: number[], b: number[]): number[] => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  const norm = (a: number[]): number[] => a.map((v) => v / Math.hypot(a[0]!, a[1]!, a[2]!));
  /** A world point in the frame, in the F1 grid (x right, y DOWN from the top of 640 x 360). */
  function grid(p: number[]): [number, number] {
    const f = norm(sub([...rig.lookAt], [...rig.position]));
    const r = norm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    const d = sub(p, [...rig.position]);
    const z = dot(d, f);
    const th = Math.tan(((rig.fov * Math.PI) / 180) / 2);
    return [(0.5 + dot(d, r) / (z * th * 2 * (16 / 9))) * 640, (1 - (0.5 + dot(d, u) / (z * th * 2))) * 360];
  }
  const HEIGHTS = [1.75, 1.85, 1.6]; // Tidus, Wakka, Rikku (`EVRAE_AIRSHIP_ACTOR_HEIGHTS`)

  it("each of the three figures' feet and heads stand clear of every F1 zone at the default text size (their centre line and a half width of a quarter of their drawn height), and Rikku's right edge is the nearest thing to a zone: the party cards, within a few grid px", () => {
    let nearest = Infinity;
    EVRAE_AIRSHIP_DECK_SLOTS.party.slice(0, 3).forEach(([x, , z], i) => {
      const [fx, fy] = grid([x, 0, z]);
      const [, hy] = grid([x, HEIGHTS[i]!, z]);
      const half = (fy - hy) * 0.25;
      const fig: Box = { l: fx - half, t: hy, w: 2 * half, h: fy - hy };
      expect(meets(fig, 1), `figure ${i}`).toEqual([]);
      for (const z2 of FFX_ZONES) if (z2.name === 'party cards') nearest = Math.min(nearest, painted(z2, 1).l - (fig.l + fig.w));
    });
    expect(nearest).toBeGreaterThan(0);
    expect(nearest).toBeLessThan(30);
  });

  it("Evrae's idle-near painting (1136 x 784, the baseline at row 768, 4.1 world units per 768 px) at his NEAR spot reaches the F1 party cards and nothing else, as the old HUD's party panel did: the coil is behind the deck's edge there", () => {
    const [sx, sy, sz] = [3.8923, -0.9, -4.7]; // EVRAE_NEAR_SPOT
    const per = 4.1 / 768;
    const w = 1136 * per;
    const pts = [[sx - w / 2, sy + 768 * per], [sx + w / 2, sy + 768 * per], [sx - w / 2, sy - 16 * per], [sx + w / 2, sy - 16 * per]].map(([x, y]) => grid([x!, y!, sz]));
    const l = Math.min(...pts.map((p) => p[0]));
    const t = Math.min(...pts.map((p) => p[1]));
    const box: Box = { l, t, w: Math.max(...pts.map((p) => p[0])) - l, h: Math.max(...pts.map((p) => p[1])) - t };
    expect(meets(box, 1)).toEqual(['party cards']);
  });
});

// ------------------------------------------------------------------------------------------------ class 2, class 6 and the rim

function cameraCuts(node: unknown, into: Set<string> = new Set()): Set<string> {
  if (Array.isArray(node)) for (const n of node) cameraCuts(n, into);
  else if (node !== null && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (o['type'] === 'camera' && typeof o['rig'] === 'string') into.add(o['rig']);
    for (const v of Object.values(o)) cameraCuts(v, into);
  }
  return into;
}

describe('class 2: a script cutting the camera while the follower runs', () => {
  it("the three FFX chapters cut only to the scene's own rigs (FFX has no follower); Chapter XVI's scripts cut to no rig at all, so its held follower owes no stand-down row, and the day the follower lifts a script that cuts a rig needs a `SCRIPTED_RIGS` row", () => {
    expect([...cameraCuts(getChapter('evrae-airship')!.scriptsRef)].sort()).toEqual(['action', 'idle', 'victory']);
    expect([...cameraCuts(getChapter('sin-face')!.scriptsRef)].sort()).toEqual(['action', 'idle', 'victory']);
    expect([...cameraCuts(getChapter('mirror-aeons')!.scriptsRef)]).toEqual(['idle']);
    expect([...cameraCuts(getChapter('ffx2-ixion-djose')!.scriptsRef)]).toEqual([]);
    expect(treatedHold('ffx2-ixion-djose', 'cam')).toBeDefined();
  });
});

describe('class 6: a swap exception holds the smear; the rim flags follow the looks', () => {
  it('Sin\'s face and Ixion at Djose are swap exceptions and hold `smear` with the exception named; Evrae left the exceptions in release 69 and plays it; the Mirror Aeons chapter was never one', () => {
    expect(Object.keys(SCOPE_EXCEPTIONS).sort()).toEqual(['ffx2-ixion-djose', 'sin-face', 'yunalesca']);
    for (const id of ['sin-face', 'ffx2-ixion-djose']) {
      expect(scopeExcepted(id), id).toBe(true);
      expect(treatedHold(id, 'smear'), id).toMatch(/SCOPE_EXCEPTIONS/);
    }
    for (const id of ['evrae-airship', 'mirror-aeons']) {
      expect(scopeExcepted(id), id).toBe(false);
      expect(treatedHold(id, 'smear'), id).toBeUndefined();
    }
  });

  it("the two deck foes of the chapters with the HD-2D look draw no screen-space rim (Evrae's edge minus ring luminance -2.4, Overdrive Sin's +15.5: no pale fringe to hide, no pale one to add); the Fins, Genais, the Core, the Dark aeons and Ixion are not flagged", () => {
    expect(TREATED_RIM_FOES['evrae']).toBe('ffx');
    expect(TREATED_RIM_FOES['overdrive-sin']).toBe('ffx');
    for (const id of ['left-fin', 'right-fin', 'sin-left-fin', 'sin-right-fin', 'sinspawn-genais', 'sin-core', 'dark-mindy', 'dark-sandy', 'dark-cindy', 'dark-yojimbo', 'dark-daigoro', 'x2-ixion', 'cid']) expect(Object.prototype.hasOwnProperty.call(TREATED_RIM_FOES, id), id).toBe(false);
  });

  it('a hold that names a piece is a hold the list reads: every one of the four chapters answers false for exactly the pieces its row names under the all scope', () => {
    setTreatedScope('all');
    for (const id of ['evrae-airship', 'sin-face', 'mirror-aeons', 'ffx2-ixion-djose']) {
      expect(isTreatedChapter(id), id).toBe(true);
      expect(TREATED_CHAPTERS[id]!.since).toBe('r71');
      for (const piece of Object.keys(PIECE_HOLDS[id]!)) expect(isTreatedChapter(id, piece as never), `${id} ${piece}`).toBe(false);
    }
    expect(isTreatedChapter('sin-fins-core')).toBe(false); // Chapter XVII does not join
    expect(Object.prototype.hasOwnProperty.call(PIECE_HOLDS, 'sin-fins-core')).toBe(false);
  });
});
