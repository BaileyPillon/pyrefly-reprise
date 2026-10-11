/**
 * SFX parity, the pack layout: how the planned originals divide into packs and what quality each pack ships at, so the whole
 * set stays inside the audio budget (`manifest-io.mjs` `AUDIO_BUDGET_BYTES`, which `qa.mjs` gates on) and every pack stays
 * under the 5 MB sprite gate. The command is `sfx-parity-layout.mjs`; this is the arithmetic, kept apart so the unit test can
 * run it on made-up rows.
 *
 * The numbers it works from are measured. The v2 sprite ships at LAME V0 and costs 25.7 KB per second of audio
 * (`sfxV2.bytes / duration`); the same audio at `-q:a 3` costs 17.2 KB/s and at `-q:a 5` 12.4 KB/s (measured on the v2 set,
 * 2026-10-11; the spec's table says 17.3 for q3). A pack costs its cues' seconds plus the 50 ms gaps the packer lays between
 * them, at its quality's rate.
 *
 * The levers, in the order the accepted rule gives (spec 5.2, decision 52m) and what each costs:
 *   0. the v2 repack first: the sprite gives back what the retired cues cost (`sfx-parity-retire.mjs`);
 *   1. boss packs at q3, the biggest first (a boss fight is long and its sounds are low and swelling, which hide coding noise);
 *   2. shorter long-tail rows (the 12 s Slow bed, the 11 s Dispel bed, the 11 to 14 s aeon Overdrives): the planner names which
 *      rows to cut and by how much, never cuts one;
 *   3. only then a bigger budget, which is Bailey's. What is still missing is reported in bytes.
 * Beyond the spec's list, and offered separately because each needs a yes: the core packs at q3 (they play in every fight, so a
 * coding artifact there is heard most), and q5 on the boss packs.
 *
 * Pure: no files, no DOM. Game case: both (each pack belongs to one game, named so; the plan keeps them apart).
 */

/** Bytes per second of cue audio at each quality. */
export const RATE_BPS = { V0: 25_700, q3: 17_300, q5: 12_400 };

/** The packer lays 50 ms of silence before the first cue and after each one. */
export const GAP_SECONDS = 0.05;

/** A pack is one sprite and each sprite is held under this (the QA gate). */
export const PACK_GATE_BYTES = 5_000_000;

/** What a pack of `cues` cues and `seconds` seconds costs at `quality`. */
export const packBytes = (seconds, cues, quality) => Math.round((seconds + GAP_SECONDS * (cues + 1)) * RATE_BPS[quality]);

const defaultIsCore = (pack) => /^ffx2?-core$/.test(pack);
const mb = (bytes) => `${(bytes / 1e6).toFixed(2)} MB`;

/** Group the rows into packs by their `pack`; a `both` row (the menu assets the games share) is carried in each game's core pack. */
export function groupRows(rows) {
  const out = new Map();
  const add = (pack, row) => {
    const p = out.get(pack) ?? { rows: [], seconds: 0 };
    p.rows.push(row);
    p.seconds += row.secs;
    out.set(pack, p);
  };
  for (const row of rows) {
    if (row.secs <= 0) continue;
    if (row.game === 'both') {
      add('ffx-core', row);
      add('ffx2-core', row);
    } else add(row.pack, row);
  }
  return out;
}

