// Route driver: Lulu's Doublecast, played by real input (FFX only: only the FFX engine publishes a wrapper row; R59 fix of the CHK-022 stall in Chapter III).
//
// What the card says. The advisor names a wrapper row's command with BOTH casts, `"Doublecast: Firaga + Firaga"` (or `"Doublecast: Fira + Blizzard"`; `wrappedLabel` in
// `src/engine/tactics/advisor.ts`). What the menu shows. Special > Doublecast opens the Black Magic list headed "Doublecast 1 of 2" and then that spell's target step; the second
// round is the same list again and a second target (`src/ui/ffx/DoublecastFlow.ts`). The rows of that list are the spell names alone ("Firaga").
//
// The route used to cut the card's text after the colon and look for a row containing the WHOLE of it, `firaga + firaga`. No row ever contains that, so every Doublecast pick found no
// spell, backed out, and after two such failures (`rec.dcFail`) the generic path took "Doublecast: Firaga + Firaga" for a row label, found none and pressed Attack: in the release 58
// focused review's Chapter III run 84 of 368 picks were Lulu's Doublecast turned into an Attack (the party's damage dealer), the boss stood at about half HP at the end and the party
// was defeated at the 370th pick, on live r57 too. Replaying that behaviour on the engine (the shipped line with Lulu's Doublecast turned into an Attack from her third) loses every seed
// tried with the boss at 30,000 to 58,000 of 120,000, which is what the harness saw; the line itself wins 7 of 8.
//
// Pure apart from the page calls it is handed, so `tests/unit/critic-route-doublecast.test.ts` drives it with a fake chooser.

/**
 * The casts a Doublecast card names, lower-cased and in order: `"Doublecast: Firaga + Firaga"` -> `['firaga', 'firaga']`, `"Doublecast: Fira + Blizzard"` -> `['fira', 'blizzard']`.
 * A card that names one spell (the shape before the card named both) casts it twice. `[]` for a label that is not a Doublecast card or names nothing.
 */
export function doublecastCasts(label) {
  const text = String(label ?? '');
  if (!/^\s*doublecast\b/i.test(text)) return [];
  const rest = text.includes(':') ? text.slice(text.indexOf(':') + 1) : '';
  const names = rest.split('+').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (names.length === 0) return [];
  return names.length === 1 ? [names[0], names[0]] : names.slice(0, 2);
}

/** Does a row's label name this spell exactly (case aside)? */
export const isSpellRow = (name) => (label) => String(label ?? '').trim().toLowerCase() === name;

/** A weaker match for a label that carries more than the name (a cost, a count): the label contains the name. Tried only after the exact one found no row. */
export const containsSpellRow = (name) => (label) => String(label ?? '').toLowerCase().includes(name);

/**
 * Plays one Doublecast: Special > Doublecast, then for each of the card's two casts the spell's row and its target.
 * @param {object} o
 * @param {{choose:(pred:(label:string)=>boolean)=>Promise<string|null>}} o.chooser the route's menu chooser (route-ui.mjs makeChooser)
 * @param {{label:string,target:string|null}} o.adv the card's top move
 * @param {(name:string|null)=>Promise<unknown>} o.confirmTarget confirms the open target cursor on the named target (and records a wrong one)
 * @param {()=>Promise<boolean>} o.menuStillOpen is the HUD still waiting for the player (round 2's list is up)
 * @param {(ms:number)=>Promise<void>} o.wait
 * @param {number} o.turn the route's turn counter, for the record
 * @param {string} o.phase the playback phase, for the record
 * @returns {Promise<{turn:number, actor:string, want:object, casts:string[], steps:object[]}>} the record `rec.doublecast` keeps; `steps` holds one `{ k, spell }` per round tried
 */
export async function playDoublecast({ chooser, adv, confirmTarget, menuStillOpen, wait, turn, phase }) {
  const casts = doublecastCasts(adv.label);
  const dc = { turn, actor: phase, want: adv, casts, steps: [] };
  if (!casts.length) return dc;
  if (!(await chooser.choose((l) => /^special$/i.test(l)))) return dc;
  const found = await chooser.choose((l) => /^doublecast/i.test(l));
  dc.steps.push({ found });
  for (let k = 0; found && k < 2; k++) {
    const name = casts[k] ?? casts[0];
    const spell = (await chooser.choose(isSpellRow(name))) ?? (await chooser.choose(containsSpellRow(name)));
    dc.steps.push({ k, spell });
    if (!spell) break;
    await confirmTarget(adv.target);
    await wait(700);
    if (!(await menuStillOpen())) break;
  }
  await wait(2500);
  return dc;
}
