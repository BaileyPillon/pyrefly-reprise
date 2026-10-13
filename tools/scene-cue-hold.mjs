// Scene-cue proof, the bound experiment (r46-scenecue; both games, shared loading plumbing). NOT product code.
//
// Question it answers: if the files that compete with the opening scene's cue were held back until the cue had arrived, would the cue be
// playing at the first spoken line? The product change (`SceneCueGate`) holds only what the flow itself starts at the card confirm; this
// holds, in the browser's network layer, whole classes of request from the confirm until the cue's response has finished (or a cap), so the
// harness can bound what any product rule of that kind could win, and what it would cost the first battle menu, without writing it.
//
//   --hold=art            every request under /art/ and /fx/ (the party prep's portraits, the pause plate, the idle paintings, the battle's backdrop)
//   --hold=art,packs      and the SFX parity packs
//   --hold=art,packs,music  and the other music cues (the boss, victory and defeat cues)
//   --holdcap=8000        release after this many ms even if the cue has not arrived (default 8000)
//
// The hold is a Playwright route: requests under it wait inside the browser, then continue to the server, and the emulated link applies after.
// Playwright turns the HTTP cache off while a route is installed; every run starts with an empty cache anyway, so only a repeat request for a file
// already fetched in the same run (the battle backdrop is asked for twice) differs from a run without a route.
export function parseHold(spec) {
  const kinds = new Set(String(spec || '').split(',').map((s) => s.trim()).filter(Boolean));
  return { art: kinds.has('art'), packs: kinds.has('packs'), music: kinds.has('music'), any: kinds.size > 0 };
}

/**
 * Install the hold on a browser context. Returns `{ arm, noteCueDone, log }`: call `arm()` at the card confirm, `noteCueDone()` when the opening cue's
 * response has finished or failed (the harness reads that from the protocol's network events); `log` lists every held request with how long it waited.
 */
export async function installHold(context, { hold, capMs = 8000, cuePath }) {
  const state = { armed: false, released: false, armedAt: 0, release: () => undefined };
  const log = [];
  const gate = new Promise((resolve) => { state.release = () => { if (!state.released) { state.released = true; resolve(); } }; });
  const matches = (path) => {
    if (hold.art && (path.startsWith('/art/') || path.startsWith('/fx/'))) return true;
    if (hold.packs && path.startsWith('/audio/sfx/parity-')) return true;
    if (hold.music && path.startsWith('/audio/music/') && path !== cuePath) return true;
    return false;
  };
  await context.route('**/*', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (state.armed && !state.released && matches(path)) {
      const t = Date.now();
      await gate;
      log.push({ path, waitedMs: Date.now() - t, sinceArmMs: t - state.armedAt });
    }
    try { await route.continue(); } catch { /* the page closed */ }
  });
  const timers = [];
  return {
    log,
    arm: () => { state.armed = true; state.armedAt = Date.now(); timers.push(setTimeout(state.release, capMs)); },
    noteCueDone: () => state.release(),
    stop: () => { state.release(); for (const t of timers) clearTimeout(t); },
  };
}
