# Six open game-data questions, answered or turned into options (2026-09-23)

Paper only (hard rule 6). Every fact below carries its source; FF Wiki pages were read as raw
wikitext through the MediaWiki API, with the revision id. Engine claims were checked by running
the real `FFX2Engine` on `main` b77ae3a (node `--experimental-transform-types`, chapter 6 Act I,
`chateauBuild`), not by reading code. New facts went into the research files named per item.
Game case: **FFX-2 only**, except Q3, which is **FFX only**.

| # | Question | Status | Who acts |
|---|---|---|---|
| 1 | Dressphere at a chain seam | **needs Bailey** (no source says) | Bailey picks A, B or C |
| 2 | Grenade damage (PR-0087) | **settled**: 187-211 per enemy | data fix |
| 3 | Reward items with no item row | **settled**: five FFX sphere items | data fix |
| 4 | "Dr. Goon B" lettering (PR-0013) | **settled**: FFX-2 names its duplicates itself | data + HUD fix |
| 5 | Redoubt steal; Steal / Pilfer Gil wiring | Redoubt **settled**; wiring is a **live chapter 6 bug** | fix, one yes |
| 6 | Leblanc's open fan colour | **needs Bailey** (one source vs your pick) | Bailey picks |

## 1. Does a girl keep a dressphere she changed into mid-battle? No source answers it.

**Evidence.** Nothing in the sources read says whether the next battle starts in the dressphere the
last one ended in, or in the one it started in. Searched: FF Wiki *Dressphere* (rev 4045630),
*Garment Grid* (3998878), *Floral Fallal*, *Machina Maw*, *Final Fantasy X-2 commands*, *Battle
Results*; Split Infinity's guide (GameFAQs 25872: menu, battle system, battle end, Garment Grid
chapters); fourteen more GameFAQs FAQs; GamerGuides; FF Wiki walkthroughs; the Japanese *ffdic*
wiki. Log: `research/ffx2-combat-core.md` §8.2.
Two edges of the question *are* sourced and hold for every option: gate (T-) bonuses end with the
battle (Split Infinity G1608; research §4.1) and the special-dressphere unlock counts dresspheres
worn "during the battle" (§3.15). So `passedGates` and `wornThisBattle` reset at every seam, as
today. The HP/MP clamp (8b2ff51) is right under every option.

**Options** (today the seam silently reverts her, `carryFfx2` in `BattleScreenSetup.ts:143`):
- **A. Carry it.** She starts the next link in what she ended in (copy `currentDressphere` and
  `garmentGrid.nodePosition`; gates and worn-list reset). A change the player chose survives.
- **B. Revert, and say so.** Keep today's rule and show one line at the seam ("Rikku returns to
  Thief"), so it stops being silent.
- **C. Settle it on a real copy.** One battle on FFX-2 (spherechange, win, open Equip) answers it
  in two minutes. The PCSX2 rig in memory runs FFX, not X-2.

**Recommendation: C if you own a copy; otherwise A**, recorded as your ruling, not as canon. A
seam reads as "the fight goes on", and today's silent revert is what the critic flagged.
A special dressphere at a seam is unsourced too; under A, revert her to the dressphere she
transformed from and bring the other two back.

## 2. Grenade (PR-0087): base 200, so 187-211 per enemy before chain; ours doubles it.

**The engine today** (seeds 1-30, 15 hits, my run): every hit is a crit; unchained first hits 378-423.
Data: `x2-item-grenade`, power 4, `crit-eligible` + `bonusCrit: 100`
(`src/data/ffx2/items/effects-damage.ts:33-50`).
**What the sources print.** Power 4 (×50 = 200) in pbirdman's calculator (research §2.9.3). Split
Infinity's item entry prints "187-212 (CRIT!)". SinirothX gives the enemy-thrown Grenade as
"187 to 211 HP (type: randomized constant)", and the FF Wiki enemy-abilities page (rev 3998493)
gives "187~211". 187-211 is exactly 200 × rand(240..271)/256, the step-7 randomiser.
**Why the "always critical" reading fails.** Split Infinity writes "**guaranteed** CRIT" for Burst
Shot and Scatterburst. "(CRIT!)" is his crit tag, and even his printed band is the undoubled one.
FF Wiki *Critical hit* (rev 4049711) lists every guaranteed-crit source in X-2 and names no item.
**The "base 300" line is a mix-up.** 281-317 is the Lady Luck reel *Primo Grenade* (Split Infinity
G14531) and the Lv 2 elemental items. No source prints 300 for the Grenade item. Recorded in
`research/ffx2-leblanc-syndicate.md` §18 C18.1 and `ffx2-combat-core.md` §8.1.

