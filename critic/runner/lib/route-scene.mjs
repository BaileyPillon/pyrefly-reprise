// Route driver: reading a cutscene the way a player meets it (PR-0261, critic round 19).
//
// The route held Enter for 4 s whenever the screen was a cutscene after the results. Hold-to-skip fast-forwards
// after 550 ms by design, so every post-battle scene "ran at one line per frame" and round 19's capture owner
// reported a major that the confirmer refuted (with no input, the post lines type at about 47 ms per character and
// wait 145 to 147 s). This watches first with NO input, records whether the scene moved by itself, then advances
// with taps (one Enter, then a look), and falls back to the old hold only for a scene that outlasts the tap budget.
// Game case: both (shared critic plumbing).
import { dboxStep } from './route-pure.mjs';

/** One reading of the visible dialogue box, as the recorder reads it. */
const readBox = (page) => page.evaluate(() => {
  const box = document.querySelector('.dbox.dbox--visible');
  if (!box) return null;
  const q = (sel) => (box.querySelector(sel)?.textContent ?? '').trim();
  return {
    speaker: q('.dbox__speaker'), role: q('.dbox__role'),
    text: ((box.querySelector('.dbox__text') ?? box.querySelector('.dbox__body'))?.textContent ?? '').replace(/\s+/g, ' ').trim(),
    portrait: null, narrate: box.classList.contains('dbox--narrate'),
  };
});

/**
 * Watches the scene on screen with no input for `watchMs`, then taps Enter every `tapGapMs` until it ends.
 * Returns `{ watch: { ms, shows, advancedWithoutInput, firstLine }, taps, holds, ended, lines }`; the caller keeps it
 * in run.json. `scr()` reads the screen id. Never presses anything during the watch.
 */
export async function watchThenTap({ page, input, scr, watchMs = 6000, maxTaps = 90, tapGapMs = 1500, maxHolds = 14 }) {
  const mem = { lines: [], seen: null };
  const t0 = Date.now();
  const sample = async () => { dboxStep(mem, await readBox(page), Date.now() - t0, await scr()); };
  while (Date.now() - t0 < watchMs && (await scr()) === 'cutscene') { await sample(); await page.waitForTimeout(250); }
  const shows = mem.lines.length;
  const out = {
    watch: { ms: Date.now() - t0, shows, advancedWithoutInput: shows > 1, firstLine: mem.lines[0]?.text?.slice(0, 160) ?? null, screenAfterWatch: await scr() },
    taps: 0, holds: 0, ended: false, lines: [],
  };
  for (; out.taps < maxTaps && (await scr()) === 'cutscene'; out.taps++) {
    await sample();
    out.lines.push((mem.lines[mem.lines.length - 1]?.text ?? '').slice(0, 120));
    await input.press('Enter');
    await page.waitForTimeout(tapGapMs);
  }
  for (; out.holds < maxHolds && (await scr()) === 'cutscene'; out.holds++) await input.hold('Enter', 4000);
  out.ended = (await scr()) !== 'cutscene';
  // one entry per line shown: drop empties, repeats of the last sample and a half-typed line the next sample completes
  out.lines = out.lines.filter((l, i, all) => l && l !== all[i - 1] && !(all[i + 1] ?? '').startsWith(l));
  return out;
}
