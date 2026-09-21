/**
 * One shared portrait lookup for every screen that draws a party member's
 * face as a roster tile: party prep's roster and slots, the Results screen's
 * per-member rows, and the chapter-select dossier's recommended-party strip.
 *
 * `docs/handoff/fix3-ffx2-hud-prep.md`'s LIVE-A2-1 found these three asking a
 * narrower question than the FFX-2 battle HUD's own party rows
 * (`ui/ffx2/PartyRows.ts`'s `faceStackHtml`) do: "does `portraits/<id>.png`
 * exist?" — which is the right and only question for FFX (one guardian, one
 * painted head, `portraitKey` names the file), but the wrong one for FFX-2,
 * where a build's `portraitKey` is that same plain id and the fleet's actual
 * X-2 likeness or dressphere painting can live one or two names over. Rikku
 * and Paine both had every layer {@link partyFaceHtml} tries — the prep
 * roster, the Results ledger and the chapter-select dossier just never asked
 * past the first, so they showed a letter tile while the pause screen's
 * party strip (which already climbs this same ladder) painted them fine.
 *
 * Every caller keeps its own initial-letter (or job-monogram) floor — the
 * chip layouts differ enough (a name's first letter here, a two-letter
 * dressphere monogram in the battle HUD) that this only owns the art layers,
 * not the fallback glyph underneath them.
 */

import { faceImgHtml, faceLayersHtml, type FaceOptions } from './portrait.ts';

export interface PartyFaceMember {
  /** Combat/build id: `tidus`, `yuna`, `rikku`, `paine`. */
  id: string;
  name: string;
  /**
   * FFX-2 only: the dressphere she is currently wearing
   * (`FFX2MemberBuild.currentDressphere` / `FFX2Combatant.dresspheres.current`).
   * Leave undefined for FFX — it has no dressphere and one portrait per id.
   */
  dressphere?: string;
}

/**
 * The face `<img>` layer(s) for one roster tile.
 *
 * FFX: `portraits/<id>.png` alone — a guardian has exactly one painted head,
 * exactly what `faceImgHtml` already does.
 *
 * FFX-2: three candidates, most specific first — `portraits/<id>-<dressphere>.png`
 * (rare; the fleet mostly paints a dressphere as a full body, not a portrait),
 * then `portraits/<id>-x2.png` (her X-2 likeness, dressphere-agnostic — what
 * `rikku-x2.png`/`yuna-x2.png` are), then the plain `portraits/<id>.png` that
 * also serves her FFX self. If none of those exist yet, the **body** layer
 * crops the head out of whatever dressphere idle painting the field is
 * already staging (`characters/<id>-<dressphere>/idle.png`), so a girl with
 * no dedicated portrait at all still gets a painted face instead of a
 * letter tile — the exact ladder `ui/ffx2/PartyRows.ts`'s `faceStackHtml`
 * climbs for the in-battle rows.
 */
export function partyFaceHtml(m: PartyFaceMember, opts: FaceOptions = {}): string {
  if (!m.dressphere) return faceImgHtml(m.id, m.name, opts);
  const art = `${m.id}-${m.dressphere}`;
  return faceLayersHtml([art, `${m.id}-x2`, m.id], art, m.name, opts);
}
