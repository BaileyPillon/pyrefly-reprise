# Judge's report: eye-candy options A, B, C, D (2026-09-29)

An independent judge who built none of the four options. I read the four READMEs, every ON/OFF still (103 pairs, laid
side by side at half size), the phone stills, the captions and `perf.json`, and I pulled one frame a second from three
clips (D Chapter IV, D Chapter I, B Chapter VII). I then built `fx-d` myself (HEAD `e4540bab`, `vite build`) and
`main` at the branch point (`1475ff6b`, from `git archive`), served both on my own ports, and drove them in headless
Chrome on the real GPU **by keyboard only**: title, board, chapter card, party prep, the opening scene, then the battle
by Enter presses. The debug API was used only to read state and to set seed 3, as the repo's own e2e specs do.
My evidence is in `D:/Tools/pyrefly-scratch/eye-candy/judge/` (`rk/*.json`, `rk/*.jpg`, `pairs/`, `nofx-vs-main-*.jpg`).

Bailey's brief, quoted by the driver: "maximum eye candy now! it needs to look absolutely beautiful". So the first
criterion carries the most weight in my recommendation. The approved paintings staying the star, and the HUD staying
crisp, are hard constraints.

## Scores (1 to 10)

| Criterion | A Golden-Hour Cinema | B Living Paintings | C Spectacle Combat | D All Three |
|---|---|---|---|---|
| Beauty, "maximum eye candy" | 6 | 7 | 6 | **9** |
| Faithful to each game's look (rule 14) | 7 | 8 | 8 | 7 |
| Approved paintings untouched and still the star | 7 | 7 | 8 | 6 |
| HUD crisp and readable | 9 | 9 | 8 | 8 |
| Noise and clutter (10 = clean) | 8 | 7 | 7 | 6 |
| Motion comfort | 8 | 7 | 6 | 6 |
| Performance, desktop and phone | 9 | 9 | 8 | 9 |
| **Plain mean** | 7.7 | 7.7 | 7.3 | 7.3 |

- **A** gives richer contrast, beams from the rooms' own lights, lamp streaks, and a flare on big moments. At thumbnail
  size it is the subtlest of the four, as the driver already saw. Its look LUT visibly re-grades the paintings on
  screen. Djose's pale grey stone turns periwinkle, Bevelle's teal turns navy-violet, and the figures go darker and
  harder. The rim reads as a white outline on Bahamut. Spiral Cut and Mega Flare white out the figures for about a
  third of a second (`a/stills/ch7-macalania-special-on.jpg`, `ch4-bahamut-special-on.jpg`). A proved its HUD identity.
- **B** brings the rooms to life: Gagazet's moon halo, the blizzard veils, long moon shadows, the Macalania mirror
  floor, Bevelle's steam, and Djose's dust and arcs. The floor mirror and the cast shadows are the prettiest single
  additions in the whole round. B changes nothing in combat. Bevelle's steam banks cover a third of the painting. The
  Djose lamp burns to a white window, losing its painted mullions. The camera arc and sway are motion. Sway is a
  re-offer that was declined on 19 Sep.
- **C** adds nothing at rest by design, so it cannot carry the frame alone. In combat it is the boldest: the two-frame
  ink impact frame, the splash slab, foil numerals, and the rings. The shock rings hide the figure they hit: at Chapter
  XVI, Paine vanishes under the 1404 ring. Hit-stop, shake and the ink inversion are the hardest on comfort. Hit-stop and
  splash are re-offers, and Aerospark's lance is a new Special look that needs a yes (D-233).
- **D** is the only option whose ON frame is unmistakably richer than today at thumbnail size, in every chapter, both
  at rest and in combat. Macalania's victory frame (the mirrored ice with A's grade) is the best frame in the round.
  But the stacking costs the paintings. Gagazet's moon becomes a starburst sun, and the top-left of the frame washes
  pale lavender. Bevelle at rest is steam plus violet grade plus star glints over most of the backdrop. Mega Flare
  still blooms a white disc over Bahamut's head (`d/stills/ch4-bahamut-special-on.jpg`). The HUD text stays sharp: I
  checked crops at full resolution, and the party panel differs from OFF by 2.7/255 in mean absolute difference. The
  translucent HUD panels do sit on a paler backdrop in Gagazet, which lowers their contrast.

## What I verified on a production build of `fx-d` (real keys)

