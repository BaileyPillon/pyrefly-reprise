// Route driver: the pure decisions the capture harness makes, kept free of the
// browser so a unit test can hold them (PR-0225, round 15). Game case: both
// (shared critic tooling); the letter rule below is FFX only, as its source is.
//
//   - letterTagMap / resolveTargetId: which on-screen target a lettered name
//     ("Yu Pagoda A") means. Mirrors `src/battle/ffx/letterTags.ts#letterTagsOf`
//     (the rule the CTB tile, the name plate and the advisor card share); the
//     unit test runs both on the same roster so the copy cannot drift.
//   - dboxStep: how the dialogue recorder decides "one entry per show".
//   - isAllDisabledOverlay: an open menu with nothing choosable in it.
//
// dboxStep is also injected into the page (Function#toString), so it must stay
// self-contained: no imports, no closures over module scope.

/** `A`, `B`... per duplicate of one enemy name, in roster order. Mirrors letterTagsOf. */
export function letterTagMap(enemyIds, nameOf) {
  const byName = new Map();
  for (const id of enemyIds) {
    const name = nameOf(id);
    if (name === undefined || name === null) continue;
    if (byName.has(name)) byName.get(name).push(id);
    else byName.set(name, [id]);
  }
  const tags = new Map();
  for (const group of byName.values()) {
    if (group.length < 2) continue; // a unique enemy never gains a letter
    group.forEach((id, i) => tags.set(id, String.fromCharCode(65 + i)));
  }
  return tags;
}

