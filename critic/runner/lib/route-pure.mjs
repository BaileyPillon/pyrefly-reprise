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
 * rule), then the id that IS the name's slug, then the one id that starts the
 * slug or that the slug starts (FFX-2 rows and ids that spell the name).
 *
 * PR-0397 (round 25, minor, carried from round 24 and fired in two reviews):
 * the last step used to take the FIRST id in screen order that began with the
 * slug or that the slug began with, so "Yuna" (a party member, who is not in
 * `enemyIds` and so never reaches the display-name step) resolved to
 * "yunalesca" whenever the boss's reticle came first, and the route spent its
 * Phoenix Downs on Lady Yunalesca (15, 11 and 8 times in three lost runs of
 * Chapter II) while `run.json` said the target was "yuna". The id equal to the
 * slug now wins before any prefix is looked at, and a prefix that fits two
 * different ids is not a name: the answer is null (unresolved), which
 * `confirmTarget` records in `targetMismatches` and plays as "confirm what is
 * lit", never as a guess. Game case: both (shared critic plumbing); the case
 * that fired it is FFX Chapter II (party ids `yuna`, boss `yunalesca`).
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
  const ids = domIds.filter((id) => typeof id === 'string' && id !== '');
  if (ids.includes(slug)) return slug; // the id that is the name, before any prefix is looked at (PR-0397: "yuna", not "yunalesca")
  const near = [...new Set(ids.filter((id) => id.startsWith(slug) || slug.startsWith(id)))]; // the same id on a reticle and on a plate is one id
  return near.length === 1 ? near[0] : null; // two different ids fit: the name does not say which, so it is unresolved, not the first on screen
}

/** A visible command stack whose rows are all disabled: nothing a player can choose. */
/**
 * The command row a card's label points at. A line-first card names the aeon of a Grand Summon, "Grand Summon: Shiva" (release 59, decision 145; `grandSummonLabel` in `advisor.ts`), but the menu's row is
 * "Grand Summon" and the aeon is chosen in the picker that row opens (the picker is read against the card's whole text, `route-fight.mjs`). Every other label is its own row.
 */
export const rowLabelOf = (label) => String(label ?? '').replace(/^(grand summon):\s+.+$/i, '$1');

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

/**
 * Release 39 (r39-uifix, PR-0360 / PR-0361): a Bushido chip names the control for the device in use, so on a keyboard its text is no longer one
 * glyph ("Q△", "Esc○", "Enter✕", "FL1"); a pad or a finger still sees the bare symbol. Every chip also carries the abstract button it presses in
 * `data-btn`, and this is that button -> the key a player presses (`src/ui/ffx/rawInput.ts` KEY_MAP; the same keys as the glyph table above).
 * The harness reads `data-btn` first, so it types the chips whatever their faces say, and falls back to the glyph for a build that has none.
 */
