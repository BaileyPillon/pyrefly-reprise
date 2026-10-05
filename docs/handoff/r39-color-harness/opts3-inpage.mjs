// In-page, reversible: the three states the driver asked for, on one frozen frame.
export function installOpts3() {
  const api = window.__pyrefly; const r = api.app.renderer; const fx = api.fx;
  const gm = r.gradePass.material;
  const orig = gm.fragmentShader;
  const END = 'gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);';
  if (!orig.includes(END)) throw new Error('grade shader end marker not found');
  const encoded = orig.replace(END, 'vec3 e = clamp(c, 0.0, 1.0);\n      gl_FragColor = vec4(mix(e * 12.92, 1.055 * pow(e, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), e)), 1.0);');
  window.__o3 = {
    hasSwitch: typeof fx.figureTrue === 'function',
    reset() { if (fx.figureTrue) fx.figureTrue(0); if (gm.fragmentShader !== orig) { gm.fragmentShader = orig; gm.needsUpdate = true; } },
    figures(v) { fx.figureTrue(v); },
    whole(on) { gm.fragmentShader = on ? encoded : orig; gm.needsUpdate = true; },
  };
  return window.__o3.hasSwitch;
}
