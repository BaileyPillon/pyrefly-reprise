// Placeholder battle scene: the Sector 1 reactor bridge, drawn from scratch in
// SVG (gradients, blur and turbulence for a painted feel). No retail image, model
// or sprite is used or traced. The three figures are labelled silhouettes only.
// scene(viewBox) returns an <svg> string; the phone frames use a tighter crop.
function scene(viewBox, phone = false) {
  const labelScale = phone ? 1.3 : 1;
  const L = (x, y, t) => `<g transform="translate(${x} ${y}) scale(${labelScale})">
    <rect x="-4" y="-22" width="${t.length * 10.4 + 18}" height="30" rx="3" fill="rgba(8,10,12,.78)" stroke="#f4f1e8" stroke-opacity=".6" stroke-dasharray="4 3"/>
    <text x="5" y="-1" font-family="Chakra" font-weight="700" font-size="15" letter-spacing="2" fill="#f4f1e8">${t}</text></g>`;
  return `<svg class="scene" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#040807"/><stop offset=".45" stop-color="#0c1d19"/><stop offset="1" stop-color="#08100e"/></linearGradient>
    <radialGradient id="core" cx=".5" cy=".3" r=".5">
      <stop offset="0" stop-color="#8dffcf" stop-opacity=".85"/><stop offset=".25" stop-color="#2fd494" stop-opacity=".45"/>
      <stop offset=".7" stop-color="#0d5a42" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="deck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2c3b37"/><stop offset=".5" stop-color="#46524d"/><stop offset="1" stop-color="#1c2422"/></linearGradient>
    <linearGradient id="pipe" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0d1413"/><stop offset=".35" stop-color="#3b4a45"/><stop offset=".55" stop-color="#65756e"/><stop offset="1" stop-color="#0d1413"/></linearGradient>
    <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a6468"/><stop offset=".5" stop-color="#2d3438"/><stop offset="1" stop-color="#15191b"/></linearGradient>
    <linearGradient id="fig" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#101614"/><stop offset=".7" stop-color="#1f2a27"/><stop offset="1" stop-color="#5fe0a4"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="mist"><feGaussianBlur stdDeviation="40"/></filter>
    <filter id="paint" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".012 .03" numOctaves="3" seed="7"/>
      <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .9  0 0 0 0 .7  0 0 0 .22 0"/></filter>
    <filter id="brush"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="9"/></filter>
  </defs>
  <rect x="0" y="0" width="1600" height="900" fill="url(#sky)"/>
  <ellipse cx="800" cy="250" rx="760" ry="420" fill="url(#core)"/>
  <rect x="0" y="0" width="1600" height="900" filter="url(#paint)"/>
  <!-- far machinery: reactor walls and pipes -->
  <g filter="url(#brush)" opacity=".9">
    <rect x="60" y="0" width="120" height="900" fill="url(#pipe)"/>
    <rect x="230" y="0" width="60" height="900" fill="url(#pipe)" opacity=".7"/>
    <rect x="1330" y="0" width="140" height="900" fill="url(#pipe)"/>
    <rect x="1250" y="0" width="50" height="900" fill="url(#pipe)" opacity=".7"/>
    <path d="M0 150 H1600 V186 H0Z" fill="#26322f" opacity=".85"/>
    <path d="M0 196 H1600" stroke="#8fd9b8" stroke-opacity=".25" stroke-width="3"/>
    <path d="M330 0 V420 M1200 0 V420" stroke="#0a0f0e" stroke-width="26"/>
    <path d="M360 60 H620 V120 M980 60 H1240 V120" stroke="#3a4843" stroke-width="18" fill="none"/>
  </g>
  <g filter="url(#brush)" opacity=".85">
    <path d="M610 0 H990 V300 Q800 350 610 300Z" fill="#0b1513"/>
    <path d="M640 0 V296 M960 0 V296" stroke="#79e8b8" stroke-opacity=".35" stroke-width="4"/>
    <path d="M610 90 Q800 120 990 90 M610 200 Q800 232 990 200" stroke="#1f302b" stroke-width="14" fill="none"/>
    <ellipse cx="800" cy="300" rx="190" ry="26" fill="#9dffd6" opacity=".35" filter="url(#soft)"/>
  </g>
  <rect x="0" y="0" width="1600" height="900" fill="url(#sky)" opacity=".25"/>
  <ellipse cx="800" cy="330" rx="520" ry="120" fill="#43e3a0" opacity=".18" filter="url(#mist)"/>
  <!-- the bridge, in perspective -->
  <g filter="url(#brush)">
    <polygon points="230,900 1370,900 930,380 670,380" fill="url(#deck)"/>
    <g stroke="#0e1413" stroke-opacity=".55" stroke-width="3">
      <path d="M672 400 H928 M650 430 H950 M620 470 H980 M580 520 H1020 M530 580 H1070 M470 650 H1130 M400 735 H1200 M310 840 H1290"/>
      <path d="M800 380 V900 M735 380 L560 900 M865 380 L1040 900"/>
    </g>
    <path d="M670 380 L230 900 M930 380 L1370 900" stroke="#9fb3aa" stroke-width="5" opacity=".7"/>
    <path d="M660 300 L190 820 M940 300 L1410 820" stroke="#7d8f88" stroke-width="7" opacity=".8"/>
    <path d="M665 340 L210 860 M935 340 L1390 860" stroke="#56655f" stroke-width="3" opacity=".7"/>
    <path d="M190 820 V900 M300 700 V790 M400 590 V675 M500 480 V560 M1410 820 V900 M1300 700 V790 M1200 590 V675 M1100 480 V560" stroke="#6f817a" stroke-width="6" opacity=".75"/>
  </g>
  <ellipse cx="800" cy="860" rx="700" ry="90" fill="#000" opacity=".45" filter="url(#soft)"/>
  <!-- PLACEHOLDER Guard Scorpion: a generic mech scorpion silhouette, tail raised -->
  <g filter="url(#brush)">
    <ellipse cx="720" cy="600" rx="190" ry="26" fill="#000" opacity=".5" filter="url(#soft)"/>
    <g stroke="#1b2124" stroke-width="16" stroke-linecap="round" fill="none">
      <path d="M640 520 L560 560 L540 600"/><path d="M660 530 L600 580 L596 612"/>
      <path d="M800 520 L880 560 L900 600"/><path d="M780 530 L840 580 L846 612"/>
    </g>
    <path d="M600 470 Q720 400 840 470 L860 525 Q720 560 580 525Z" fill="url(#hull)"/>
    <path d="M590 490 L520 470 L500 500 L560 510Z M850 490 L920 470 L940 500 L880 510Z" fill="#3a4246"/>
    <path d="M760 455 Q820 330 790 250 Q770 190 700 175" stroke="url(#hull)" stroke-width="34" fill="none" stroke-linecap="round"/>
    <path d="M760 455 Q820 330 790 250 Q770 190 700 175" stroke="#8a969a" stroke-width="4" fill="none" stroke-dasharray="18 14" opacity=".6"/>
    <circle cx="694" cy="176" r="22" fill="#2a3134"/>
    <circle cx="684" cy="182" r="11" fill="#ff5a4a"/><circle cx="684" cy="182" r="30" fill="#ff4a3a" opacity=".35" filter="url(#soft)"/>
    <circle cx="660" cy="480" r="7" fill="#ff5a4a"/><circle cx="700" cy="474" r="7" fill="#ff5a4a"/>
  </g>
  <!-- PLACEHOLDER Cloud and Barret: plain silhouettes, rim-lit by the mako glow -->
  <g filter="url(#brush)">
    <ellipse cx="985" cy="640" rx="46" ry="10" fill="#000" opacity=".5"/>
    <path d="M968 470 q16 -22 34 0 l6 24 l16 8 l6 70 l-12 4 l-4 60 h-14 l-4 -54 l-6 54 h-14 l-2 -62 l-12 -4 l6 -68 l16 -8z" fill="url(#fig)"/>
    <path d="M950 560 L1070 430 L1082 440 L962 572Z" fill="#6f7b80"/>
    <ellipse cx="1110" cy="660" rx="58" ry="11" fill="#000" opacity=".5"/>
    <path d="M1086 470 q22 -26 46 0 l10 26 l24 12 l8 84 l-14 6 l-6 60 h-18 l-4 -56 l-8 56 h-18 l-4 -64 l-16 -6 l6 -80 l22 -12z" fill="url(#fig)"/>
    <rect x="1148" y="540" width="46" height="22" rx="6" fill="#4b5558"/>
  </g>
  ${phone ? L(565, 640, 'PLACEHOLDER · GUARD SCORPION') + L(565, 690, 'PLACEHOLDER · CLOUD') + L(565, 740, 'PLACEHOLDER · BARRET')
    : L(560, 150, 'PLACEHOLDER · GUARD SCORPION (TAIL RAISED)') + L(900, 400, 'PLACEHOLDER · CLOUD') + L(1070, 455, 'PLACEHOLDER · BARRET')}
  </svg>`;
}
