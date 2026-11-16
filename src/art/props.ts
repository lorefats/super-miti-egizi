import { PALETTE, css } from './palette';

const LINE = css(PALETTE.bluNotte);

/** Ombra morbida ellittica che sta sotto personaggi e oggetti. */
export function shadowSvg() {
  const body = `
  <defs><radialGradient id="o" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#14213D" stop-opacity="0.38"/>
    <stop offset="70%" stop-color="#14213D" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="#14213D" stop-opacity="0"/>
  </radialGradient></defs>
  <ellipse cx="40" cy="14" rx="40" ry="14" fill="url(#o)"/>`;
  return { width: 80, height: 28, body };
}

/** Pezzo di terreno di sabbia che si ripete (granelli e piccole dune, sparsi in modo irregolare). */
export function sandTileSvg() {
  const S = 320;
  const sand = css(PALETTE.sabbia);
  const dark = css(PALETTE.sabbiaScura);
  // numeri "a caso" ma sempre uguali, così il terreno non cambia a ogni avvio
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  let dots = '';
  for (let i = 0; i < 26; i++) {
    const x = (rnd() * S).toFixed(0);
    const y = (rnd() * S).toFixed(0);
    dots += `<circle cx="${x}" cy="${y}" r="${(1.2 + rnd() * 1.8).toFixed(1)}" fill="${dark}" opacity="0.5"/>`;
  }
  const dune = (x: number, y: number, w: number, color: string, op: number) =>
    `<path d="M${x} ${y} Q${x + w / 2} ${y - w * 0.18} ${x + w} ${y}" fill="none" stroke="${color}" stroke-width="3" opacity="${op}" stroke-linecap="round"/>`;
  const body = `
  <rect width="${S}" height="${S}" fill="${sand}"/>
  ${dune(20, 60, 54, dark, 0.3)}
  ${dune(190, 30, 40, '#F4D88A', 0.7)}
  ${dune(230, 170, 60, dark, 0.3)}
  ${dune(60, 210, 36, '#F4D88A', 0.7)}
  ${dune(140, 290, 48, dark, 0.3)}
  ${dune(110, 120, 30, dark, 0.22)}
  ${dots}`;
  return { width: S, height: S, body };
}

/** Blocco di pietra in 2.5D: si vede il tetto (chiaro) e il lato davanti (scuro). */
export function stoneBlockSvg(width: number) {
  const w = width;
  const top = '#E8D9B5';
  const front = '#BFA57A';
  const crack = '#9C845C';
  const body = `
  <ellipse cx="${w / 2}" cy="94" rx="${w / 2 - 2}" ry="7" fill="#14213D" opacity="0.2"/>
  <rect x="4" y="4" width="${w - 8}" height="56" rx="6" fill="${top}" stroke="${LINE}" stroke-width="4"/>
  <rect x="4" y="54" width="${w - 8}" height="38" rx="6" fill="${front}" stroke="${LINE}" stroke-width="4"/>
  <path d="M10 58 L${w - 10} 58" stroke="#D6C29A" stroke-width="3"/>
  <path d="M${w * 0.3} 64 L${w * 0.36} 76 L${w * 0.32} 88" fill="none" stroke="${crack}" stroke-width="3" stroke-linecap="round"/>
  <path d="M${w * 0.7} 16 L${w * 0.62} 28" fill="none" stroke="#CDBB92" stroke-width="3" stroke-linecap="round"/>
  <path d="M14 14 L${Math.min(40, w * 0.4)} 14" stroke="#F7EDD6" stroke-width="4" stroke-linecap="round"/>`;
  return { width: w, height: 102, body };
}

/** Piramide in 2.5D: faccia davanti chiara, fianco destro in ombra, punta d'oro. */
export function pyramidSvg() {
  const W = 440;
  const H = 330;
  const A = { x: 220, y: 18 }; // punta
  const L = { x: 22, y: 300 }; // base sinistra davanti
  const R = { x: 330, y: 306 }; // base destra davanti
  const B = { x: 418, y: 250 }; // base destra dietro
  const lerp = (p: { x: number; y: number }, q: { x: number; y: number }, t: number) => ({
    x: p.x + (q.x - p.x) * t,
    y: p.y + (q.y - p.y) * t,
  });
  const pt = (p: { x: number; y: number }) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

  // file di blocchi (righe) su entrambe le facce
  let rows = '';
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    rows += `<polyline points="${pt(lerp(A, L, t))} ${pt(lerp(A, R, t))} ${pt(lerp(A, B, t))}" fill="none" stroke="#B88A4E" stroke-width="2.5" opacity="0.7"/>`;
  }
  const capT = 0.16;
  const cL = lerp(A, L, capT);
  const cR = lerp(A, R, capT);
  const cB = lerp(A, B, capT);

  const body = `
  <ellipse cx="240" cy="300" rx="215" ry="26" fill="#14213D" opacity="0.22"/>
  <polygon points="${pt(A)} ${pt(R)} ${pt(B)}" fill="#C99A5B"/>
  <polygon points="${pt(A)} ${pt(L)} ${pt(R)}" fill="#EBC982"/>
  ${rows}
  <polygon points="${pt(A)} ${pt(cR)} ${pt(cB)}" fill="${css(PALETTE.oroOmbra)}"/>
  <polygon points="${pt(A)} ${pt(cL)} ${pt(cR)}" fill="${css(PALETTE.oro)}"/>
  <polyline points="${pt(lerp(A, L, 0.05))} ${pt(lerp(A, L, 0.12))}" stroke="#FFF1C1" stroke-width="4" stroke-linecap="round"/>
  <polygon points="${pt(A)} ${pt(L)} ${pt(R)} ${pt(B)}" fill="none" stroke="${LINE}" stroke-width="5" stroke-linejoin="round"/>
  <line x1="${A.x}" y1="${A.y}" x2="${R.x}" y2="${R.y}" stroke="${LINE}" stroke-width="4"/>`;
  return { width: W, height: H, body };
}

/** Base del joystick: cerchio lapislazzuli trasparente con anello d'oro. */
export function joystickBaseSvg() {
  const body = `
  <circle cx="90" cy="90" r="84" fill="${css(PALETTE.lapislazzuli)}" fill-opacity="0.35" stroke="${css(PALETTE.oro)}" stroke-width="6"/>
  <circle cx="90" cy="90" r="84" fill="none" stroke="${LINE}" stroke-width="2" opacity="0.6"/>
  <path d="M90 16 l-8 10 h16 Z M90 164 l-8 -10 h16 Z M16 90 l10 -8 v16 Z M164 90 l-10 -8 v16 Z" fill="${css(PALETTE.oro)}" opacity="0.8"/>`;
  return { width: 180, height: 180, body };
}

/** Pomello del joystick: disco d'oro con contorno blu notte. */
export function joystickKnobSvg() {
  const body = `
  <circle cx="40" cy="42" r="34" fill="${css(PALETTE.oroOmbra)}" stroke="${LINE}" stroke-width="4"/>
  <circle cx="40" cy="38" r="34" fill="${css(PALETTE.oro)}" stroke="${LINE}" stroke-width="4"/>
  <circle cx="30" cy="28" r="9" fill="#FFF1C1" opacity="0.8"/>`;
  return { width: 80, height: 80, body };
}