export const BUSHIDO_KEYS_BY_BUTTON = Object.freeze({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', confirm: 'Enter', cancel: 'x', triangle: 'q', square: 'k', l1: 'f', r1: 'r' });

/** Which overlay the `.ig-minigame__subtitle` ("BUSHIDO · ENTER THE SEQUENCE") names, or null for the others (reels, fury, mix, pickers). */
export function minigameKindOf(subtitle) {
  const s = String(subtitle ?? '').toUpperCase();
  if (s.startsWith('BUSHIDO')) return 'bushido';
  if (s.startsWith('SWORDPLAY')) return 'swordplay';
  return null;
}

/**
 * The keys that type the chips shown, in order; `unknown` lists a chip with no key (the plan is then not safe to type).
 * `buttons[i]` is chip `i`'s `data-btn` when the build has one (release 39 on): it wins over the face text.
 */
export function keysForChips(chips, buttons = []) {
  const keys = []; const unknown = [];
  chips.forEach((g, i) => {
    const k = BUSHIDO_KEYS_BY_BUTTON[String(buttons[i] ?? '').trim()] ?? BUSHIDO_KEYS[String(g).trim()];
    if (k) keys.push(k); else unknown.push(g);
  });
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

// ---------------------------------------------------------------------------
// PR-0353 (critic round 23, lane r392-trema): what the route does NOT script in Chapter XIII, and how long it lets that fight run.
// Game case: FFX-2 only (Chapter XIII is the only chapter named); the helpers are shared critic tooling.
// ---------------------------------------------------------------------------

/**
 * Chapters in which the route does not make its one scripted CHANGE (`route-fight.mjs`: after two picks it opens CHANGE, presses ArrowRight and Enter, to
 * capture the Garment Grid menu and a real spherechange event). In Chapter XIII it is a play decision the chapter's line never makes: it landed on Lady Luck in
 * every one of round 23's 26 attempts (Rikku's Alchemist stash, or a Dark Knight's Darkness, gone on the third turn), while the chapter's own tactic plays the
 * spherechanges the fight wants (Rikku to Gunner for Target MP, an Itchy knight out and back). The engine bench does NOT show it costing a measurable share of
 * wins (the advisor card's line, 200 seeds: 17 chapter wins without it and 11 with it at the human Wait split, 13 and 14 under Active: inside the noise), so it is
 * removed as an uncontrolled variable, not as the cause of PR-0353 (docs/handoff/r392-trema.md). The Garment Grid menu is captured in every other FFX-2 chapter.
 * `--nochange` / `NOCHANGE` still skips it anywhere.
 */
export const NO_SCRIPTED_CHANGE = Object.freeze(['ffx2-trema']);

/** Is the route's scripted CHANGE made in `chapterId`? An explicit `--nochange` / `NOCHANGE` always says no. */
export const scriptedChangeAllowed = (chapterId, nochange) => !nochange && !NO_SCRIPTED_CHANGE.includes(chapterId);

/**
 * The default per-attempt budget of a route, in ms: 15 minutes, and for the fights that run past it a budget of their own.
 *   - PR-0353 (round 23): Chapter XIII's two links (about 90 minutes of play in round 23's runs), 100 minutes. FFX-2 only.
 *   - PR-0433 (round 25): three FFX fights that were still progressing when the 15 minutes ran out, which the route then called "stalled": Chapter II
 *     (Lady Yunalesca, three forms; cut at turn 136 with her at 9,104 of 60,000 HP), Chapter III (Braska's Final Aeon; cut at turn 120) and Chapter XVII
 *     (Sin's fins and core; cut at link 2). Their wins took 16, 32 and 19 minutes with a longer budget on an idle host, and Chapter II took more than 50 minutes
 *     on a host that was running eight browsers, so 50 minutes: above the longest idle-host win, and still a cap (the stall watchdog in route-fight.mjs ends a
 *     fight that makes no battle event for two minutes after three recoveries, whatever the budget).
 * The keys are chapter ids as `route.mjs` takes them. Game case: Chapter XIII FFX-2 only; the three PR-0433 chapters FFX only (shared plumbing, chosen per chapter).
 */
export const DEFAULT_BUDGET_MS = 900000;
export const LONG_FIGHT_MS = 3000000;
export const LONG_FIGHT_BUDGET_MS = Object.freeze({ 'ffx2-trema': 6000000, yunalesca: LONG_FIGHT_MS, 'braskas-final-aeon': LONG_FIGHT_MS, 'sin-fins-core': LONG_FIGHT_MS });

/** The attempt budget for a route: an explicit `--budget` wins, else the chapter's own, else {@link DEFAULT_BUDGET_MS}. */
export const budgetFor = (chapterId, explicit) => (explicit !== undefined && explicit !== null && explicit !== '' ? Number(explicit) : (LONG_FIGHT_BUDGET_MS[chapterId] ?? DEFAULT_BUDGET_MS));

/**
 * PR-0450 (d), round 25: the continuity probe is no longer part of the capture route. The capture owner ran `route.mjs --continuity` beside other work and its numbers
 * disagreed with the dedicated harness's on the same chapter (Chapter I: a head 41.8 percent off and feet 48 px off, at 46 fps and with no pose registration, against
 * 12.1 percent and 0.8 px at 59.6 fps), so inline numbers are not scored. `continuity.mjs` is the one entry: it passes the registration, runs one chapter after another
 * alone, and marks the route it starts with `CONT_DEDICATED=1`. A route started any other way with `--continuity` stops before it opens a browser.
 * @returns {string | null} null when the probe may attach, else the sentence that says why not
 */
export function inlineProbeRefusal(args, env) {
  if (!args || !args.continuity) return null;
  if (env && env.CONT_DEDICATED === '1') return null;
  return 'route.mjs --continuity is only for continuity.mjs (PR-0450 d): a probe attached to a capture route reads a loaded host and no pose registration, and its numbers are not scored. '
    + 'Run the dedicated harness alone on an idle host: PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=<url> --evidence=<dir> --chapters=<ids>';
}

/**
 * The dedicated continuity harness (`continuity.mjs`) gives every chapter 30 minutes, and used to pass that to the route as an explicit `--budget`, so the
 * long-fight table above never reached it: round 25's Chapter III had 1,733 s of battle inside a 1,800 s cap. It now gives a chapter the longer of the two;
 * an explicit `--budget` still wins.
 */
export const CONTINUITY_BUDGET_MS = 1800000;
export const continuityBudgetFor = (chapterId, explicit) => (explicit !== undefined && explicit !== null && explicit !== '' ? Number(explicit) : Math.max(CONTINUITY_BUDGET_MS, LONG_FIGHT_BUDGET_MS[chapterId] ?? 0));

/**
 * FOC52-003 (the deep review of release 52): `route.mjs` walks the chapter board with the arrow keys until the chapter's card is selected, and a HIDDEN chapter has no card
 * ("ASSERT-FAIL card sinspawn-gui got yunalesca": the walk went right over every tile and found nothing). The board opens a hidden chapter when its word is typed on it
 * (`src/app/screens/frontend/chapterDoors.ts#CHAPTER_DOORS`, one row per door), and the route now types the word. This is that table as data the harness can read without importing the app
 * (`tests/unit/critic-route-harness.test.ts` runs the app's own table beside this copy, so the two cannot drift). The FF7 door (`limit`) also needs the FF7 switch on.
 * Game case: both (shared critic plumbing); each row's game is its chapter's: FFX-2 for `exp-leblanc`, `ffx2-masterpiece-theatre`, `ffx2-tourist-trap`, `ffx2-valefor-besaid` and `ffx2-angra-mainyu`, FF7 for
 * `ff7-guard-scorpion`, FFX for the others.
 */
export const DOOR_WORDS = Object.freeze({
  'ff7-guard-scorpion': 'limit',
  'exp-leblanc': 'leblanc',
  'ffx2-masterpiece-theatre': 'experiment',
  'sinspawn-gui': 'mushroom',
  'exp-fayth': 'fayth',
  'ffx2-tourist-trap': 'daigoro',
  'ffx2-valefor-besaid': 'valefor',
  'biran-yenke': 'gagazet',
  'ffx2-angra-mainyu': 'angra',
  'mirror-aeons': 'yojimbo',
  'last-summoning': 'summon',
});

/** The word that opens a chapter the board has no card for, or null for a chapter with a card (the arrow-key walk finds it). */
export const doorWordFor = (chapterId) => (Object.prototype.hasOwnProperty.call(DOOR_WORDS, chapterId) ? DOOR_WORDS[chapterId] : null);
