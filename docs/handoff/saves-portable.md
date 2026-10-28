# Portable saves (ChatGPT point 9) — branch `saves-portable`

**Class: SAVE-DATA.** AGENTS.md "Release": anything that can lose progress needs a **deep review before it goes public**. This
track ships **dark**: the whole UI sits behind the address word `?saveport=on`, default **off**, and with the word off a
player's build is byte-identical in how a save is read, written and shown (proof below). Nothing was deployed.

Authority: Bailey, 2026-10-28 ~13:00 EDT, "ill go with all your recommendations and decision-making for the next couple
days" (the driver's call under it). Game case: **both games** (a save is one blob for the whole product; shared plumbing and
the shared pause chrome). Lane: `docs/` program `D:/Tools/pyrefly-scratch/2026-10-28/PROGRAM-1028.md`, wave 3.

## What a player gets (with `?saveport=on`)

Pause screen, OPTIONS tab, right-hand column, under CREDITS: a **PROGRESS** group with one row, **SAVE FILE ▸**. It opens a page
in the PRESENTATION page's classes and look (Ink & Gold; gold under FFX, pyre pink under FFX-2):

- **EXPORT SAVE**: the browser is handed `echoes-of-spira-save-YYYY-MM-DD.json` (the player's local date).
- **IMPORT SAVE**: the browser's file chooser (a click or tap opens it inside the click itself, which Safari needs; Enter and Confirm open it from the polled input, which Chrome and Firefox allow for a few seconds after a key press and a game pad cannot). A good file shows a CONFIRM view: *what the file holds beside what the save
  holds now* (chapters cleared, play time, last saved), and two rows, **KEEP MY SAVE** (the cursor starts there) and **REPLACE MY
  SAVE**. Nothing is replaced until REPLACE is chosen. A refused file says why on a status line and touches nothing.
- **UNDO IMPORT** (only while an import can be undone): puts the save from just before the last import back.

Mockups (not in the repo; the driver judges them): `D:/Tools/pyrefly-scratch/2026-10-28/saves/mock/saves-m1…m4-*-ffx-1600x900.png`
(m1 where the row sits, m2 the page fresh, m3 the confirm view, m4 after a replace). Built from the pause plate and the layout
numbers of `docs/screenshots/r395-int/options-c/`; the fonts are stand-ins (Bahnschrift, Georgia). No browser pass has been done
(the browser belonged to the deep-gap pass): the page's look on a real window and on a phone is **unverified**.

## The file

```json
{ "format": "echoes-of-spira-save", "formatVersion": 1, "saveVersion": 1,
  "exportedAt": "2026-10-28T16:00:00.000Z", "checksum": "sha256:<64 hex>", "save": { ... } }
```

`checksum` = SHA-256 of the **canonical JSON** (keys sorted, no whitespace) of `save` (`src/app/savePortSha256.ts`, hand-written
because the browser digest is async and secure-origin only; checked against Node `crypto` on the padding edges and a 300 KB
input). A re-indented or key-reordered file still verifies. It catches damage and hand edits; it is **not a lock** (a player may
edit their own save; nothing in a save is authoritative for a battle).

## What changed in the tree

| File | Change |
|---|---|
| `src/app/SaveData.ts` | **Additive only (+25 lines, no line removed or edited):** `SaveStore.replaceWith(next): boolean`. Nothing calls it unless a player imports or undoes. `git diff origin/main -- src/app/SaveData.ts` shows pure insertions. The file was already over the 400-line cap (615 → 640); it is not in `docs/CONTRACTS.md`. |
| `src/app/savePort.ts` (new) | Pure: build the file text, read it (`readSaveFile`), validate, summarize. No store, no DOM, no storage. |
| `src/app/savePortSha256.ts` (new) | `sha256Hex`, `canonicalJson`. |
| `src/app/savePortFlow.ts` (new) | Touches the store: `exportCurrent` (read-only, self-checked), `commitImport`, `undoImport`, the undo stack. |
| `src/app/savePortSwitch.ts` (new) | `?saveport=on` / `=1`; anything else is off. |
| `src/app/screens/pause/savePortPage.ts`, `savePortHelp.ts`, `savePortBrowser.ts` (new), `src/ui/common/pause-save-port.css` (new) | The page, its help copy (plain text only), and its three browser hooks (download, chooser, read). |
| `PauseOverlays.ts`, `panels.ts`, `actions.ts` | Wiring: a fourth page, one row (printed only with the word on), the row id in `PauseRowPage`. `PauseScreen.ts`, `PauseView.ts`, `App.ts` untouched. |
| `tests/unit/save-port-*.test.ts` (5 files, 172 tests) | See "Tests". |

## What the reader refuses (`readSaveFile`, in this order; none of it touches the current save)

1. `too-large` over 512 KB (a real save is a few KB), checked before parsing;
2. `not-json` not JSON or not an object (a leading BOM is allowed); a hostile 200,000-deep `[[[…` ends here without throwing;
3. `not-a-save-file` the `format` word is not ours: another game's file, a **bare copy of the stored blob** (no envelope, no checksum), a list;
4. `newer-file` / `newer-save` a `formatVersion` or `saveVersion` above this build's. **Checked before the checksum** (a newer build may hash differently);
5. `malformed` (with a field path in `detail`, never player data): wrong types or impossible values anywhere the envelope or the save has them: `chapters` not a map or over 200, a record that is null or has a non-boolean `cleared`, a negative `attempts`, a non-number time, a nested value, a volume outside 0..1, `ffx2Atb` or `ffx2AtbSpeed` off their lists, `textSpeed` outside 0.01..16, over 2,000 flags or list entries, a key `__proto__`, `constructor` or `prototype` in `chapters`, `flags` or `settings`, `save.version` not equal to the envelope's `saveVersion`, nesting deeper than 12. **Strict where `migrate` is lenient** (`migrate` spreads a string into a map and throws on a null record);
6. `corrupt` the checksum is not the hash of the save.

An accepted file goes through the **same `migrate`** a reload uses (an older save is upgraded exactly as a stored one is; the veteran
rule fires as it does for a stored older save). Unknown **top-level** keys of `save` are dropped; unknown **settings** and unknown
**chapter-record** keys are kept only as plain values (a newer build at the same version number may have added one; the version has
never been bumped for additive fields). `read` never throws (a try/catch net returns `malformed` / `unexpected`).

## Replace and undo (`savePortFlow.ts`, `SaveStore.replaceWith`)

- **All or nothing.** The slot is written first; the in-memory save is swapped only after that write held. No storage, or a throwing
  slot: `false`, nothing changed, **no undo step recorded**, and the page says "Nothing was changed."
- **Replace bypasses `writeMerged`** (the two-tab merge): an import replaces, so another tab's older copy is not folded back in at
  the moment of import. `lastRaw` is set to what was written, `unflushedPlayTimeMs` is zeroed, the mixer and the comfort flags are told.
- **The old save is kept**: stringified from memory (unflushed play time included) on a stack of **5**, in a `WeakMap` on the store
  (memory only: **no new storage key**, gone with the page). Two wrong imports in a row can both be undone. An undo is itself a
  replace with the same guarantees and pops its step only after the write held.
- **Export is read-only and self-checked**: the text is read back with `readSaveFile` before it is handed out; a save the reader
  would refuse (say a volume that is NaN) is not turned into a file ("Your save cannot be made into a file").
- `updatedAt` is set to the time of the replace (as every write does); the file's value is not kept.

## What a deep review must check

1. **Today's path is untouched with the word off.** `tests/unit/save-port-today.test.ts` pins three SHA-256 fingerprints taken on
   `origin/main` e50a2b22d **before** any of this existed: (a) the exact string a fixed session of store writes leaves in the slot,
   (b) the snapshot of all 12 fixture saves (`tests/fixtures/saves`, releases 20 to 37.1) loaded through the store, (c) the OPTIONS
   columns for FFX, FFX-2 and FF7. Also `git diff origin/main -- src/app/SaveData.ts` is insertions only. Re-run both.
2. **The two-tab limit (known, documented, tested as a characterisation).** A replace in one tab does not reach another open tab; that
   tab's next write merges its older copy into the imported save (`saveMerge.ts`: `cleared` is OR-ed, best times take the smaller, its
   own changed settings win). The page tells the player to close other tabs first. Decide whether that is enough or whether a
   `storage` event listener should make the other tab adopt the import. Test: `save-port-flow.test.ts`, "two open tabs".
