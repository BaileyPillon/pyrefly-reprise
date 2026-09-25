// Runs inside the page (page.evaluate). Rebuilds the hero art and the rail of the
// live chapter select for a faked end-state picture. Nothing here is product code.
(function build(opt) {
  const OPTION = opt.option; // 'A' | 'B' | 'C'
  const SEL = opt.selected; // chapter id
  const CLEARED = new Set(opt.cleared);
  const BEST = opt.best; // { id: 'm:ss' }

  const pause = (stem, fx, fy) => ({ kind: 'plate', src: `/art/pause/${stem}.png`, pos: `${fx * 100}% ${fy * 100}%` });
  const comp = (bg, boss, cls) => ({ kind: 'comp', bg: `/art/backdrops/${bg}.png`, boss: `/art/characters/${boss}.png`, cls });

  const TILES = [
    { game: 'ffx', id: 'seymour-flux', num: 'I', title: 'Seymour Flux', art: pause('ch1-seymour-flux', 0.37, 0.47) },
    { game: 'ffx', id: 'yunalesca', num: 'II', title: 'Lady Yunalesca', art: pause('ch2-yunalesca', 0.57, 0.32) },
    { game: 'ffx', id: 'braskas-final-aeon', num: 'III', title: "Braska's Final Aeon", art: pause('ch3-braskas-final-aeon', 0.45, 0.48) },
    { game: 'ffx', id: 'seymour-anima-macalania', num: 'VII', title: 'Seymour and Anima', coming: true, art: pause('macalania', 0.33, 0.4) },
    { game: 'ffx', id: 'evrae-airship', num: 'VIII', title: 'Evrae', art: comp('evrae-airship-deck', 'evrae/idle', 'evrae') },
    { game: 'ffx', id: 'yojimbo-cavern', num: 'IX', title: 'Yojimbo', art: pause('ch9-yojimbo', 0.5, 0.4) },
    { game: 'ffx2', id: 'ffx2-bahamut', num: 'IV', title: 'Bahamut', art: pause('ch4-ffx2-bahamut', 0.48, 0.42) },
    { game: 'ffx2', id: 'ffx2-vegnagun-shuyin', num: 'V', title: 'Vegnagun', art: pause('ch5-ffx2-vegnagun-shuyin', 0.5, 0.22) },
    { game: 'ffx2', id: 'ffx2-leblanc', num: 'VI', title: 'Leblanc', art: comp('leblanc-last-room', 'leblanc/idle', 'leblanc') },
    { game: 'ffx2', id: 'ffx2-trema', num: 'XIII', title: 'Trema', art: pause('ch13-trema', 0.62, 0.32) },
  ];

  const artHtml = (art, where) => {
    if (art.kind === 'plate') {
      return `<img class="v2-plate" src="${art.src}" style="object-position:${art.pos}" alt="" draggable="false">`;
    }
    return `<div class="v2-comp v2-comp--${art.cls} v2-comp--${where}">` +
      `<img class="v2-comp__bg" src="${art.bg}" alt="" draggable="false">` +
      `<img class="v2-comp__boss" src="${art.boss}" alt="" draggable="false"></div>`;
  };

  const laurel = (cls) => {
    // Two branches of paired leaves rising from the base, SVG angles (y down).
    const leaves = [];
    const R = 46;
    for (let k = 0; k < 8; k++) {
      const th = 112 + k * 17; // 112 (lower left) .. 231 (upper left)
      const rad = th * Math.PI / 180;
      for (const side of [-1, 1]) {
        const off = side * 5.5;
        const x = 60 + (R + off) * Math.cos(rad), y = 60 + (R + off) * Math.sin(rad);
        const rot = th + 180 + side * 28; // long axis along the stem, splayed out / in
        const sz = 1 - k * 0.045;
        leaves.push([x, y, rot, sz]);
      }
    }
    const e = ([x, y, rot, sz], mirror) => {
      const X = mirror ? 120 - x : x; const Rt = mirror ? 180 - rot : rot;
      return `<ellipse cx="${X.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(3.6 * sz).toFixed(1)}" ry="${(9 * sz).toFixed(1)}" transform="rotate(${(Rt + 90).toFixed(0)} ${X.toFixed(1)} ${y.toFixed(1)})"/>`;
    };
    const stem = `<path d="M${(60 + R * Math.cos(112 * Math.PI / 180)).toFixed(1)} ${(60 + R * Math.sin(112 * Math.PI / 180)).toFixed(1)} A ${R} ${R} 0 0 1 ${(60 + R * Math.cos(236 * Math.PI / 180)).toFixed(1)} ${(60 + R * Math.sin(236 * Math.PI / 180)).toFixed(1)}" fill="none" stroke="currentColor" stroke-width="1.6"/>`;
    return `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
      <g fill="currentColor">${leaves.map((l) => e(l, false) + e(l, true)).join('')}</g>
      ${stem}<g transform="translate(120 0) scale(-1 1)">${stem}</g>
    </svg>`;
  };

  const tile = TILES.find((t) => t.id === SEL);
  const cleared = CLEARED.has(SEL);

  // ------------------------------------------------------------------ hero
  const hero = document.querySelector('.fe-hero');
  hero.querySelectorAll('.fe-hero__sil, .fe-hero__check').forEach((n) => n.remove());
  hero.querySelector('.fe-hero__art').innerHTML = artHtml(tile.art, 'hero');
  hero.classList.add('v2-hero', cleared ? 'is-cleared' : 'is-open');

  let heroState = '';
  if (OPTION === 'A' && cleared) {
    heroState = `
      <div class="v2a-seal">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <defs><path id="v2a-ring" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0"/></defs>
          <circle cx="100" cy="100" r="94" class="v2a-seal__disc"/>
          <circle cx="100" cy="100" r="90" class="v2a-seal__line"/>
          <circle cx="100" cy="100" r="54" class="v2a-seal__line v2a-seal__line--in"/>
          <text class="v2a-seal__ring"><textPath href="#v2a-ring" startOffset="0" textLength="430" lengthAdjust="spacing">✦ CHAPTER CLEARED ✦ CHAPTER CLEARED</textPath></text>
        </svg>
        <div class="v2a-seal__core"><span>Best</span><b>${BEST[SEL]}</b></div>
      </div>`;
  }
  if (OPTION === 'B') {
    heroState = cleared
      ? `<div class="v2b-laurel">${laurel('v2b-laurel__svg')}<div class="v2b-laurel__core"><span>Defeated</span><b>${BEST[SEL]}</b></div></div>`
      : `<div class="v2b-veil"></div><div class="v2b-undefeated"><i></i>Undefeated<i></i></div>`;
  }
  if (OPTION === 'C' && cleared) {
    heroState = `<div class="v2c-sash"><div class="v2c-sash__band"><span>Victory</span><b>${BEST[SEL]}</b></div></div>`;
  }
  const fade = hero.querySelector('.fe-hero__fade');
  if (OPTION === 'B' && !cleared) fade.insertAdjacentHTML('beforebegin', '<div class="v2b-veil"></div>');
  fade.insertAdjacentHTML('afterend', heroState.replace('<div class="v2b-veil"></div>', ''));

  // ---------------------------------------------------- C: progress strip
  if (OPTION === 'C') {
    const board = document.querySelector('.fe-cselect__board');
    const playable = TILES.filter((t) => !t.coming);
    const done = playable.filter((t) => CLEARED.has(t.id)).length;
    const seg = (t) => `<span class="v2c-pip${CLEARED.has(t.id) ? ' is-lit' : ''}${t.coming ? ' is-coming' : ''}${t.id === SEL ? ' is-sel' : ''}${t.game === 'ffx2' ? ' is-x2' : ''}">${t.num}</span>`;
    board.insertAdjacentHTML('beforeend', `
      <div class="v2c-strip">
        <div class="v2c-strip__count"><b>${done}</b><span>of ${playable.length} beaten</span></div>
        <div class="v2c-strip__pips">
          <span class="v2c-strip__game">X</span>${TILES.filter((t) => t.game === 'ffx').map(seg).join('')}
          <span class="v2c-strip__game v2c-strip__game--x2">X-2</span>${TILES.filter((t) => t.game === 'ffx2').map(seg).join('')}
        </div>
      </div>`);
  }

  // ------------------------------------------------------------------ rail
  const rail = document.querySelector('.fe-rail');
  rail.classList.add('v2-rail');
  const card = (t, i) => {
    const isSel = t.id === SEL;
    const isClr = CLEARED.has(t.id);
    const cls = ['fe-card', 'v2-card', isSel ? 'is-sel' : '', isClr ? 'is-cleared' : (t.coming ? 'is-coming' : 'is-open')].join(' ');
    let mark = '';
    if (t.coming) mark = '<span class="v2-card__coming">Coming</span>';
    else if (isClr && OPTION === 'A') mark = '<span class="v2a-mark" title="Cleared"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9"/><path d="M5.6 10.4l3 3 5.8-6.6"/></svg></span>';
    else if (isClr && OPTION === 'B') mark = `<span class="v2b-mark">${laurel('v2b-mark__svg')}</span>`;
    else if (isClr && OPTION === 'C') mark = '<span class="v2c-corner"><i>✦</i></span>';
    return `
      <div class="${cls}" data-action="fe-card-${i}" role="button" tabindex="0" aria-label="${t.title}"${isSel ? ' aria-current="true"' : ''}>
        <div class="v2-card__art">${artHtml(t.art, 'card')}</div>
        ${OPTION === 'B' && !isClr && !t.coming ? '<div class="v2b-cardveil"></div>' : ''}
        <div class="v2-card__fade"></div>
        <span class="v2-card__num">${t.num}</span>
        <span class="v2-card__name">${t.title}</span>
        ${mark}
      </div>`;
  };
  const group = (game, label) => `<div class="fe-rail__group${game === 'ffx2' ? ' ig--ffx2' : ''}">${label}<i></i></div>` +
    TILES.map((t, i) => (t.game === game ? card(t, i) : '')).join('');
  rail.innerHTML = group('ffx', 'Final Fantasy X') + group('ffx2', 'Final Fantasy X-2');

  const sel = rail.querySelector('.is-sel');
  if (sel && rail.scrollHeight > rail.clientHeight + 2) {
    rail.scrollTop = Math.max(0, sel.offsetTop - rail.clientHeight / 2 + sel.offsetHeight / 2);
  }
  document.querySelector('.fe-cselect').classList.add(`v2-opt-${OPTION}`);
  return { rail: rail.children.length, scroll: rail.scrollTop };
})
