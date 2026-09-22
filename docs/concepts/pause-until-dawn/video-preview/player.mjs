// Clip-graph player for the Wan 2.2 living-portrait video preview.
// Plain JS, no build step (same throwaway rule as ../prototype/README.md:
// "none of this code is meant to be merged as-is"). Runs on two stacked
// <video> elements so a clip switch can cross-fade instead of popping.
//
// IMPORTANT — this demo is honest about what exists. Only clips with a real
// file in CLIP_LIBRARY play video; every other key in the brief's mapping is
// wired up (so the graph is ready the day the clip lands) but shows an
// on-screen "not yet rendered" message instead of faking motion. See
// README.md "What's real vs what's wired but empty" for the exact list.

const FADE_FRAMES = 8;
const FPS = 24;
const FADE_MS = Math.round((FADE_FRAMES / FPS) * 1000); // ~333ms, matches preview-stitched.webm's join

// Only clips that actually have a rendered, judge-approved file land here.
// Everything else in the brief's key map resolves through MISSING below.
const CLIP_LIBRARY = {
  'idle-breathing': {
    src: 'clips/idle-breathing/seed1.webm',
    category: 'idle',
    note: 'judge: identity 8, motion 6, returns-to-neutral 4 (camera creeps in by frame 121)',
  },
  smile: {
    src: 'clips/smile/seed1.webm',
    category: 'expression',
    note: 'judge: identity 9, motion 6, returns-to-neutral 5 (best of the set)',
  },
};

// name -> { key label for the legend, category } for clips the brief asks
// for that have no file yet (never rendered, or rejected and not re-rendered).
const MISSING_CLIPS = {
  'idle-blinks': { category: 'idle', reason: 'not yet rendered' },
  'turn-left-and-back': { category: 'turn', reason: 'REJECTED (heterochromia lost by frame 80, see compare.png) — seed 101 re-render never finished' },
  'turn-right-and-back': { category: 'turn', reason: 'not yet rendered' },
  'look-up-and-back': { category: 'turn', reason: 'not yet rendered' },
  determined: { category: 'expression', reason: 'not yet rendered' },
  hurt: { category: 'expression', reason: 'not yet rendered' },
  'hair-breeze': { category: 'idle', reason: 'queued, never finished (0 frames on disk)' },
};

const IDLE_CLIPS = Object.keys(CLIP_LIBRARY).filter((k) => CLIP_LIBRARY[k].category === 'idle');
const EXPRESSION_CLIPS = ['smile', 'determined', 'hurt']; // E cycles through this exact order

const KEY_TO_CLIP = {
  ArrowLeft: 'turn-left-and-back',
  ArrowRight: 'turn-right-and-back',
  ArrowUp: 'look-up-and-back',
  a: 'turn-left-and-back',
  d: 'turn-right-and-back',
  w: 'look-up-and-back',
};

