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