**Fix (data, no question).**
- `effects-damage.ts`: drop `bonusCrit: 100` from `x2-item-grenade`. Keep `crit-eligible`
  (Split Infinity's tag, single source) or drop it too: either way, no guaranteed crit.
- Fix the "base 300" comments: `src/data/ffx2/builds/chateau.ts:184` and
  `src/data/ffx2/enemies/leblanc-syndicate-acts.ts:119`.
- Test: chapter 6 Act I, seeds 1-30, an unchained non-crit Grenade hit lands in 187-211, and the
  advisor card shows that band.
- Consequence: the Act I Grenade loop does about half the damage the chapter was measured with.
  Re-run `tests/unit/strategy-ffx2-leblanc.test.ts` and report the win rate. Never compensate on the boss.

## 3. The reward items with no item row are FFX sphere items: three named, two more found.

The three named in `seymour-anima-macalania.ts` G-10: **Blk Magic Sphere** (Seymour's common drop
at Macalania; Evrae), **Ability Sphere** (Guado Guardian, Anima) and **Special Sphere** (Seymour's
*rare* drop, not shipped because `drops` has no common/rare pair). Comparing every reward id in
`src/data` with `FFX_ITEMS`/`FFX2_ITEMS` finds two more: **Lv. 3 Key Sphere** (Yunalesca, ch. 2)
and **Lv. 4 Key Sphere** (Seymour Flux, ch. 1). Results title-case the raw id ("Blk Magic
Sphere"); the Steal banner prints it raw (`steal.ts#itemName`).

| Row | Help text (FF Wiki, rev) | Use |
|---|---|---|
| Ability Sphere | "Activates nodes on Sphere Grid." (4033565) | activates Skill / Special / Wht / Blk Magic nodes |
| Blk Magic Sphere | "Activates nodes used by allies on Sphere Grid." (4033582) | a Blk Magic node an ally already activated |
| Special Sphere | same text (4033579) | a Special node an ally already activated |
| Lv. 3 / Lv. 4 Key Sphere | "Opens Locks on Sphere Grid." (4032267 / 4032268) | opens a Lv. 3 / Lv. 4 lock |

Classes agree with `research/ffx-combat-core.md` §10.2; the table is appended there too. **Fix:**
a new `src/data/ffx/items/spheres.ts` with five rows: `usableInBattle: false`, price 0 (no shop
lists any sphere, single source) and a no-op effect, since `ItemDef.effect` is required. If
`ItemDef` has to change shape, that is a CONTRACT-CHANGES entry. Add Special Sphere only when a
rare-drop roll exists. Side note, FFX-2: `gris-gris-bag` prints as "Gris Gris Bag" (should be
"Gris-Gris Bag"), and the steal ids `x2-budget-grenade`, `x2-l-bomb` and `x2-mute-shock` have no
row. They would print "X2 ..." the day Steal is wired (Q5).

## 4. PR-0013: FFX-2 gives its duplicate enemies distinct names, so nothing needs a letter.

Duplicate names occur only in the Vegnagun formations, and there the game names each part itself.
SinirothX and the FF Wiki infoboxes agree: **Node A / Node B / Node C** (bestiary #246-248), **Right
Bulwark / Left Bulwark** (#250-251), **Right Redoubt / Left Redoubt** (#253-254). Sources:
*Node (Final Fantasy X-2)* rev 3999002, *Bulwark (Final Fantasy X-2)* 3990465, *Redoubt* 3990466.
Each is its own enemy record. **Dr. Goon is one enemy in a three-name formation (Ormi, Dr. Goon,
Fem-Goon), so no rule letters him.** Whether X-2 auto-letters generic look-alikes is in no source,
but no FFX-2 formation of ours has any once the parts carry their names (checked all nine groups
by running the data). **Fix:** rename `node-a/b/c` to "Node A/B/C", `bulwark-r/l` to "Right/Left
Bulwark" and `redoubt-r/l` to "Right/Left Redoubt" in `src/data/ffx2/enemies/vegnagun-*.ts`; make
`FFX2BattleHud.ts:974` `letterTagOf` return nothing; add a test that no FFX-2 group has two equal
names. FFX keeps its own lettering. Research: `ffx2-vegnagun-shuyin.md` §13.2 S3.

## 5. Redoubt: Phoenix Down ×1 / Mega Phoenix ×1, 50%. Steal is broken live in chapter 6.

**Redoubt (settled).** Both Redoubts: common Phoenix Down ×1, rare Mega Phoenix ×1, steal byte 128
(50.2%), Pilfer Gil 350. Sources: FF Wiki *Redoubt* rev 3990466 prints `x1` for both slots;
SinirothX prints "Phoenix Down/Mega Phoenix (50%)" and writes a count only above 1 (the *Bulwark*
page's `x1` rows match SinirothX's plain rows, which confirms that). Fix: add the steal table to
the Redoubt records in `src/data/ffx2/enemies/vegnagun-head.ts`. Research §13.2 S1-S2 closes row 17.

**Wiring: a live defect, not future work.** The handoff called FFX-2 Steal unreachable, but
chapter 6 (live since release 09) gives Rikku `x2-thief-steal` and `x2-thief-pilfer-gil`
(`chateau.ts:130`), and our Dr. Goon sensor text says "Carries grenades. Steal them." Run on the real
engine, **STEAL spends her turn with no event** (`action-start`, `action-end`, nothing between) and
**PILFER GIL emits only a 0-damage hit, with no gil event**. What the sources say they should do:
- **Steal** (Thief, innate): one success per enemy per battle, reset by Oversoul (research §3.2;
  FF Wiki *Steal* rev 4035497). Success = the enemy's steal byte / 255, then 87.5% common /
  12.5% rare (`ffx2-bahamut.md` §1.6). Chapter 6: three Elixir-tier steals at 192/255 (75.3%),
  plus the Dr. Goon's Budget Grenade / Grenade (`ffx2-leblanc-syndicate.md` §3, §4.6).
- **Pilfer Gil** (30 AP, 2 MP): takes the enemy's stolen-gil figure once, reset by Oversoul
  (SinirothX "Stolen Gil: [Gil you can steal from monster]"; research §3.2). Chapter 6 holds
  2,740 gil (Leblanc 1,500, Logos 640, Ormi 600; `ffx2-leblanc-syndicate.md` §6.3).
  This needs a stolen-gil field on the enemy rewards type: a CONTRACT-CHANGES entry.
- No chapter 4 or 5 build lists a Thief ability as learned, and the menu reads that list
  (`src/battle/ffx2/targeting.ts:249`), so chapter 6 is where the commands show.
Recommendation: **treat it as a bug fix.** The commands are already on the menu, so wiring them to
the sources is not new gameplay. The one alternative for Bailey: hide Steal and Pilfer Gil from
chapter 6 until they work. Wiring them also needs the three FFX-2 steal item rows from Q3.

## 6. Leblanc's open fan: the "red and silver" line has one source, and your pick shows lilac.

**Source check.** §10.1's line paraphrases one uncited sentence of FF Wiki *Leblanc* (rev 4043712,
Appearance): "She wields a red-and-silver fan in her right hand." The "[verified: 2 sources]" after
it belongs to the next paragraph (the Lady Luck note). The Villains and Heroes wikis repeat the
sentence verbatim, so they are copies. No source says which part is red, which is silver, or what
the open leaf looks like. Now tagged `[single source]` (`ffx2-leblanc-syndicate.md` §18 C18.2).
**What the pictures show.** Your approved concept (pose B, "fan fully open, warm magenta",
`docs/concepts/chapters/leblanc/renders/leblanc-b.png`) has a **lilac leaf on brown ribs with a
gold boss**. The approved idle holds the fan closed: **dark violet guards with pale stripes**. The
LoRA cast candidate has a **red leaf, black-and-white ribs and one dark half-leaf**, which is the
"fan leaf colour" defect the judges noted.

**Options.**
- **A. Source:** red leaf, silver ribs, the idle's dark guards. This fits the source and the idle,
  since a closed fan shows only guards and rib edges.
- **B. Your pick:** B's lilac leaf and brown ribs, and the sourced red-and-silver stays unused.
- **C. Mixed:** red leaf with B's gold boss, silver ribs.

**Recommendation: A.** It matches the only source without contradicting the approved idle. Pick
B if the "warm magenta" in your recorded pick meant the fan itself: the pick is yours, the
source is one uncited wiki line.