`?fx=d`, seed 3, rest = 5 s at the first command menu, combat = 20 s of Enter-driven play, measured with my own rAF
recorder (not the options' `fx.stats`). Phone = 390x844, device pixel ratio 3, CDP CPU throttle 4x.

| Run | Rest p50 / p95 ms | Combat p50 / p95 ms | Claimed (D README) | Within 15 %? | Console / page errors |
|---|---|---|---|---|---|
| Ch I, 1600x900 | 16.7 / 16.7 | 16.7 / 16.7 | 16.7 / 16.7 | yes | none |
| Ch I, 390x844, CPU 4x | 16.7 / 16.7 | 16.7 / 16.8 (p99 33.3) | 16.7 / 16.8 | yes | none |
| Ch XVI, 1600x900 | 16.7 / 16.8 | 16.7 / 16.7 | 16.7 / 16.7 | yes | none |
| Ch XVI, 390x844, CPU 4x | 16.7 / 16.7 | 16.7 / 16.8 (p99 33.4) | 16.7 / 16.8 | yes | none |

- Real input worked in every run: 10 and 11 actions were taken by keys. The fx API reported A, B and C all on, with the
  `fxc-foil--ffx` root class and the splash layer in the DOM. There were no failed requests.
- These vsync-capped figures only show that the 60 Hz cap holds. They measure no cost. Uncapped on the desktop, I
  measured D against `?fx=off`. Chapter I rest p50 / p95: 1.2 / 1.5 ms ON against 1.1 / 1.3 OFF. Combat: 0.7 / 1.0
  against 0.5 / 0.9. Chapter XVI rest: 0.7 / 1.1 against 0.6 / 0.9. Combat: 0.7 / 1.3 against 0.6 / 1.3. These are rAF
  submission times on an RTX 5070 Ti, so a real phone GPU is still untested. C and D had published no uncapped figure
  at all.
- **Without `?fx`, `fx-d` behaves like main.** The fx snapshot reports every option off. There is no fx class or splash
  layer in the DOM, and there is still one canvas. The same keys gave the same number of actions (5 in 8 s) in each
  chapter, and no errors. I compared the frame at the first menu, 1.5 s after it opened, against main built from the
  branch point:
  - The mean RGB matches within 0.4/255 in both chapters.
  - The mean absolute difference was 6.7 (Ch I) and 9.1 (Ch XVI), against 4.4 for main compared with a second main run.
    The excess comes from the idle camera's phase and the dialogue card's timing: the painted frames match by eye
    (`nofx-vs-main-ch1.jpg`, `triple-ch16.jpg`).
  - So the no-fx build is not pixel-identical, but it looks and behaves like main.
- `npx tsc --noEmit` is clean on `fx-d`. The production build succeeds.

## Defects that must be fixed before any of it ships

1. **Big moments white out their target.** In D, Mega Flare still blooms a white disc over Bahamut's head. In A,
   Spiral Cut and Mega Flare blank the party for about 0.3 s. The fix: cap the combined bloom, flare and halo on the
   payoff frame (for example D's own `bloom:0.8,flare:0.8`), then re-shoot and check that the target stays readable.
2. **Gagazet's moon becomes a sun (A and D).** The painted disc is lost under the streak and bloom. Strike the streaks
   on that source, or bloom 0.7 in Chapter I.
3. **The backdrop is buried at rest in D.** A's lit air sits over B's veils and steam: Bevelle's gantries disappear
   behind steam, star glints and a violet grade, and Gagazet's upper left washes out. Lower `haze` and `weather` in D,
   so the painting reads first and the air second.
4. **Hit rings hide the fighter they hit (C and D).** Paine is invisible under the ring at Chapter XVI in the hit and
   special frames. Use a thinner, more transparent ring, or draw it behind the figure.
5. **The phone tier clips spells to blobs (D).** Chapter I's and Chapter IV's phone spell frames are a flat white-orange
   disc. Lower the `spells` gain on the phone tier.
6. **HUD collision.** The Chapter IV splash title sits under the CHARGING chip (C and D).
7. **Nothing Bailey declined, or has not approved, may ship switched on:**
   - B's `sway` (cutout-animation);
   - C's `hitstop` and `splash` (hit-feel, overdrive-cinematic);
   - Aerospark's lance (D-233);
   - Bahamut's splash, which has no painting.

   Each one needs its own yes, or ships off.
8. **Flash safety.** The ink impact frame is an inversion flash. REDUCE FLASHES is read "defensively" until r31-access
   lands. Before any ship, prove that the flag cuts the frame on the merged OPTIONS row.
9. **Derived depth maps in a public repo** (B, `public/fx/`, spec Q7). Decide whether they are gitignored like
   `public/art` before any merge.
10. **Performance evidence.** Every gate figure is vsync-capped and rendered on the desktop GPU. Before shipping D, get
    one GPU-bound measurement: a real phone, or a GPU-throttled run.

Not blocking, but worth knowing:
- Captions call some frames "rest" that were shot just after a hit, such as D's Chapter XVI `rest`, which shows a
  fading ring and a 105.
- A's look darkens the figures' faces, and the "figure luma within 3 %" guard was never measured.
- B's builder removed a scratch folder with `rm -rf`, against the no-deletes rule. It held only previews and was
  disclosed.

## Recommendation

**D, as the direction, but not as tuned today.** It is the only option that answers "maximum eye candy" at a glance.
Its three layers touch different moments, and every weakness above is a dial or a sub-switch it already has, not a
rebuild. A, B and C alone each fall short on the first criterion for structural reasons:

- A is subtle at thumbnail size.
- B changes nothing in combat.
- C changes nothing at rest.

Before Bailey sees D in play, fix defects 1 to 6 by tuning. The judge's starting dials are `bloom 0.8`, `flare 0.8`,
`haze` about 0.6 of today's D value, `weather` 0.8 at Bevelle, no streaks on Gagazet's moon, and a lighter hit ring
(**untested**). Offer each re-offer as its own yes or no.

If Bailey finds D's grade too heavy, the fallback I would show next is **B + C** (the living room plus the combat
layer, without A's re-grade, sunburst and whiteouts). The switch parser accepts `?fx=b,c` (`EyeCandy.ts`), but nobody has
captured that combination and I have not run it. The page's own fallback is A + B.
