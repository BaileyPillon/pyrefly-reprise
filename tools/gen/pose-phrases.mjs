/**
 * Canon pose phrases — body language only, no effects.
 *
 * 2026-09-21 incident: a pose render for `yuna-dark-knight` was prompted with
 * `dark aura, black and purple, attacking, dynamic pose, action pose` in
 * `--poseTags`, on top of `white background` that already came from the
 * pipeline's own composition block. On this checkpoint, effect words in a pose
 * prompt reliably spray a coloured swirl around the figure that rembg keeps as
 * opaque content — see `docs/ART-PIPELINE.md` §2 item 4 and §6 "Painted-in
 * effects and dirty cut-outs". `comfy.mjs` now strips those words on sight
 * (`EFFECTS_BANNED_TOKENS` / `lintSpritePrompt`), but the better fix is to
 * never need effect words to describe a pose in the first place: a pose is a
 * body position, and the cel-shaded style + rim lighting already carries the
 * "impact" the effect words were reaching for.
 *
 * This table is the fallback body language for the seven states the game
 * actually uses (`idle`, `attack`, `cast`, `item`, `hurt`, `ko`, `victory` —
 * the pose set every character folder in `public/art/characters/<id>/`
 * carries). `comfy.mjs` uses it when `--pose <name>` is given and the caller
 * supplied no `--poseTags` at all; it never overrides a caller's own pose
 * text, named or not. Character- and boss-specific poses in `tools/gen/
 * cast.json` should keep writing their own richer `poseTags` — this table
 * exists for the generic case and as the phrase an agent copies as a
 * known-clean starting point.
 *
 * Nothing here needs an effect word: `attack` gets its punch from `weapon
 * raised, weight forward` plus the shared style contract, not from `dark
 * aura`. Every phrase below is safe against `lintSpritePrompt` by
 * construction — none of `EFFECTS_BANNED_TOKENS` appears in any of them,
 * which `tests/unit/art-prompt-lint.test.ts` asserts so the table cannot
 * silently drift back into needing its own lint pass.
 *
 * `ko` is deliberately just the body ("lying on side, eyes closed") — the
 * head/feet direction is `PRONE_FACING_PHRASES` in comfy.mjs (§2a of the
 * pipeline doc), which this table does not duplicate.
 */
export const CANON_POSE_PHRASES = Object.freeze({
  idle: 'standing at ease, relaxed posture, weapon lowered or sheathed',
  attack: 'weapon raised, weight forward',
  cast: 'focus item or hand extended, other hand open',
  item: 'holding item out at chest height, attentive posture',
  hurt: 'flinching, arm guarding',
  ko: 'lying on side, eyes closed',
  victory: 'relaxed, weapon lowered or shouldered',
});

/** The seven pose names this table covers, in the order the game states them. */
export const CANON_POSES = Object.freeze(Object.keys(CANON_POSE_PHRASES));

/** The phrase for `pose`, or `null` for anything outside the canon set. */
export function canonPosePhrase(pose) {
  return Object.prototype.hasOwnProperty.call(CANON_POSE_PHRASES, pose)
    ? CANON_POSE_PHRASES[pose]
    : null;
}