3. **No stale references after a swap.** `replaceWith` replaces `SaveStore.data` wholesale; nobody caches `save.settings` or
   `save.value` in a field (grep of `src/`: only function-local reads, the pause pages re-read per render), but a deep review should
   confirm no battle or HUD module holds a `ChapterRecord` across a pause (a battle is usually what the pause is open over).
4. **What the file does NOT hold.** Only the main blob `pyrefly-reprise:save:v1`. **Not included:** the experiments' records
   (`pyrefly-reprise:experiments:v1`), the Pilgrim run (`pyrefly-reprise:pilgrim:v1`), debug marks (`pyrefly-reprise:mark:v1`),
   and tab-scoped session keys (board focus, demo mode). The page's wording says "progress and settings".
5. **Settings travel too** (volumes, text size, REDUCE MOTION, LOW EFFECTS, colour vision, title screen, visual style…). A setting
   chosen for a weak phone arrives on a strong PC. Deliberate in v1 (the blob is one unit); see the open questions.
6. **Hostile and malformed files**: the table above; run the 77 tests of `save-port-file.test.ts` and try a few by hand (a 600 KB file,
   a renamed `.png`, a hand-edited number with and without the checksum recomputed, a file from the old release-20 fixture wrapped
   in an envelope).
7. **Real-browser behaviour, not testable in jsdom:** the file chooser needs a key press, click or tap (a game-pad press is not one;
   the page asks `navigator.userActivation` and says so); `Blob` + `<a download>` on Chrome, Firefox, Safari and a phone; a blocked
   download; a file picked with an extension other than `.json`; a very slow disk read; the page under REDUCE MOTION and at 390x844.