export const slugOf = (name) => String(name ?? '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * The `data-target-id` a target name means, or null when it cannot be told.
 * `roster` is `{ enemyIds, names: { [id]: displayName } }` read from the live
 * battle state; `domIds` are the ids on screen right now (the reticles).
 * Order: exact display name, name plus trailing letter (through the letter
 * rule), then the old slug prefix match (FFX-2 rows and ids that spell the name).
 */
export function resolveTargetId(name, roster, domIds) {
  const raw = String(name ?? '').trim();
  if (!raw) return null;
  const onScreen = (id) => domIds.includes(id);
  const names = roster?.names ?? {};
  const enemyIds = roster?.enemyIds ?? [];
  const lower = raw.toLowerCase();
  const byName = enemyIds.filter((id) => onScreen(id) && String(names[id] ?? '').toLowerCase() === lower);
  if (byName.length === 1) return byName[0];
  const m = /^(.*\S)\s+([A-Z])$/.exec(raw);
  if (m) {
    const [, base, letter] = m;
    const tags = letterTagMap(enemyIds, (id) => names[id]);
    const hit = enemyIds.find((id) => String(names[id] ?? '').toLowerCase() === base.toLowerCase() && tags.get(id) === letter);
    if (hit && onScreen(hit)) return hit;
    if (hit) return null; // the named enemy is not a choice right now: never fall through to a neighbour
  }
  const slug = slugOf(raw);
  if (!slug) return null;
  return domIds.find((id) => id.startsWith(slug) || slug.startsWith(id)) ?? null;
}

/** A visible command stack whose rows are all disabled: nothing a player can choose. */
export const isAllDisabledOverlay = (rows) => rows.length > 0 && rows.every((r) => r.disabled);

/**
 * One step of the dialogue recorder. `mem` is `{ lines, seen }`; `cur` is the
 * `.dbox.dbox--visible` box as read now (`{ speaker, role, text, portrait, narrate }`),
 * or null when no box is showing. One entry per SHOW: a line that grows from what
 * was seen (the typewriter) extends the entry; a new speaker, a line that is not an
 * extension (shorter or different: a repeat included) or a box that went away in
 * between starts a new one. Returns the entry that grew, a new one, or null.
 */
export function dboxStep(mem, cur, now, screen) {
  if (!cur) {
    if (mem.seen && mem.lines.length) mem.lines[mem.lines.length - 1].endMs = now;
    mem.seen = null;
    return null;
  }
  const text = cur.text;
  if (!text) { mem.seen = null; return null; } // a show has begun and nothing is typed yet
  const seen = mem.seen;
  const last = mem.lines[mem.lines.length - 1];
  if (seen && last && seen.speaker === cur.speaker && text.startsWith(seen.text)) {
    if (text.length > seen.text.length) { last.text = text; seen.text = text; }
    last.lastMs = now;
    return last;
  }
  const line = { ms: now, lastMs: now, screen, speaker: cur.speaker, role: cur.role, text, portrait: cur.portrait, narrate: cur.narrate, show: mem.lines.length + 1 };
  mem.lines.push(line);
  mem.seen = { speaker: cur.speaker, text };
  return line;
}

// ---------------------------------------------------------------------------
// PR-0261 (critic round 19, widened): what the harness types into an Overdrive
// overlay, and how it reads the end of a route. Game case: FFX only for the two
// overlays (Bushido is Auron's, Swordplay is Tidus's: src/ui/ffx/minigames/);
// the outcome reader is shared by both games.
// ---------------------------------------------------------------------------

/**
 * The chip glyph `AuronSequence.ts` draws (its GLYPH map) -> the key a player presses for that
 * button (`src/ui/ffx/rawInput.ts` KEY_MAP). The circle is X, not Escape: Escape opens the pause.
 */
export const BUSHIDO_KEYS = Object.freeze({ '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight', '✕': 'Enter', '○': 'x', '△': 'q', '□': 'k', L1: 'f', R1: 'r' });

/** Which overlay the `.ig-minigame__subtitle` ("BUSHIDO · ENTER THE SEQUENCE") names, or null for the others (reels, fury, mix, pickers). */
export function minigameKindOf(subtitle) {
  const s = String(subtitle ?? '').toUpperCase();
  if (s.startsWith('BUSHIDO')) return 'bushido';
  if (s.startsWith('SWORDPLAY')) return 'swordplay';
  return null;
}

/** The keys that type the chips shown, in order; `unknown` lists a glyph with no key (the plan is then not safe to type). */
export function keysForChips(chips) {
  const keys = []; const unknown = [];
  for (const g of chips) {
    const k = BUSHIDO_KEYS[String(g).trim()];
    if (k) keys.push(k); else unknown.push(g);
  }
  return { keys, unknown };
}

/**
 * Swordplay: press now? `pos`/`prev` are the cursor's percent of the bar at this and the last sample (`dtMs` apart),
 * `zoneStart`/`zoneWidth` the gold zone in percent (the overlay's CSS variables), `leadMs` the time a key takes to
 * arrive. The press is made when the cursor, carried forward by the lead, sits inside the middle `inner` share of the
 * zone. A miss is not a failure in the game (the marker restarts), so a late press only costs a sweep.
 * Self-contained: injected into the page by source (Function#toString), like dboxStep.
 */
export function swordplayPressNow(pos, prev, dtMs, zoneStart, zoneWidth, leadMs, inner = 0.7) {
  if (![pos, prev, dtMs, zoneStart, zoneWidth].every((n) => Number.isFinite(n)) || dtMs <= 0 || zoneWidth <= 0) return false;
  const predicted = pos + ((pos - prev) / dtMs) * leadMs;
  const centre = zoneStart + zoneWidth / 2;
  return Math.abs(predicted - centre) <= (zoneWidth / 2) * inner;
}

/**
 * The end of a route, read from what the game shows, never from the first `victory` event in the battle log (a chain
 * logs one per link, and the log read at the results screen holds none: round 19 PR-0261).
 *
 * `end` = { screenAtEnd, resultsText, log: [{type}], seen: { links, chainLength, phase }, final } where `seen` is the
 * last chain state read while the fight loop ran. Order of evidence: the results screen's own words; a fight loop that
 * ended with the battle screen still up (budget, stuck menu) is `stalled`, with the link and the playback phase it stopped
 * in ("stalled at link 2, moment:battle-start"); a screen that left the battle plus a defeat event, or a victory event on
 * the LAST link, is a provisional answer; anything else is `undecided` until the results screen has been read, and with
 * `final: true` (the route has nothing left to read) it is `stalled` too.
 */
export function deriveOutcome(end) {
  const text = String(end.resultsText ?? '');
  if (/Victory|· CLEARED/i.test(text)) return { outcome: 'victory', from: 'results screen text' };
  if (/Defeat|· FELL/i.test(text)) return { outcome: 'defeat', from: 'results screen text' };
  const kinds = new Set((end.log ?? []).map((e) => e.type));
  const seen = end.seen ?? {};
  const onLastLink = !seen.chainLength || (seen.links ?? 1) >= seen.chainLength;
  const link = seen.links ?? 1;
  const phase = seen.phase || 'no phase read';
  const stalled = (from) => ({ outcome: 'stalled', from, stalledAt: { link, phase }, detail: `stalled at link ${link}, ${phase}` });
  if (end.screenAtEnd === 'battle') return stalled('the battle screen was still up when the route stopped playing');
  if (kinds.has('defeat')) return { outcome: 'defeat', from: 'engine log, screen left the battle' };
  if (kinds.has('victory') && onLastLink) return { outcome: 'victory', from: 'engine log on the last link, screen left the battle' };
  if (end.final) return stalled('no results screen and no final outcome event');
  return { outcome: 'undecided', from: 'screen left the battle; the results screen is not read yet' };
}
