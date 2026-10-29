/**
 * The F1 HUD's zones on the 640 x 360 grid, built from the REAL stylesheets (lane a11y-text, 2026-10-29): each zone's box from the declared `left` / `top` / `width` / `height`, grown by the `scale`, `transform-origin` and
 * `translate` the sheets declare at a TEXT SIZE. Shared by `a11y-text-f1.test.ts` (no overlap, nothing off the stage) and by the browser job X1's predictions (`jobs/JOBS.md`). Estimates are named where a width or a
 * height depends on content (the hero's name, the turn strip's tile and names).
 */
import { declsOf, evalLength, evalPair, lastDecl, leafRules, readSource, type CssRule } from './cssEval.ts';

export const f1 = leafRules(readSource('src/ui/hudf1/hudf1.css'));
export const f1ffx = leafRules(readSource('src/ui/hudf1/hudf1-ffx.css'));
export const f1ffx2 = leafRules(readSource('src/ui/hudf1/hudf1-ffx2.css'));
export const f1text = leafRules(readSource('src/ui/hudf1/hudf1-textsize.css'));
export const tsFfx = leafRules(readSource('src/ui/common/text-size.css'));
export const ffxHud = leafRules(readSource('src/ui/ffx/ffx-hud.css'));
export const tsWide = leafRules(readSource('src/ui/common/text-size-wide.css'));

export const FFX_PFX = "html[data-text-size]:not([data-text-size='100']):not([data-phone-battle])";
export const FFX2_PFX = "html[data-text-size-wide]:not([data-text-size-wide='100']):not([data-phone-battle])";
export const SIZES = [1, 1.15, 1.3] as const;

export const num = (rules: readonly CssRule[], sel: string, prop: string): number => {
  const v = lastDecl(rules, sel, prop);
  if (v === undefined) throw new Error(`${sel} has no ${prop}`);
  return parseFloat(v);
};
export const ctx = (ts: number, w: { vw: number; vh: number } = { vw: 1600, vh: 900 }) => ({ vw: w.vw, vh: w.vh, vars: { '--pyr-ts': String(ts) } });

export interface Box {
  l: number;
  t: number;
  w: number;
  h: number;
}
export interface Zone {
  name: string;
  box: Box;
  /** The rules, weakest first, whose `scale`, `transform-origin` and `translate` apply. */
  effects: ReadonlyArray<readonly [readonly CssRule[], string]>;
  /** Padding to take off the border box after it is grown (top, right, bottom, left). */
  pad?: readonly [number, number, number, number];
}


// ------------------------------------------------------------------------------------------ the boxes


function originOf(value: string | undefined, b: Box, c: ReturnType<typeof ctx>): [number, number] {
  if (value === undefined) return [b.w / 2, b.h / 2];
  const kw = value.trim().split(/\s+/);
  if (kw.every((k) => /^(left|right|top|bottom|center)$/.test(k))) {
    let x = b.w / 2;
    let y = b.h / 2;
    for (const k of kw) {
      if (k === 'left') x = 0;
      else if (k === 'right') x = b.w;
      else if (k === 'top') y = 0;
      else if (k === 'bottom') y = b.h;
    }
    return [x, y];
  }
  return evalPair(value, c);
}

/** The painted box of a zone at a text size: grown by `scale` about its origin, then moved by `translate` (the individual properties compose in that order). */
export function painted(z: Zone, ts: number): Box {
  const c = ctx(ts);
  let scale = 1;
  let origin: string | undefined;
  let translate = '0 0';
  for (const [rules, sel] of z.effects) {
    const s = lastDecl(rules, sel, 'scale');
    if (s !== undefined) scale = evalLength(s, c);
    const o = lastDecl(rules, sel, 'transform-origin');
    if (o !== undefined) origin = o;
    const t = lastDecl(rules, sel, 'translate');
    if (t !== undefined) translate = t === 'none' ? '0 0' : t;
  }
  const b = z.box;
  const [ox, oy] = originOf(origin, b, c);
  const [tx, ty] = evalPair(translate, c);
  const [pt, pr, pb, pl] = z.pad ?? [0, 0, 0, 0];
  const l = b.l + ox - scale * ox + tx;
  const t = b.t + oy - scale * oy + ty;
  return { l: l + pl * scale, t: t + pt * scale, w: b.w * scale - (pl + pr) * scale, h: b.h * scale - (pt + pb) * scale };
}

