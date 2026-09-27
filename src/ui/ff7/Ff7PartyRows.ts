/**
 * FF7's band: the names window (NAME, BARRIER) at the left and the status
 * window (HP, MP, LIMIT, TIME) at the right, over FF7's black strip
 * (FF7 only; `docs/plans/ff7-hud-faithful-a-spec.md` §3.2, §5.2, §5.4).
 *
 * Headers once, on the top frame line, in small grey caps with a dark edge;
 * no per-row labels, no enemy name, no gold active name [spec §7 items 4, 5,
 * 15]. HP is `cur/ max` in two right-aligned fields of one size; MP shows the
 * current value only [spec §3.2, verified: S1 + 6 stills].
 */

import { barrierBox, box, gauge, statLine, text, windowHtml, type Origin } from './ff7Draw.ts';
import type { Ff7Geometry } from './ff7Geometry.ts';
import type { Ff7RowView } from './ff7HudModel.ts';
import { FF7_WINDOW_COLOUR, TEXT, type CylinderKey } from './ff7Tokens.ts';

/** Which of the two blink colours a full Limit gauge shows now [spec §3.4; rate our estimate]. */
export type BlinkPhase = 0 | 1;

function header(g: Ff7Geometry, o: Origin, x: number, base: number, str: string, align: 'l' | 'r' = 'l'): string {
  return text(o, x, base, g.hdrCap, str, { color: TEXT.header, outline: g.hdrEdge, align, cls: 'ff7-hdr', track: 0.04 });
}

function limitFill(r: Ff7RowView, blink: BlinkPhase): CylinderKey {
  if (r.limitReady) return blink === 0 ? 'limitMint' : 'limitPeach';
  return r.limitMode === 'fury' ? 'fury' : r.limitMode === 'sadness' ? 'sadness' : 'limit';
}

/**
 * The names window. On phone B each name is already at the left of its status row, so this
 * window keeps only its BARRIER column (FF7 shows each name once; the review's item 16).
 */
export function namesWindowHtml(g: Ff7Geometry, rows: readonly Ff7RowView[]): string {
  const L = g.left;
  const names = g.right.nameX === undefined;
  return windowHtml(g.bandL, { colour: FF7_WINDOW_COLOUR, frame: g.frame, radius: g.radius, name: 'names' }, (o) => {
    let h = (names ? header(g, o, L.nameX, L.hdrBase, 'NAME') : '') + header(g, o, L.barrierRight, L.hdrBase, 'BARRIER', 'r');
    rows.forEach((r, i) => {
      const yc = L.rows[i];
      if (yc === undefined) return;
      h += (names ? text(o, L.nameX, yc + g.cap / 2, g.cap, r.name, { shadow: g.shadow, color: TEXT.body, cls: 'ff7-name', data: { id: r.id } }) : '') +
        barrierBox(o, L.barrierRight, yc, g.s, r.barrier, r.mbarrier);
    });
    return h;
  });
}

/** The status window. */
export function statusWindowHtml(g: Ff7Geometry, rows: readonly Ff7RowView[], blink: BlinkPhase): string {
  const R = g.right;
  return windowHtml(g.bandR, { colour: FF7_WINDOW_COLOUR, frame: g.frame, radius: g.radius, name: 'status' }, (o) => {
    let h = header(g, o, R.hdr.hp, R.hdrBase, 'HP') + header(g, o, R.hdr.mp, R.hdrBase, 'MP') +
      header(g, o, R.hdr.limit, R.hdrBase, 'LIMIT') + header(g, o, R.hdr.time, R.hdrBase, 'TIME') +
      (R.nameX !== undefined ? header(g, o, R.nameX, R.hdrBase, 'NAME') : ''); // phone B
    rows.forEach((r, i) => {
      const yc = R.rows[i];
      if (yc === undefined) return;
      const base = yc + g.cap / 2;
      const lineY = yc + 5 * g.s;
      const hpCol = r.hpLow ? TEXT.low : TEXT.body;
      const t = { shadow: g.shadow, color: hpCol };
      h += `<div class="ff7-row" data-id="${r.id}">` +
        (R.nameX !== undefined ? text(o, R.nameX, base, g.cap, r.name, { shadow: g.shadow, color: TEXT.body, cls: 'ff7-name ff7-name--row', data: { id: r.id } }) : '') +
        text(o, R.curEnd, base, g.cap, String(r.hp), { ...t, align: 'r', cls: 'ff7-hp' }) +
        text(o, R.curEnd, base, g.cap, '/', t) +
        text(o, R.maxEnd, base, g.cap, String(r.maxHp), { ...t, align: 'r', cls: 'ff7-hpmax' }) +
        statLine(o, R.hp0, R.maxEnd - R.hp0, lineY, g.s, r.maxHp > 0 ? r.hp / r.maxHp : 0, 'hp') +
        text(o, R.mpEnd, base, g.cap, String(r.mp), { shadow: g.shadow, align: 'r', cls: 'ff7-mp' }) +
        statLine(o, R.mpLine0, R.mpEnd - R.mpLine0, lineY, g.s, r.maxMp > 0 ? r.mp / r.maxMp : 0, 'mp') +
        gauge(o, R.limitX, yc, R.gaugeW, R.gaugeH, g.s, r.limit, limitFill(r, blink), `ff7-limit${r.limitReady ? ' is-full' : ''}`) +
        gauge(o, R.timeX, yc, R.gaugeW, R.gaugeH, g.s, r.time, r.timeFull ? 'timeFull' : 'time', `ff7-time${r.timeFull ? ' is-full' : ''}`) +
        '</div>';
    });
    return h;
  });
}

/** FF7's black strip under the band [spec §3.2, measured]. */
export function stripHtml(g: Ff7Geometry): string {
  return box({ x: 0, y: 0 }, 0, g.strip, g.W, g.H - g.strip, 'ff7-strip');
}
