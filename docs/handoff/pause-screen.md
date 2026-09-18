# Handoff — chapter meta data for the "Until Dawn" pause screen

Written for whoever builds the pause-screen UI and the new prebattle-screen tab
it shares data with. This document explains `src/data/chapter-meta.ts`, what it
gives you, what it deliberately does not give you, and the art status.

## What exists now

`src/data/chapter-meta.ts` exports `CHAPTER_META: readonly ChapterMeta[]` (five
entries, in play order) and `getChapterMeta(id)`. It is pure data — no rendering,
no evaluation logic, no dependency on `BattleState`. Its test is
`tests/unit/chapter-meta.test.ts` (54 assertions: presence, word-count limits on
the copy, and that every referenced art file that's supposed to exist today
actually does).

This does **not** replace anything in `src/data/encounters.ts`. `Chapter.subtitle`,
`Chapter.blurb` and `Chapter.sensorTexts` stay exactly as they are and keep
serving the chapter-select card and the in-battle Sensor panel. `ChapterMeta` is
new copy, written for a different reader (a full-screen pause/tab view with room
for a close-up portrait and a paragraph), not a re-export of the card text.

### Shape

```ts
interface ChapterMeta {
  id: ChapterId;                 // same ids as encounters.ts
  gameLabel: 'FFX' | 'FFX-2';
  numeral: 'I' | 'II' | 'III' | 'IV' | 'V';
  title: string;
  subtitle: string;              // 2-4 word tagline, e.g. "The Prominence"
  location: string;
  blurb: string;                 // 2 original sentences
  heroArt: string;                // new pause-screen art, NO extension — see "Art status"
  heroArtFallback: string;        // existing art, WITH extension, always present today
  quote: { text: string; speaker: string }; // original line, < 18 words
  handwritten: string;            // 4-6 word handwritten-style aside
  objectives: readonly [ChapterObjective, ChapterObjective, ChapterObjective];
  tip: string;                    // one canon strategy sentence
  snapshots: readonly [ChapterSnapshot, ChapterSnapshot, ChapterSnapshot];
  focalCharacterId: string;
  musicKeys: readonly string[];   // this chapter's scene + battle MusicKeys
}
```

`ChapterObjective` is `{ id, label, rule: ObjectiveRule }`. `ObjectiveRule` is a
small tagged union — a **pure descriptor**, not a function. This module never
imports `BattleState`; the pause screen (or whatever owns the objectives UI) is
what evaluates a rule against the live battle and flips the checklist row. The
shapes in play today:

```ts
type ObjectiveRule =
  | { kind: 'status-cured'; status: string }        // a status was removed from the party (or, once, from the boss — see Ch.2)
  | { kind: 'survived-ability'; ability: string }    // the party was still standing after a named enemy ability resolved
  | { kind: 'form-reached'; form: number }           // Yunalesca-style in-place transformation reached
  | { kind: 'boss-hp-below'; fraction: number }      // unused by the five shipped objectives, kept for future chapters
  | { kind: 'link-reached'; link: number }           // reached link N of a chained EnemyGroupDef (BattleSetup.chained)
  | { kind: 'parts-downed'; targetIds: readonly string[] } // a named group of enemy ids all reached 0 HP at once
  | { kind: 'chain-landed'; count: number }          // FFX-2 Chain Attack counter (FFXCombatant.chainCount) reached N
  | { kind: 'victory' };
```

`link-reached` and `chain-landed` look similar and are not interchangeable:
`link-reached` counts **which battle of a chained chapter** is live (Vegnagun's
four-part chain; `EnemyGroupDef.nextGroupId`/`BattleSetup.chained`). `chain-landed`
counts the FFX-2 **Chain Attack** damage multiplier on a single target
(`FFXCombatant.chainCount`, `BattleEvent` type `'chain'`) — a within-battle combo
counter, unrelated to which link of the chapter you're on. Chapter 5 uses
`link-reached`; Chapter 4 uses `chain-landed`. Don't reuse one for the other.

