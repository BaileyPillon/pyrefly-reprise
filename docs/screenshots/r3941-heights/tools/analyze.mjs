// analyze.mjs: read frames/*.json (capture.mjs) and write the before/after numbers for r3941-heights.
//   node analyze.mjs --dir=frames --out=analysis.json --text=analysis.txt
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=')]; }));
const DIR = args.dir ?? 'frames';
import { FFX_PARTY_STATURE } from '../../../../src/data/ffx/party-stature.ts'; // the table itself (Node strips the types)
const RATIO = Object.fromEntries(Object.entries(FFX_PARTY_STATURE).map(([id, row]) => [id, row.ratio]));

const load = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('-before.json'));

/** Area of a convex quad clipped to an axis-aligned box (Sutherland-Hodgman). */
function quadBoxOverlap(q, b) {
  let poly = q.slice();
  const edges = [(p) => p.x - b.x, (p) => b.x + b.w - p.x, (p) => p.y - b.y, (p) => b.y + b.h - p.y];
  for (const inside of edges) {
    const next = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]; const r = poly[(i + 1) % poly.length];
      const dp = inside(p); const dr = inside(r);
      if (dp >= 0) next.push(p);
      if ((dp >= 0) !== (dr >= 0)) { const t = dp / (dp - dr); next.push({ x: p.x + (r.x - p.x) * t, y: p.y + (r.y - p.y) * t }); }
    }
    poly = next;
    if (poly.length < 3) return 0;
  }
  let area = 0;
  for (let i = 0; i < poly.length; i++) { const p = poly[i]; const r = poly[(i + 1) % poly.length]; area += p.x * r.y - r.x * p.y; }
  return Math.abs(area) / 2;
}
const boxOverlap = (a, b) => { const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x); const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return w > 0 && h > 0 ? w * h : 0; };
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const r3 = (x) => (x == null ? null : Math.round(x * 1000) / 1000);

/** Vertical room between a figure's head and the nearest HUD panel above it (panels that share some of its width), px; null when nothing is above it. */
function clearAbove(d, id) {
  const r = d.rects[id];
  if (!r) return null;
  let best = null;
  for (const p of d.panels) {
    const xs = p.quad.map((q) => q.x); const left = Math.min(...xs); const right = Math.max(...xs);
    if (right < r.x || left > r.x + r.w) continue;
    const bottom = Math.max(...p.quad.map((q) => q.y));
    if (bottom > r.y + 4) continue; // not above the head: an overlap, counted as a hit instead
    const gap = r.yMin - bottom;
    if (best === null || gap < best.gap) best = { gap: Math.round(gap), panel: p.sel };
  }
  return best;
}

function describe(d) {
  const party = Object.entries(d.actors).filter(([id, a]) => a.side === 'party' && d.combatants[id]?.alive !== false).map(([id]) => id);
  const rects = d.rects;
  const hits = [];
  for (const p of d.panels) {
    for (const id of party) {
      const r = rects[id];
      if (!r) continue;
      const px = quadBoxOverlap(p.quad, { x: r.x, y: r.y, w: r.w, h: r.h });
      if (px < 1) continue;
      const face = quadBoxOverlap(p.quad, { x: r.x, y: r.y, w: r.w, h: r.h / 3 });
      hits.push({ panel: p.sel, actor: id, px: Math.round(px), facePx: Math.round(face) });
    }
  }
  // CHK-008's own definition: a panel must not cover a face or a weapon (the stage's key-feature boxes of each idle painting, on screen)
  const kfHits = [];
  for (const p of d.panels) {
    for (const [i, k] of (d.keyFeatures ?? []).entries()) {
      const px = quadBoxOverlap(p.quad, k);
      if (px >= 1) kfHits.push({ panel: p.sel, feature: i, px: Math.round(px), of: Math.round(k.w * k.h) });
    }
  }
  const pairs = [];
  for (let i = 0; i < party.length; i++) for (let j = i + 1; j < party.length; j++) {
    const a = rects[party[i]]; const b = rects[party[j]];
    if (!a || !b) continue;
    const ov = boxOverlap(a, b);
    pairs.push({ a: party[i], b: party[j], share: r3(ov / Math.max(1, Math.min(a.w * a.h, b.w * b.h))) });
  }
  return { party, hits, pairs, kfHits };
}

