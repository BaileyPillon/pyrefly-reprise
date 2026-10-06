> **WITHDRAWN (Bailey, 2026-10-06 12:33:59 EDT; D-486).** He said: "actually im not sure about this new art change. go back to what it was before...before i asked you to use chatgpt images 2.5." The cast repaint below is not going ahead. The game's art stays as it is (the Gullwings title stays, D-487), new art for the main game goes back to the local Animagine pipeline (docs/ART-PIPELINE.md), and ChatGPT Images 2.5 is used only for the experimental Leblanc chapter (D-488, D-489).
> His four picks in the table below (approval, budget, order, no Sunburst) are D-481 to D-484, all superseded. Nothing from this plan was installed in public/art. Kept for the record; do not build from it.

# Cast repaint through the Art Room (plan, 2026-10-06)

Bailey, 2026-10-06 ~11:55 EDT, verbatim: "from now on you will coordinate with codex in art room to generate artwork for the game beginning with the characters and bosses". His picks (about 12:00 EDT):

| Question | His pick |
|---|---|
| Approval | "Anchor + veto sheet (Recommended)" |
| Budget | "7 for idles, 3 for others (Recommended)" |
| Order | "Party first, then bosses (Recommended)" |
| Sunburst | "No, ChatGPT's own choice (Recommended)" |

Game case: both (shared art pipeline). Every subject's own case comes from its game.

## How one character goes

1. **Anchor (idle), best of 7.**
   - **References:** the current approved idle (identity: costume, props such as Tidus's chain necklace, colours, weapon), the approved title key art and 2 to 3 approved masters (style: smooth glowing anime painting, soft gradients, clean edges, bloom and rim light; never the Ink & Gold UI palette).
   - **Critic:** scores identity against the old painting and research/, as well as style.
   - **Approval:** Bailey approves by hand in the Art Room app. An anchor is NEVER auto-approved, not even in away mode. The newer pick supersedes away mode for anchors.
2. **Poses, best of 3 each**, painted from the approved anchor (identity) plus the old pose painting (pose and silhouette).
   - Auto-approved when the critic scores 8 or more; below 8 the best version waits for Bailey.
   - When a character's poses are done, a **veto sheet** (every pose at battle size, old above new, scores) goes to Bailey. Nothing ships until the sheet passes his veto window.
3. **Game-ready, CPU and local only (no image generation):**
   - matte to clean alpha (if the image is not already transparent);
   - frame to the figure's canvas, facing and feet line;
   - upscale to the @2x/@3x/@4x tiers;
   - measure the pose registration (head and feet, CHK-026) and update the posescale tables.
4. **Install, the order matters:**
   - archive the old files to the private repo `BaileyPillon/pyrefly-art` FIRST (`tools/archive-replaced.mjs`);
   - install on a lane branch;
   - gates, then the continuity harness, then the critic's focused review;
   - ship with the next release.

A character ships only when its whole pose set is approved, so no figure mixes old and new art.

## Order

1. **The FFX party:** Tidus (PILOT), Yuna, Auron, Wakka, Lulu, Kimahri, Rikku.
2. **The FFX-2 girls**, base and dresspheres. The idles Bailey already approved on 2026-10-05 (Yuna Gunner, Rikku Thief, Paine Warrior) are their anchors.
3. **Bosses**, chapter by chapter (I to XVIII), then foes.

## Budget

- About 0.09 weekly Codex points per image, measured in data/usage.jsonl.
- About 2,500 images in all (104 idles x 7, plus about 590 poses x 3), roughly 2.3 weeks of the ChatGPT allowance.
- The relay stops new rounds at 80 percent weekly, or after a round over 10 points.
- This week (41 percent at 11:45 EDT): about 300 images, enough for the FFX party.

## Pilot gates (Tidus) before the roll-out

The roll-out to the other six FFX party members starts only when the pilot shows all of these:

- the anchor is approved by Bailey;
- the poses are consistent with the anchor (same costume and props, same head size; CHK-026 passes in Ch I with the new set);
- the matte is clean (no fringe);
- the tiers look right at 4K;
- the critic's focused review finds no identity regression.
