/**
 * THE MEGA FLARE EFFECT'S PARTY BLAST, TURNED DOWN WHILE THE HELD BREATH PLAYS (lane "pro-staging"; Bailey 2026-10-22: boss big moves "Held breath, full painting": "the party stays clear"; FFX-2 Chapter IV only).
 *
 * The spell layer's Mega Flare (`spellfx/effects-specials.ts#megaflare`, D-233) lands its blast ON the party: a white bloom and two glows centred on the girls for about 0.9 s, and a white wash over the whole frame
 * for a third of a second. The held breath cuts a clear window around each girl in its own wash, but those layers are DOM and sit under the HUD: they cannot take white out of the 3D frame, so the girls read as
 * three white blobs inside their windows (the review's M4, measured at 50 ms in a real fight: +375 to +548 ms). The only place to keep them in colour is the effect itself.
 *
 * So the effect reads this knob (1 everywhere, 1 with the staging off: today's blast exactly) and the layer sets it for the length of a staged Mega Flare and gives it back at the lift
 * (`ProStageLayer.armPoints`, the same hand-over the Mega Flare point light gets). The beam, the chest's core, the ring and the sparkle shockwave are untouched: only what lands ON the party is lighter.
 * The same hand-over turns the glow every effect lays over a FIGURE ('FxDrawList.bloom': the hit's contact bloom on each girl the blast strikes) down to 40 percent for the move's length.
 * [ours] numbers: the blast keeps 18 percent of its glow (a halo, not a blob), the wash 25 percent, the figures' blooms 40 percent.
 */
export const blastTune = { megaFlareParty: 1, megaFlareWash: 1, actorBloom: 1 };

/** What the staged breath sets while a Mega Flare plays. */
export const STAGED_BLAST = { megaFlareParty: 0.18, megaFlareWash: 0.25, actorBloom: 0.4 }; // not frozen: a capture can try other numbers (`import(...)` from the page)
