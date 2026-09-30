# sfx-b: paper preflight (AGENTS.md rule 15)

Written before building, 2026-09-30. `node tools/critic-plan.mjs --paths src/app/SaveData.ts,src/audio/sfxMix.ts,src/audio/AudioManager.ts`
classes the change **DEEP** (save data and settings; audio routing): a deep review of the production
candidate before the deploy that ships it (save-data class). Game case: **both** (the SFX bus, the
save default and the migration are shared plumbing; CHK-020). No research doc distinguishes FFX and
FFX-2 effect loudness.

## The decision

D-293 (Bailey, 2026-09-29 ~23:00 EDT, "yes, all your recommendations", recommendation 2): SFX balance
**b**, effects +6 dB against the D-210 default, so a hit lands level with the music's peaks, becomes
the default. Refines D-210. Option b as measured on `?sfxmix=b` (docs/handoff/fb-0929-sfx.md,
Chapter I mouse): `hit-1` RMS +7.6 dB, peak +1.7 dB against the music; `sword-slash-1` +7.5 / +1.7.

Named by Bailey: b, +6 dB, the default. **Inferred by the driver** (D-293 `where`, marked "ask before
building one"): an existing save's *untouched* SFX volume follows the new default; a volume the player
moved keeps its value. The brief builds that reading; it is put back to Bailey as a question, and it
lives in its own module so it can be switched off with one line.

## Design

1. **Where the +6 dB lives: the saved volume, not the trim.** `defaultSettings().sfxVolume` 0.35 -> **0.70**
   (0.35 x 2 = +6.02 dB, the same bus gain `?sfxmix=b` gave at the old default). The alternative, a
   permanent x2 trim on the bus, would double every *player-set* volume too (a 0.9 save would run the
   bus at 1.8, +5 dB over anything the slider has ever allowed), which the brief forbids. With the
   level in the default, the slider shows the truth (70 %), and 100 % is still bus 1.0.
2. **`?sfxmix=` stays for comparison, re-based on the new default.** Trims become a = 0.5 (-6.02 dB: at
   the default slider exactly the old D-210 bus 0.35), **b = 1 (the default, no parameter)**,
   c = 1.581 (at the default slider bus 1.107, the same as the old c). Never saved.
3. **Migration, once per save, marker-guarded** (`src/app/saveSfxBalance.ts`, SaveData.ts is over the
   400-line cap so it does not grow beyond one call and one field):
   - a blob whose settings carry `sfxBalanceMigrated === true` is left alone (the player's value,
     whatever it is, including a deliberate 0.35 chosen after the upgrade);
   - otherwise (a save written before D-293): `sfxVolume === 0.35` exactly -> 0.70; a stored value
     missing or not finite -> 0.9 (the D-210 rule, unchanged: such a save was playing at 0.9); any
     other value is kept exactly; then the marker is set;
   - a new profile's defaults carry the marker, so a fresh player who later picks 0.35 keeps it.
   Why a marker and not "0.35 always moves": the slider steps 0.1 and rounds to 0.01
   (`pause/settings.ts` `clamp01`), so 0.45 -> 0.35 lands on exactly 0.35. Without the marker a player
   who chose 0.35 after the upgrade would be moved back to 0.70 on every load. Precedent:
   `ffx2AtbMigrated` (D-029).
4. **`SAVE_VERSION` stays 1.** Presence of the marker decides, as `ffx2AtbMigrated` and `seenCoach` do;
   a version bump would add nothing and would make an older build (a rollback) read the blob as newer.
   An older build that reads a migrated blob ignores the unknown marker field and plays 0.70 (the
   player's stored value): harmless.
5. `AudioManager`'s constructor default (the mixer before a save loads) follows: 0.70, from one shared
   constant in `sfxMix.ts` so the two can never disagree again.
6. `docs/audio/THEMES.md` SFX rule 8 amended with D-293 and Bailey's words (it said "SFX peak 6 dB
   below the music's ceiling"; option b puts hit peaks about level with the music's).
7. `docs/CONTRACTS.md` / `CONTRACT-CHANGES.md`: `SaveData.ts` is not a listed contract file (checked),
   so no entry; the new field is additive and optional anyway.

## Risks and how each is closed

| Risk | Closed by |
|---|---|
| A player who once moved the slider and came back to exactly 0.35 is moved to 0.70 once | Accepted and disclosed: indistinguishable from untouched in a pre-D-293 blob; one step on the slider undoes it. Pre-D-210 values (0.9 default, 0.1 steps) never land on 0.35 |
| The two-tab merge (`saveMerge.ts`) writes a stale 0.35 back | Both sides of the merge go through `migrate`, so base, theirs and ours all read 0.70 + marker; a unit test covers an old-build blob written under a new-build tab |
| The limiter pumps on louder hits | Measured: limiter gain reduction and post-limiter peak sampled every 25 ms through a real-click Chapter I and IV fight on a production build |
| Clipping at the top of the slider | The bus at slider 100 % is 1.0, the same ceiling as before D-210; option b's loudest bus peak measured about -9 dBFS at 0.70 |
| Another setting, clear or pick lost in the upgrade | Unit tests on release-29, 30 and 31a fixtures written by those builds' own SaveStore: every other setting, clear, best time and seen line kept |
| Rollback to an older build | Covered in 4 |

## Proof owed (before the handoff)

- Unit: new profile 0.70 + marker; untouched 0.35 -> 0.70; player-set values (0, 0.1, 0.6, 0.9, 1)
  kept; missing -> 0.9; marker-carrying 0.35 kept; idempotent (migrate twice); release-29 / 30 / 31a
  fixtures; the `?sfxmix=` re-base.
- Production build, real clicks, `tools/audio/sfx-probe.mjs`, Chapter I (FFX) and Chapter IV (FFX-2),
  default settings, no parameter: `hit-1` RMS and peak against the music within 1 dB of option b's
  (+7.6 / +1.7 dB); limiter reduction and master peak logged (no pumping).
- `npx tsc --noEmit`, targeted tests, the full suite once, `node tools/orphans.mjs`.