8. **Quota and private-window storage**: `replaceWith` returns false and nothing changes (tested with a throwing slot and with no
   storage). Confirm in a private window and with storage blocked.
9. **Accessibility**: rows are `role="button"` with roving `tabindex`, the status line is `role="status"` `aria-live="polite"`, focus
   follows the cursor. Not run against a screen reader.
10. **No PII.** The file holds no name, address or account: chapter ids, counts, times, settings, flags. The public repo has none.

## Tests (all pass; `npx tsc --noEmit` clean)

| File | Tests | Pins |
|---|---|---|
| `save-port-today.test.ts` | 16 | the three fingerprints (word off = today) |
| `save-port-sha256.test.ts` | 10 | the hash against Node `crypto`; the canonical text |
| `save-port-file.test.ts` | 77 | round trip; every refusal; older / newer / other game / huge / hostile; all 12 real fixtures; the words |
| `save-port-flow.test.ts` | 32 | export read-only and self-checked (all 12 real fixtures export and read back); replace; undo and the 5-deep stack; write failure; no storage; the two-tab limit |
| `save-port-page.test.ts` | 37 | the page with a stand-in browser, and the real `PauseScreen` (FFX and FFX-2) with real keys and clicks: no row with the word off, the row and page with it on, a whole export, choose, replace, undo round trip through the DOM file input |

A mutation check was run: with `SaveStore.replaceWith`'s `this.data = next` commented out, seven tests fail.

## Not done / needs the driver

- **The browser pass** (job spec, predictions written first, in the lane's return): the page on a real window and on a phone, the
  real chooser and a real download, FFX and FFX-2 accents.
- **The deep review** (this class). Do not remove the word until it settles.
- Ledgers (`DECISIONS.md`, `ACTIONS.md`) and `docs/handoff/NOW.md` are the driver's to update; this lane did not touch them.
- Open questions are listed in the lane's return (a title-screen entry, persisted undo, whether settings travel, the other storage keys).