export function createPlayer(root) {
  const stage = document.createElement('div');
  stage.className = 'clip-stage';

  const videoA = document.createElement('video');
  const videoB = document.createElement('video');
  for (const v of [videoA, videoB]) {
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.className = 'clip-video';
  }
  videoB.classList.add('is-hidden');

  const placeholder = document.createElement('div');
  placeholder.className = 'clip-placeholder is-hidden';

  const diagLine = document.createElement('div');
  diagLine.className = 'diag-line is-hidden';

  const legend = document.createElement('div');
  legend.className = 'legend';

  stage.append(videoA, videoB, placeholder, diagLine, legend);
  root.appendChild(stage);

  let active = videoA;
  let idle = videoB;
  let currentClip = null;
  let expressionIndex = -1; // first E press must land on index 0 (smile), not 1
  let reducedMotion = false;
  let extendHoldOnce = false;
  let diagVisible = false;
  let legendVisible = true;
  let idleTimer = null;
  let lastKeyClip = null;

  function preloadAll() {
    for (const name of Object.keys(CLIP_LIBRARY)) {
      const v = document.createElement('video');
      v.src = CLIP_LIBRARY[name].src;
      v.preload = 'auto';
      v.load();
    }
  }

  function renderLegend() {
    const rows = [
      ['← / → / ↑, A/D/W, right stick', 'turn (left / right / up)'],
      ['E', `cycle expression (${EXPRESSION_CLIPS.join(' → ')})`],
      ['B', 'idle-blinks'],
      ['← again during a turn hold', 'extend the hold'],
      ['R', 'reduced motion (freeze frame)'],
      ['F', 'diagnostics'],
      ['H', 'hide this legend'],
    ];
    legend.innerHTML =
      '<div class="legend-title">Living-portrait clip graph — preview</div>' +
      rows.map(([k, v]) => `<div class="legend-row"><kbd>${k}</kbd><span>${v}</span></div>`).join('') +
      '<div class="legend-foot">Full clip list and what is real vs. placeholder: README.md</div>';
  }

  function setDiag(text) {
    diagLine.textContent = text;
  }

  function updateDiagLoop() {
    if (!diagVisible) return;
    const t = active.currentTime.toFixed(2);
    const frame = Math.round(active.currentTime * FPS);
    setDiag(
      `clip=${currentClip ?? '(none)'} t=${t}s frame=${frame} fade=${FADE_MS}ms ` +
        `available=${Object.keys(CLIP_LIBRARY).length}/${Object.keys(CLIP_LIBRARY).length + Object.keys(MISSING_CLIPS).length}`
    );
    requestAnimationFrame(updateDiagLoop);
  }

  function showPlaceholder(name) {
    const info = MISSING_CLIPS[name];
    placeholder.textContent = info
      ? `"${name}" — ${info.reason}`
      : `"${name}" — not in the clip library`;
    placeholder.classList.remove('is-hidden');
    window.clearTimeout(placeholder._hideTimer);
    placeholder._hideTimer = window.setTimeout(() => placeholder.classList.add('is-hidden'), 2200);
  }

  let fadeToken = 0;

  function crossfadeTo(name, { loopHoldMiddleThird = false } = {}) {
    const entry = CLIP_LIBRARY[name];
    if (!entry) {
      showPlaceholder(name);
      return;
    }
    if (reducedMotion) return; // frozen still: ignore clip changes until R toggles it off

    // Looping the same clip back to itself (the only real case today: the
    // sole idle clip repeating) restarts it in place instead of "crossfading"
    // an element to itself. Reassigning a <video>'s .src to the identical
    // URL it already holds is unreliable across browsers for restarting an
    // ended clip (found live in this demo's own browser pass — see
    // README.md "A bug this pass found and fixed"); a plain seek+play on the
    // element that is already showing avoids that path entirely.
    if (name === currentClip && active.currentSrc && active.currentSrc.endsWith(entry.src)) {
      active.currentTime = 0;
      const p = active.play();
      if (p && p.catch) p.catch((err) => setDiag(`play() rejected: ${err.message}`));
      scheduleIdleReturn(entry.category);
      return;
    }

    const myToken = ++fadeToken;
    idle.pause();
    idle.removeAttribute('src');
    idle.src = entry.src;
    idle.load();
    idle.currentTime = 0;
    idle.classList.remove('is-hidden');
    idle.style.opacity = '0';
    const playPromise = idle.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch((err) => setDiag(`play() rejected: ${err.message}`));
    }

    // 8-frame opacity cross-fade, driven by rAF so it tracks real frame time
    // rather than trusting the CSS transition clock to match the video clock.
    const start = performance.now();
    function step(now) {
      if (myToken !== fadeToken) return; // superseded by a newer key press
      const t = Math.min(1, (now - start) / FADE_MS);
      idle.style.opacity = String(t);
      active.style.opacity = String(1 - t);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        active.classList.add('is-hidden');
        active.pause();
        active.style.opacity = '1';
        [active, idle] = [idle, active];
        currentClip = name;
        if (loopHoldMiddleThird) armHoldLoop(active);
        scheduleIdleReturn(entry.category);
      }
    }
    requestAnimationFrame(step);
  }

  function armHoldLoop(video) {
    const third = video.duration ? video.duration / 3 : 5.042 / 3;
    const onTime = () => {
      if (video.currentTime >= 2 * third) video.currentTime = third;
    };
    video.addEventListener('timeupdate', onTime);
    video._holdCleanup = () => video.removeEventListener('timeupdate', onTime);
  }

  function clearHoldLoop(video) {
    if (video._holdCleanup) {
      video._holdCleanup();
      video._holdCleanup = null;
    }
  }

  function scheduleIdleReturn(category) {
    window.clearTimeout(idleTimer);
    if (category === 'idle') return; // already an idle clip, nothing to return to
    idleTimer = window.setTimeout(() => {
      clearHoldLoop(active);
      playRandomIdle();
    }, 5042); // clip length; brief gives no explicit hold time for non-idle clips beyond "holds, returns"
  }

  function playRandomIdle() {
    if (IDLE_CLIPS.length === 0) return;
    const pick = IDLE_CLIPS[Math.floor(Math.random() * IDLE_CLIPS.length)];
    if (pick === currentClip && IDLE_CLIPS.length > 1) {
      // brief: "idle alternates ... so it never visibly loops" — with only one
      // idle clip available this branch never triggers; kept for when
      // idle-blinks/hair-breeze land.
      return playRandomIdle();
    }
    crossfadeTo(pick);
  }

  function handleKey(e) {
    const key = e.key;
    if (key === 'ArrowLeft' && currentClip === 'turn-left-and-back') {
      extendHoldOnce = true;
      crossfadeTo('turn-left-and-back', { loopHoldMiddleThird: true });
      return;
    }
    if (KEY_TO_CLIP[key]) {
      crossfadeTo(KEY_TO_CLIP[key]);
      return;
    }
    if (key === 'e' || key === 'E') {
      expressionIndex = (expressionIndex + 1) % EXPRESSION_CLIPS.length;
      crossfadeTo(EXPRESSION_CLIPS[expressionIndex]);
      return;
    }
    if (key === 'b' || key === 'B') {
      crossfadeTo('idle-blinks');
      return;
    }
    if (key === 'r' || key === 'R') {
      reducedMotion = !reducedMotion;
      if (reducedMotion) {
        active.pause();
        window.clearTimeout(idleTimer);
      } else {
        const p = active.play();
        if (p && p.catch) p.catch(() => {});
        scheduleIdleReturn('non-idle');
      }
      return;
    }
    if (key === 'f' || key === 'F') {
      diagVisible = !diagVisible;
      diagLine.classList.toggle('is-hidden', !diagVisible);
      if (diagVisible) requestAnimationFrame(updateDiagLoop);
      return;
    }
    if (key === 'h' || key === 'H') {
      legendVisible = !legendVisible;
      legend.classList.toggle('is-hidden', !legendVisible);
      return;
    }
  }

  // Gamepad right stick (axes 2/3 on the standard mapping), polled on rAF.
  // A held direction only fires once per ~500ms so it reads like a discrete
  // key press rather than repeating every frame.
  let lastStickFire = 0;
  function pollGamepad(now) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads && pads[0];
    if (pad && now - lastStickFire > 500) {
      const rx = pad.axes[2] ?? 0;
      const ry = pad.axes[3] ?? 0;
      const DEAD = 0.5;
      if (Math.abs(rx) > DEAD && Math.abs(rx) > Math.abs(ry)) {
        crossfadeTo(rx < 0 ? 'turn-left-and-back' : 'turn-right-and-back');
        lastStickFire = now;
      } else if (ry < -DEAD) {
        crossfadeTo('look-up-and-back');
        lastStickFire = now;
      }
    }
    requestAnimationFrame(pollGamepad);
  }

  function tryStartPlayback() {
    const p = active.play();
    if (p && p.catch) {
      p.catch((err) => {
        // Some embedding contexts refuse programmatic autoplay even for a
        // muted <video> (found live in this demo's own browser pass — see
        // README.md). Fall back to the standard pattern: wait for the
        // person's first click or key press, then retry once.
        setDiag(`autoplay blocked (${err.name}) — click or press a key to start`);
        placeholder.textContent = 'Click anywhere or press a key to start playback';
        placeholder.classList.remove('is-hidden');
        const resume = () => {
          placeholder.classList.add('is-hidden');
          active.play().catch(() => {});
        };
        window.addEventListener('pointerdown', resume, { once: true });
        window.addEventListener('keydown', resume, { once: true });
      });
    }
  }

  function start() {
    renderLegend();
    preloadAll();
    active.src = CLIP_LIBRARY['idle-breathing'].src;
    currentClip = 'idle-breathing';
    tryStartPlayback();
    for (const v of [videoA, videoB]) {
      v.addEventListener('ended', () => {
        if (v === active) playRandomIdle();
      });
    }
    window.addEventListener('keydown', handleKey);
    requestAnimationFrame(pollGamepad);
  }

  start();

  return {
    destroy() {
      window.removeEventListener('keydown', handleKey);
      window.clearTimeout(idleTimer);
    },
  };
}
