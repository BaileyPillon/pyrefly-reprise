// The finger cursor: a white gloved hand pointing right, drawn from scratch for Pyrefly
// (spec §5.6). It starts from the idea of Bailey's own CURSOR_SVG in Lifestream Encore
// (D:\FF7\concept\lib\hud.mjs). Repair pass: no separate cuff and no seam; the back of the hand
// ends in a rounded wrist; white with soft grey shading; a thin dark-grey edge of about 0.5 u.
// Our own drawing: no retail sprite was traced or used as an underlay. The fingertip sits at
// the right edge of the box (about 20 x 10 u).
function gloveSVG(w, h) {
  // Shapes in a 43 x 20.5 box (y from 2.5). Drawn twice: once stroked dark grey (the edge), once filled.
  const shapes = [
    ['ellipse', { cx: 11.5, cy: 12.4, rx: 9.2, ry: 6.9 }],            // back of the hand, rounded wrist
    ['rect', { x: 9.5, y: 5.2, width: 16.5, height: 14.2, rx: 4.8 }], // fist
    ['rect', { x: 21, y: 5.2, width: 19.5, height: 5.6, rx: 2.8 }],   // index finger
    ['rect', { x: 20, y: 10.7, width: 8.8, height: 3.2, rx: 1.6 }],   // three curled fingers
    ['rect', { x: 20, y: 13.6, width: 8.2, height: 3.1, rx: 1.55 }],
    ['rect', { x: 19.2, y: 16.4, width: 7.0, height: 2.9, rx: 1.45 }],
  ];
  const el = (tag, a, extra) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')} ${extra}/>`;
  const edge = shapes.map(([t, a]) => el(t, a, 'fill="#4A4A4A" stroke="#4A4A4A" stroke-width="2.2" stroke-linejoin="round"')).join('');
  const fills = shapes.map(([t, a]) => el(t, a, 'fill="#FFFFFF"')).join('');
  const shade = `
    <defs><linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="1" stop-color="#B9B9B9" stop-opacity=".85"/></linearGradient></defs>
    <ellipse cx="11.5" cy="12.4" rx="9.2" ry="6.9" fill="url(#gv)"/>
    <rect x="9.5" y="5.2" width="16.5" height="14.2" rx="4.8" fill="url(#gv)"/>
    <path d="M20.8 13.6 H28.2 M20.2 16.4 H27.4" stroke="#B4B4B4" stroke-width=".9" stroke-linecap="round"/>
    <path d="M13 10.1 Q17.5 8.7 22.2 10.4" stroke="#C8C8C8" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M23 9.6 H39" stroke="#D6D6D6" stroke-width=".9" stroke-linecap="round"/>`;
  return `<svg class="glove" width="${w}" height="${h}" viewBox="0 2.5 43 20.5" xmlns="http://www.w3.org/2000/svg">${edge}${fills}${shade}</svg>`;
}