`parts-downed` and `chain-landed` are not in the brief's six example shapes;
they were added because two of the five chapters' real objectives ("down both
Yu Pagodas at once", "land a 5-hit Chain Attack") don't fit any of the six.
If you add a chapter or an objective that needs a new rule shape, extend this
union the same way: flat, serialisable, named after the observable game fact,
never a closure.

### Per-chapter objectives, and why

| Chapter | Objectives | Source |
|---|---|---|
| Seymour Flux | cure Zombie before Full-Life lands · survive Total Annihilation · defeat Seymour Flux | `research/ffx-seymour-flux.md` §6 rows 4–5, 13 |
| Yunalesca | reach Form III with a Zombie still standing · dispel her Regen · defeat all three forms | `research/ffx-yunalesca.md` §10.1, §10.5 |
| Braska's Final Aeon | down both Yu Pagodas at once · survive Ultimate Jecht Shot · send Yu Yevon | `research/ffx-bfa-yu-yevon.md` §1.4 (targeting rule: "kill both or neither") |
| FFX-2 Bahamut | survive a Mega Flare · land a 5-hit Chain Attack · defeat Bahamut | `research/ffx2-bahamut.md` §3 (Chain Attack as the ignores-Defense damage route) |
| Vegnagun / Shuyin | destroy all four of Vegnagun's parts (`link-reached`, link 4) · survive Terror of Zanarkand · free Shuyin | `research/ffx2-vegnagun-shuyin.md` §7.2 |

Chapter 4's objectives are tracked normally even though its Results screen is
silent — [writing-bible §5.4] suppresses the victory pose/fanfare/quip, not the
pause-screen checklist. `Chapter.music.victory` stays absent for that chapter in
`encounters.ts`; `chapter-meta.ts` doesn't touch it.

### Art status — read before wiring up the pause screen

**No new pause-screen art exists yet.** `heroArt` on every chapter (e.g.
`'pause/ch1-seymour-flux'`) is the *intended* commission — an "Until Dawn"-style
close-up of the focal character, expressive, painted in the shipped house style
— and it has **no file extension**, because the art pipeline hasn't rendered it
and the eventual format (png vs. webp) isn't decided. Per the orchestrator's
instructions, new art generation happens later, locally, outside this task.

Every chapter also has `heroArtFallback`: a path relative to `public/art/`,
extension included, pointing at an **existing, shipped** portrait or character
sheet (`portraits/seymour.png`, `portraits/yunalesca.png`, `portraits/jecht.png`,
`portraits/yuna-ffx2.1.raw.png`, `portraits/shuyin.png`). The test suite checks
that every fallback file exists today. **The pause screen should try `heroArt`
first (with whatever extension the art pipeline lands on) and fall back to
`heroArtFallback` when it 404s**, rather than hard-requiring the new art.
`snapshots[].image` always points at existing, already-rendered backdrop/character
art — never a new commission — so those three tiles per chapter can render
immediately with no fallback needed.

## What this handoff does not cover

- The pause screen's layout, the "Until Dawn"-style close-up framing, and the new
  prebattle-screen tab UI are not built. Mock up each new screen against
  `docs/handoff/presentation-ink-and-gold.md` (the "Ink & Gold" spec — tokens,
  type, the mockup-before-integration rule) before wiring it into
  `src/app/screens/**` or `src/ui/inkgold/**`.
- The `ObjectiveRule` → `BattleState` evaluator does not exist yet. Whoever
  builds the pause screen owns writing it; this module intentionally stops at
  the descriptor so it has no coupling to battle internals and no risk of
  colliding with the concurrent work on `PaintedActor.ts`, `BattlePresenterStage.ts`,
  `BattleCamera.ts`, `CtbList.ts`, `DamageLayer.ts`/`PartyRows.ts`, etc.
- No screenshots of an actual pause screen exist, because there is no pause
  screen yet — this task shipped the data layer only. Concept mockups of the
  "Until Dawn"-style close-up direction were requested separately and are a
  visualization, not a build artifact of this module.