const rows = [];
for (const f of files) {
  const tagBase = f.replace(/-before\.json$/, '');
  if (!fs.existsSync(path.join(DIR, `${tagBase}-after.json`))) continue;
  const B = load(f); const A = load(`${tagBase}-after.json`);
  const dB = describe(B); const dA = describe(A);
  const chapter = B.meta.chapter; const vp = `${B.viewport.w}x${B.viewport.h}`;
  const figs = dA.party.map((id) => {
    const rb = B.rects[id]; const ra = A.rects[id];
    const ab = B.actors[id]; const aa = A.actors[id];
    return {
      id, ratio: RATIO[id] ?? null,
      worldBefore: r3(ab?.height), worldAfter: r3(aa?.height), worldRatio: r3(aa?.height / ab?.height),
      pxBefore: r1(rb?.h), pxAfter: r1(ra?.h), pxRatio: r3(ra?.h / rb?.h),
      topBefore: r1(rb?.y), topAfter: r1(ra?.y), topMinBefore: r1(rb?.yMin), topMinAfter: r1(ra?.yMin),
      xBefore: r1(rb?.x), wBefore: r1(rb?.w), xAfter: r1(ra?.x), wAfter: r1(ra?.w), hBefore: r1(rb?.h), hAfter: r1(ra?.h),
      bottomAfter: r1(ra?.y + ra?.h),
      leftAfter: r1(ra?.x), rightAfter: r1(ra?.x + ra?.w),
      visibleInFrameBefore: r3(rb?.visibleInFrame), visibleInFrameAfter: r3(ra?.visibleInFrame),
      visibleBefore: r3(rb?.visible), visibleAfter: r3(ra?.visible),
      offFrameBefore: r3(Math.max(0, (rb?.visible ?? 1) - (rb?.visibleInFrame ?? 1))), offFrameAfter: r3(Math.max(0, (ra?.visible ?? 1) - (ra?.visibleInFrame ?? 1))),
      chk011Before: !!rb && (1 - rb.visible > 0.25 || 1 - rb.visibleInFrame > 0.25), chk011After: !!ra && (1 - ra.visible > 0.25 || 1 - ra.visibleInFrame > 0.25),
      aboveBefore: clearAbove(B, id), aboveAfter: clearAbove(A, id),
      feetMovedWorld: ab && aa ? r3(Math.hypot(...aa.pos.map((v, i) => v - ab.pos[i]))) : null,
      shadowBaseBefore: r3(ab?.shadowBase), shadowBaseAfter: r3(aa?.shadowBase), ringBaseBefore: r3(ab?.ringBase), ringBaseAfter: r3(aa?.ringBase),
    };
  });
  const newChk011 = figs.filter((f) => f.chk011After && !f.chk011Before).map((f) => f.id);
  const fixedChk011 = figs.filter((f) => f.chk011Before && !f.chk011After).map((f) => f.id);
  const tallest = [...figs].sort((p, q) => p.topMinAfter - q.topMinAfter)[0];
  const bossIds = Object.keys(A.rects).filter((id) => A.actors[id]?.side === 'enemy' && A.combatants[id]?.alive !== false);
  const tallBoss = (D) => bossIds.map((id) => ({ id, h: r1(D.rects[id]?.h), top: r1(D.rects[id]?.y) })).sort((p, q) => q.h - p.h)[0] ?? null;
  const camMove = Math.hypot(...A.camera.pos.map((v, i) => v - B.camera.pos[i]));
  const mB = B.framing?.master ?? null; const mA = A.framing?.master ?? null;
  const masterMove = mA && mB ? Math.hypot(...mA.pos.map((v, i) => v - mB.pos[i])) : null;
  const masterLook = mA && mB ? Math.hypot(...mA.look.map((v, i) => v - mB.look[i])) : null;
  const lensMove = A.framing?.lens && B.framing?.lens ? Math.hypot(A.framing.lens[0] - B.framing.lens[0], A.framing.lens[1] - B.framing.lens[1]) : null;
  const newHits = dA.hits.filter((h) => !dB.hits.some((o) => o.panel === h.panel && o.actor === h.actor));
  const worse = dA.hits.filter((h) => { const o = dB.hits.find((x) => x.panel === h.panel && x.actor === h.actor); return o && (h.px > o.px * 1.15 + 50 || h.facePx > o.facePx + 50); });
  rows.push({
    chapter, viewport: vp, party: dA.party, figs,
    tallest: tallest ? { id: tallest.id, topMinAfter: tallest.topMinAfter, topMinBefore: tallest.topMinBefore } : null,
    topClearanceAfter: tallest ? tallest.topMinAfter : null,
    boss: { before: tallBoss(B), after: tallBoss(A), bossPxBefore: B.framing?.bossPx ?? null, bossPxAfter: A.framing?.bossPx ?? null },
    framing: { partyPxBefore: B.framing?.livePartyPx ?? B.framing?.fitPartyPx ?? null, partyPxAfter: A.framing?.livePartyPx ?? A.framing?.fitPartyPx ?? null, scaleBefore: B.framing?.scale ?? null, scaleAfter: A.framing?.scale ?? null, plansBefore: B.framing?.plans ?? null, plansAfter: A.framing?.plans ?? null, liveOkBefore: B.framing?.liveOk ?? null, liveOkAfter: A.framing?.liveOk ?? null },
    cameraMove: r3(camMove), masterMove: r3(masterMove), masterLookMove: r3(masterLook), lensMove: r3(lensMove), masterFov: [mB?.fov ?? null, mA?.fov ?? null],
    pairsBefore: dB.pairs, pairsAfter: dA.pairs,
    newChk011, fixedChk011,
    keyFeatureHitsBefore: dB.kfHits.length, keyFeatureHitsAfter: dA.kfHits.length, keyFeaturesBefore: (B.keyFeatures ?? []).length, keyFeaturesAfter: (A.keyFeatures ?? []).length,
    keyFeatureHitsAfterList: dA.kfHits, keyFeatureHitsBeforeList: dB.kfHits,
    hitsBefore: dB.hits.length, hitsAfter: dA.hits.length, faceHitsBefore: dB.hits.filter((h) => h.facePx > 0).length, faceHitsAfter: dA.hits.filter((h) => h.facePx > 0).length,
    newHits, worseHits: worse, allHitsAfter: dA.hits,
    errors: [...B.meta.errors, ...A.meta.errors], gl: A.gl, seconds: [B.meta.secondsToMeasure, A.meta.secondsToMeasure],
  });
}
rows.sort((a, b) => a.chapter.localeCompare(b.chapter) || a.viewport.localeCompare(b.viewport));
fs.writeFileSync(args.out ?? 'analysis.json', JSON.stringify(rows, null, 1));