/** @param {import('./sfx-parity-layout-lib.d.mts').LayoutInput} input */
export function planLayout(input) {
  const isCore = input.isCore ?? defaultIsCore;
  const groups = groupRows(input.rows);
  const reserve = input.reserveBytes ?? 0;
  const allowanceBytes = input.budgetBytes - input.shippedBytes + (input.repackSavingBytes ?? 0) - reserve;
  const levers = [];
  const problems = [];
  const packs = [...groups.entries()]
    .map(([pack, g]) => ({ pack, kind: isCore(pack) ? 'core' : 'boss', quality: 'V0', cues: g.rows.length, seconds: g.seconds, bytes: packBytes(g.seconds, g.rows.length, 'V0') }))
    .sort((a, b) => a.pack.localeCompare(b.pack));
  const total = () => packs.reduce((s, p) => s + p.bytes, 0);
  const set = (p, q) => {
    const before = p.bytes;
    p.quality = q;
    p.bytes = packBytes(p.seconds, p.cues, q);
    return before - p.bytes;
  };

  if ((input.repackSavingBytes ?? 0) > 0) levers.push({ lever: 0, what: `the v2 repack first: the sprite gives back ${mb(input.repackSavingBytes)}`, savedBytes: input.repackSavingBytes });

  // Lever 1: boss packs to q3, the biggest first, only while the set is over the allowance or a pack is over the gate.
  const bossBySize = packs.filter((p) => p.kind === 'boss' && p.quality === 'V0').sort((a, b) => b.bytes - a.bytes);
  for (const p of bossBySize) {
    if (total() <= allowanceBytes && p.bytes < PACK_GATE_BYTES) break;
    levers.push({ lever: 1, what: `${p.pack} (boss pack) at q3`, savedBytes: set(p, 'q3') });
  }

  // A pack over the gate must drop in quality too, whichever kind it is (the gate is not the budget's).
  for (const p of packs.filter((x) => x.bytes >= PACK_GATE_BYTES && x.quality === 'V0')) {
    levers.push({ lever: 'x', what: `${p.pack} at q3 to get under the ${mb(PACK_GATE_BYTES)} sprite gate`, savedBytes: set(p, 'q3'), needsYes: p.kind === 'core' });
  }

  // Lever 2: name the long rows to shorten (never shortens one): longest first, until the set would fit.
  const trimCandidates = [];
  if (total() > allowanceBytes) {
    const longRows = input.rows
      .filter((r) => r.secs > 6)
      .map((r) => ({ r, p: packs.find((x) => x.pack === r.pack) }))
      .filter((x) => !!x.p)
      .sort((a, b) => b.r.secs - a.r.secs);
    let need = total() - allowanceBytes;
    for (const { r, p } of longRows) {
      if (need <= 0) break;
      const cutTo = Math.max(4, Math.round(r.secs / 2));
      const saved = Math.round((r.secs - cutTo) * RATE_BPS[p.quality]);
      if (saved <= 0) continue;
      trimCandidates.push({ row: r.id, pack: r.pack, secs: r.secs, savedBytes: saved, cutTo });
      need -= saved;
    }
    const gain = trimCandidates.reduce((s, t) => s + t.savedBytes, 0);
    if (trimCandidates.length > 0) levers.push({ lever: 2, what: `shorten ${trimCandidates.length} long-tail row(s), the longest first (see trimCandidates)`, savedBytes: gain });
  }

  // Beyond the spec's list: core packs at q3, then boss packs at q5 (each needs a yes).
  let projected = total() - trimCandidates.reduce((s, t) => s + t.savedBytes, 0);
  if (projected > allowanceBytes) {
    const cores = packs.filter((p) => p.kind === 'core' && p.quality === 'V0');
    const gain = cores.reduce((s, p) => s + (p.bytes - packBytes(p.seconds, p.cues, 'q3')), 0);
    if (cores.length > 0) {
      levers.push({ lever: 'x', what: 'core packs at q3 (they play in every fight of their game: a coding artifact there is heard most)', savedBytes: gain, needsYes: true });
      projected -= gain;
    }
  }
  if (projected > allowanceBytes) {
    const gain = packs.filter((p) => p.kind === 'boss').reduce((s, p) => s + (packBytes(p.seconds, p.cues, p.quality) - packBytes(p.seconds, p.cues, 'q5')), 0);
    if (gain > 0) {
      levers.push({ lever: 'x', what: 'boss packs at q5 (12.4 KB/s: a coarser code for long, low sounds)', savedBytes: gain, needsYes: true });
      projected -= gain;
    }
  }

  const overGate = packs.filter((p) => p.bytes >= PACK_GATE_BYTES);
  for (const p of overGate) problems.push(`${p.pack} is ${mb(p.bytes)} at ${p.quality}, over the ${mb(PACK_GATE_BYTES)} sprite gate: cut the pack in two`);
  const shortfall = projected - allowanceBytes;
  if (shortfall > 0) {
    levers.push({ lever: 3, what: `still ${mb(shortfall)} over: a bigger budget is Bailey's call`, savedBytes: 0 });
    problems.push(`even after every lever the packs are ${mb(shortfall)} over the audio budget`);
  }

  const bytes = total();
  return {
    packs,
    packBytes: bytes,
    allowanceBytes,
    headroomBytes: allowanceBytes - bytes,
    // "fits" means the levers the spec lists (0 to 2) are enough; the ones that need a yes are reported, not counted.
    fits: bytes - trimCandidates.reduce((s, t) => s + t.savedBytes, 0) <= allowanceBytes && overGate.length === 0,
    levers,
    trimCandidates,
    problems,
  };
}