export const overlap = (a: Box, b: Box): number => Math.max(0, Math.min(a.l + a.w, b.l + b.w) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.t + a.h, b.t + b.h) - Math.max(a.t, b.t));

// Chapter I (FFX): the F1 sheets' own numbers.
export const ffxCmdRows = ((): { h: number } => {
  const row = num(f1ffx, '.ffxhud.hud-f1 .ig-cmd', 'height');
  const tail = num(f1ffx, '.ffxhud.hud-f1 .ig-cmd:nth-child(5):not(.ig-cmd--selected)', 'height');
  const gap = num(f1ffx, '.ffxhud.hud-f1 .ffx-cmd-area .ig-cmd-stack', 'gap');
  return { h: 4 * row + tail + 4 * gap }; // four verbs and the faded fifth, the command window F1 keeps at every size (`commandRowsCap`)
})();
const ffxParty = ((): Box => {
  const card = num(f1ffx, '.ffxhud.hud-f1 .ig-stat', 'height');
  const gap = num(f1ffx, '.ffxhud.hud-f1 .ig-stat-list', 'gap');
  const w = num(f1ffx, '.ffxhud.hud-f1 .ig-stat', 'width');
  const h = 3 * card + 2 * gap;
  return { l: num(f1ffx, '.ffxhud.hud-f1 .ig-stat-list', 'left'), t: 360 - num(f1ffx, '.ffxhud.hud-f1 .ig-stat-list', 'bottom') - h, w, h };
})();
const ffxCtb = ((): Box => {
  // three slots of 53.5; the strip is a tile (31) over a name (9) with the NOW chip above it: 60 is the generous height
  return { l: num(f1ffx, '.ffxhud.hud-f1 .ig-ctb', 'left'), t: num(f1ffx, '.ffxhud.hud-f1 .ig-ctb', 'top'), w: 3 * num(f1ffx, '.ffxhud.hud-f1 .ig-ctb__row', 'width'), h: 60 };
})();
const ffxSensor = ((): Box => {
  const c = { vw: 1600, vh: 900 };
  const w = num(ffxHud, '.ffx-sensor', 'width');
  const margin = parseFloat(lastDecl(f1, '.hud-f1.f1-intel .ffx-sensor', 'margin-top') ?? '0');
  return { l: evalLength(lastDecl(ffxHud, '.ffx-sensor', 'left')!, c), t: evalLength(lastDecl(ffxHud, '.ffx-sensor', 'top')!, c) + margin, w, h: 78 };
})();
export const boxOf = (rules: readonly CssRule[], sel: string, over: Partial<Box> = {}): Box => ({
  l: num(rules, sel, 'left'),
  t: num(rules, sel, 'top'),
  w: over.w ?? num(rules, sel, 'width'),
  h: over.h ?? num(rules, sel, 'height'),
});