const lines = [];
for (const r of rows) {
  lines.push(`\n== ${r.chapter} @ ${r.viewport}  party ${r.party.join(', ')}  live camera moved ${r.cameraMove} (sway included), master pose moved ${r.masterMove} (look ${r.masterLookMove}, lens ${r.lensMove}, fov ${r.masterFov.join(' -> ')})  errors ${r.errors.length}`);
  for (const f of r.figs) {
    lines.push(`  ${f.id.padEnd(8)} feet (the actor's ground point) moved ${f.feetMovedWorld} world units`);
    lines.push(`  ${f.id.padEnd(8)} head room above: ${f.aboveBefore ? `${f.aboveBefore.gap}px under ${f.aboveBefore.panel}` : 'no panel above'} -> ${f.aboveAfter ? `${f.aboveAfter.gap}px under ${f.aboveAfter.panel}` : 'no panel above'}; to the viewport top ${f.topMinBefore} -> ${f.topMinAfter}px; off frame ${f.offFrameBefore} -> ${f.offFrameAfter}`);
    lines.push(`  ${f.id.padEnd(8)} world ${f.worldBefore} -> ${f.worldAfter} (x${f.worldRatio}, table ${f.ratio})  screen h ${f.pxBefore} -> ${f.pxAfter} px (x${f.pxRatio})  top ${f.topBefore} -> ${f.topAfter} (min over window ${f.topMinBefore} -> ${f.topMinAfter})  inFrame ${f.visibleInFrameBefore} -> ${f.visibleInFrameAfter}  visible ${f.visibleBefore} -> ${f.visibleAfter}`);
  }
  lines.push(`  boss rect: ${JSON.stringify(r.boss.before)} -> ${JSON.stringify(r.boss.after)}  framing bossPx ${r.boss.bossPxBefore} -> ${r.boss.bossPxAfter}  partyPx ${r.framing.partyPxBefore} -> ${r.framing.partyPxAfter}  scale ${r.framing.scaleBefore} -> ${r.framing.scaleAfter}  plans ${r.framing.plansBefore} -> ${r.framing.plansAfter}`);
  lines.push(`  CHK-011 (a party figure under 75 percent clear or in frame): before ${r.figs.filter((f) => f.chk011Before).map((f) => f.id).join(',') || 'none'}; after ${r.figs.filter((f) => f.chk011After).map((f) => f.id).join(',') || 'none'}; newly failing: ${r.newChk011.join(',') || 'none'}; newly passing: ${r.fixedChk011.join(',') || 'none'}`);
  lines.push(`  CHK-008 faces and weapons under a panel (${r.keyFeaturesBefore} -> ${r.keyFeaturesAfter} boxes): ${r.keyFeatureHitsBefore} -> ${r.keyFeatureHitsAfter}${r.keyFeatureHitsAfter ? '  after: ' + r.keyFeatureHitsAfterList.map((h) => `${h.panel} covers ${h.px} of ${h.of} px`).join('; ') : ''}`);
  lines.push(`  HUD hits ${r.hitsBefore} -> ${r.hitsAfter} (face hits ${r.faceHitsBefore} -> ${r.faceHitsAfter}); new: ${r.newHits.map((h) => `${h.actor}/${h.panel} ${h.px}px face ${h.facePx}`).join('; ') || 'none'}; worse: ${r.worseHits.map((h) => `${h.actor}/${h.panel} ${h.px}px face ${h.facePx}`).join('; ') || 'none'}`);
  lines.push(`  party overlap (share of the smaller box): before ${r.pairsBefore.map((p) => `${p.a}-${p.b} ${p.share}`).join(', ')} | after ${r.pairsAfter.map((p) => `${p.a}-${p.b} ${p.share}`).join(', ')}`);
}
fs.writeFileSync(args.text ?? 'analysis.txt', lines.join('\n') + '\n');
console.log(lines.join('\n'));
