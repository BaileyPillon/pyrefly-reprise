# Observed session — FFX Steam HD Remaster, 2026-09-26

**What this file is.** A record of what the driver personally saw in the real
game during a live Steam HD Remaster session, as a source independent of the
decompile and the wikis used elsewhere in `research/`. It carries its own
confidence tag because it is neither decompiled data nor a cited guide: it is
a human's read of on-screen frames, kept to what was actually seen.

**Confidence tag introduced here**

| Tag | Meaning |
|---|---|
| `[observed: FFX Steam HD Remaster, 2026-09-26 (driver's screenshots, not re-measured)]` | The driver watched this happen live in the retail Steam build and captured it as their own screenshots. Frame counts and timings below are read off those screenshots by eye, not from a frame-accurate capture tool, and have not been re-measured by a second pass. Treat exact millisecond figures as approximate. |

Per AGENTS.md rule 8 (original assets only, no retail Square Enix assets in
the repo) and the task's TEXT-ONLY instruction, **no screenshot, frame or
video from the retail game is stored in this repository.** The driver's own
screenshots live outside the repo at `D:/Tools/ffx-hd/drive/` (`t1x.jpg`,
`t2x.jpg`, `e00-e15.jpg`, `esheet.jpg`). This file records only their content
in prose.

---

## 1. Method

- **Game:** *Final Fantasy X* HD Remaster, Steam app 359870, the copy at
  `D:/Tools/ffx-hd`.
- **Config:** as shipped with the game — default settings, nothing changed.
- **Save file:** a community step-save pack, downloaded with Bailey's
  explicit permission ("Yes download it it's fine", 2026-09-26) from
  `https://www.savegameworld.com/download/final_fantasy_x.zip`
  (517,296 bytes, sha256
  `af6b5dcf9b8df2eec3616be490f0d625a8e9a8f85bb3b8efedde3ef84f6b372d`,
  107 individual saves). The pack is recorded at
  `D:/Tools/ffx-hd/saves-incoming/save.md`.
- **Save used:** save 52, "Macalania Woods - Lake Road", 17:35 play time.
- **Battle observed:** Spherimorph, the story boss fought on Lake Road in
  Macalania Woods.
- **Party:** Tidus, Auron, Lulu.
- **When:** 2026-09-26, about 17:00 EDT, observed live by the driver.
- **Evidence:** the driver's own screenshots (`t1x.jpg`, `t2x.jpg`, `e00`
  through `e15.jpg`, `esheet.jpg`), kept outside the repo per rule 8. Frame
  timing below is estimated from the screenshot sequence, not a frame-exact
  capture.

This session answers Steam-check items from `docs/plans/steam-session-2026-09-26.md`
item 2 (FFX half of PR-0170) and item 5 (PR-0180), plus D-196 (the Sensor
immunity text). It does not touch the FFX-2 items on that list (PR-0209,
PR-0124, PR-0106, NEW-C1, GP-G2, PR-0217/0054) — see that file for what is
still open.

---

## 2. Observations

### 2.1 One valid target still shows a confirm step (PR-0170)

With Spherimorph the only enemy on the field, choosing **Attack** from the
command menu did **not** fire the attack at once. A red target cursor
appeared over Spherimorph and the game waited for a second confirm press
(the attack executed only on the second C-button press). While the cursor
was up, the top HELP bar read **"Boss: Spherimorph"** and **"Immune to
sensors."**

`[observed: FFX Steam HD Remaster, 2026-09-26 (driver's screenshots, not re-measured)]`

**What this answers.** PR-0170 asked whether the retail game still shows a
target step when there is exactly one valid target, or whether it
auto-resolves the action the way our engine currently does. **The retail
answer is: it still shows a target step and waits for a confirm, even with
only one enemy on the field.** Our engine firing at once on a lone target is
therefore a faithfulness bug, now sourced against the real game rather than
inferred.

### 2.2 The enemy's named ability appears in the top HELP bar; a plain attack does not (PR-0180)

When Spherimorph cast **Fire** on Tidus (228 damage), the top HELP bar showed
the ability name **"Fire"**, centred, for the duration of the spell — roughly
1.5 to 2 seconds, visible across three captured frames about 0.6 seconds
apart. When Spherimorph used its plain physical attack on Lulu (251 damage),
the HELP bar showed **no name at all**.

`[observed: FFX Steam HD Remaster, 2026-09-26 (driver's screenshots, not re-measured)]`

**What this answers.** PR-0180 asked whether and how FFX prints an enemy's
ability name on screen when it uses something other than a plain Attack.
**The retail answer: FFX names a non-attack enemy ability, centred, in the
top help bar, for the span of the action, and names nothing for a plain
attack.** `actionBanner.ts` (`src/ui/ffx/actionBanner.ts`, built behind an OFF
switch per PR-0180's plan) is now sourced and can move from OFF to ON. The
stalled "stalled feel" major this represents (thresholds-program §2 batch 2,
PR-0180) is unblocked.

### 2.3 "Immune to sensors." is a real, printed HELP-bar line (D-196)

While targeting Spherimorph — a Sensor-immune boss — the top HELP bar printed
**"Immune to sensors."** next to the enemy's name, alongside the "Boss:
Spherimorph" line (§2.1).

`[observed: FFX Steam HD Remaster, 2026-09-26 (driver's screenshots, not re-measured)]`

**What this answers.** `research/ffx-yojimbo.md` §2.3 recorded, from the
decompile and wikis only, that Yojimbo (also `immune_to_sensor`) has "**No
Scan text**" and that "Scan and Sensor show nothing" — and D-196 (built as
hiding our Sensor panel entirely on an immune target) was decided on that
note. **That note is now known to be incomplete for Sensor specifically: the
real game does print a line, "Immune to sensors.", in the help bar when
targeting a Sensor-immune enemy.** This session did not observe Scan's
behaviour against an immune target (Spherimorph was targeted with a plain
Attack, not Scanned), so the original "no Scan text" note is neither
confirmed nor contradicted — only the Sensor half is now sourced differently.
**No code changed here; this is a flag for whoever owns D-196 and the
`src/ui/ffx/**` Sensor panel** (thresholds-program §2 batch 5 / batch 2
ownership) to reconsider against this new source.

---

## 3. What is still open

This session covered only FFX (Spherimorph, Macalania Woods) from the
community save pack. The FFX-2 legs planned in
`docs/plans/steam-session-2026-09-26.md` (PR-0209 immune hits and chains,
PR-0124 dressphere carry at a seam, PR-0106 the Leblanc failsafe, NEW-C1 the
lone-White-Mage Bahamut question, GP-G2 Alchemist variance, PR-0217/PR-0054
Zombie through KO) are **not answered by this session** — see that plan file
for their current status, including the Via Infinito no-encounter note
recorded there.

Scan's own on-screen behaviour against a Sensor-immune (or Scan-immune)
target was not observed this session and remains open.