export const FFX_ZONES: Zone[] = [
  { name: 'boss ribbon', box: boxOf(f1, '.f1-ribbon'), effects: [[f1text, `${FFX_PFX} .ffxhud.hud-f1 .f1-ribbon`]] },
  // the hero is a flex row: its width is the face (26), a gap (6) and a name; 150 is more than Kimahri's
  { name: 'hero', box: boxOf(f1, '.f1-hero', { w: 150 }), effects: [[f1text, `${FFX_PFX} .ffxhud.hud-f1 .f1-hero`]] },
  { name: 'cue', box: boxOf(f1, '.f1-cue'), effects: [[f1text, `${FFX_PFX} .ffxhud.hud-f1 .f1-cue`]] },
  { name: 'verbs', box: { l: num(f1ffx, '.ffxhud.hud-f1 .ffx-cmd-area', 'left'), t: num(f1ffx, '.ffxhud.hud-f1 .ffx-cmd-area', 'top'), w: num(f1ffx, '.ffxhud.hud-f1 .ffx-cmd-area', 'width'), h: ffxCmdRows.h }, effects: [[tsFfx, `${FFX_PFX} .ffxhud__stage > .ffx-cmd-area`], [f1text, `${FFX_PFX} .ffxhud.hud-f1 .ffx-cmd-area`]] },
  { name: 'prompt bar', box: boxOf(f1, '.f1-prompts'), effects: [[f1text, `${FFX_PFX} .ffxhud.hud-f1 .f1-prompts`]] },
  { name: 'turn strip', box: ffxCtb, effects: [[tsFfx, `${FFX_PFX} .ffxhud__stage > .ig-ctb`]] },
  { name: 'party cards', box: ffxParty, effects: [[tsFfx, `${FFX_PFX} .ffxhud__stage > .ig-stat-list`]] },
  // Intel's Sensor card (shown behind X only; the layout test reads the Intel layout): 100 x 78 (the plate's size, `ffx-hud.css`), its place `left` / `top` less Intel's margin-top
  { name: 'sensor card (Intel)', box: ffxSensor, effects: [[tsFfx, `${FFX_PFX} .ffxhud__stage > .ffx-sensor`], [f1text, `${FFX_PFX} .ffxhud.hud-f1:not(.f1-acting) .ffx-sensor`]] },
];

// Chapter IV (FFX-2).
const x2Command = ((): Zone => {
  const sel = '.ffx2hud.hud-f1 .ffx2hud__command';
  const w = num(f1ffx2, sel, 'width');
  const h = num(f1ffx2, sel, 'max-height');
  const pad = declsOf(`x:${lastDecl(f1ffx2, sel, 'padding')}`)[0]![1].split(/\s+/).map(parseFloat) as [number, number, number, number];
  return {
    name: 'verbs',
    box: { l: 640 - num(f1ffx2, sel, 'right') - w, t: num(f1ffx2, sel, 'top'), w, h },
    pad: [pad[0]!, pad[1]!, pad[2]!, pad[3]!],
    effects: [[tsWide, `${FFX2_PFX} .ffx2hud__stage > .ffx2hud__command`], [f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .ffx2hud__command`]],
  };
})();
export const x2Party = ((): Box => {
  const card = num(f1ffx2, '.ffx2hud.hud-f1 .ig-stat', 'height');
  const gap = num(f1ffx2, '.ffx2hud.hud-f1 .ig-stat-list', 'gap');
  const h = 3 * card + 2 * gap;
  return { l: num(f1ffx2, '.ffx2hud.hud-f1 .ig-stat-list', 'left'), t: 360 - num(f1ffx2, '.ffx2hud.hud-f1 .ig-stat-list', 'bottom') - h, w: num(f1ffx2, '.ffx2hud.hud-f1 .ig-stat', 'width'), h };
})();
export const FFX2_ZONES: Zone[] = [
  { name: 'boss ribbon', box: boxOf(f1, '.f1-ribbon'), effects: [[f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .f1-ribbon`]] },
  { name: 'hero', box: { l: num(f1ffx2, '.ffx2hud.hud-f1 .f1-hero', 'left'), t: num(f1ffx2, '.ffx2hud.hud-f1 .f1-hero', 'top'), w: 150, h: num(f1, '.f1-hero', 'height') }, effects: [[f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .f1-hero`]] },
  { name: 'cue', box: { l: num(f1ffx2, '.ffx2hud.hud-f1 .f1-cue', 'left'), t: num(f1ffx2, '.ffx2hud.hud-f1 .f1-cue', 'top'), w: num(f1ffx2, '.ffx2hud.hud-f1 .f1-cue', 'width'), h: num(f1, '.f1-cue', 'height') }, effects: [[f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .f1-cue`]] },
  x2Command,
  { name: 'prompt bar', box: { l: num(f1, '.f1-prompts', 'left'), t: num(f1, '.f1-prompts', 'top'), w: num(f1ffx2, '.ffx2hud.hud-f1 .f1-prompts', 'width'), h: num(f1, '.f1-prompts', 'height') }, effects: [[f1text, `${FFX2_PFX} .ffx2hud.hud-f1 .f1-prompts`]] },
  { name: 'party cards', box: x2Party, effects: [[tsWide, `${FFX2_PFX} .ffx2hud__stage > .ffx2hud__party`]] },
];

