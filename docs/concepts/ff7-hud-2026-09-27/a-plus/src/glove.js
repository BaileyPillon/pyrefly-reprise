// The finger cursor: a white gloved hand pointing right, drawn from scratch for Pyrefly
// (spec §5.6). It starts from the idea of Bailey's own CURSOR_SVG in Lifestream Encore
// (D:\FF7\concept\lib\hud.mjs) and is redrawn to 2:1 proportions: cuff, fist, extended
// index finger, three curled fingers, a thumb, two grey shade steps (#CECECE, #9A9A9A) and a
// near-black outline. No retail sprite was traced or used as a reference image.
// The fingertip sits at the right edge of the box.
function gloveSVG(w, h) {
  // Shapes in a 44 x 24 box. Drawn twice: once stroked black (the outline), once filled.
  const shapes = [
    ['rect', { x: 2.5, y: 7, width: 8, height: 11, rx: 1.6 }],        // cuff
    ['rect', { x: 9.5, y: 5, width: 17, height: 14.5, rx: 4.6 }],     // fist
    ['rect', { x: 21, y: 5, width: 19.5, height: 5.8, rx: 2.9 }],     // index finger
    ['rect', { x: 20, y: 10.6, width: 9, height: 3.3, rx: 1.65 }],    // curled fingers
    ['rect', { x: 20, y: 13.6, width: 8.4, height: 3.2, rx: 1.6 }],
    ['rect', { x: 19.4, y: 16.4, width: 7.2, height: 3, rx: 1.5 }],
  ];
  const el = (tag, a, extra) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')} ${extra}/>`;
  const outline = shapes.map(([t, a]) => el(t, a, 'fill="#101010" stroke="#101010" stroke-width="4.2" stroke-linejoin="round"')).join('');
  const fills = shapes.map(([t, a], i) => el(t, a, `fill="${i === 0 ? '#CECECE' : '#FFFFFF'}"`)).join('');
  const shade = `
    <rect x="9.5" y="14.6" width="11" height="4.9" rx="2.4" fill="#CECECE"/>
    <path d="M5.2 7.6 V17.4" stroke="#9A9A9A" stroke-width="1.1"/>
    <path d="M20.6 13.5 H28.4 M20.2 16.4 H27.6" stroke="#9A9A9A" stroke-width="1" stroke-linecap="round"/>
    <path d="M12.5 10.2 Q17 8.6 22.4 10.4" stroke="#9A9A9A" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M24 5.6 V10.4" stroke="#CECECE" stroke-width="1" />`;
  return `<svg class="glove" width="${w}" height="${h}" viewBox="0 2.5 43 20.5" xmlns="http://www.w3.org/2000/svg">${outline}${fills}${shade}</svg>`;
}
