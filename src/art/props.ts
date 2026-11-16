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
  <rect x="4" y="4" width="${w - 8}" height="56" rx="6" fill="${top}" stroke="${LINE}" stroke-width="3"/>
  <rect x="4" y="54" width="${w - 8}" height="38" rx="6" fill="${front}" stroke="${LINE}" stroke-width="3"/>
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
  <polygon points="${pt(A)} ${pt(L)} ${pt(R)} ${pt(B)}" fill="none" stroke="${LINE}" stroke-width="3.5" stroke-linejoin="round"/>
  <line x1="${A.x}" y1="${A.y}" x2="${R.x}" y2="${R.y}" stroke="${LINE}" stroke-width="3"/>`;
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
  <circle cx="40" cy="42" r="34" fill="${css(PALETTE.oroOmbra)}" stroke="${LINE}" stroke-width="3"/>
  <circle cx="40" cy="38" r="34" fill="${css(PALETTE.oro)}" stroke="${LINE}" stroke-width="3"/>
  <circle cx="30" cy="28" r="9" fill="#FFF1C1" opacity="0.8"/>`;
  return { width: 80, height: 80, body };
}

/** Pomello dello stick di mira: disco rosso deserto. */
export function aimKnobSvg() {
  const body = `
  <circle cx="40" cy="42" r="34" fill="#9E1F2A" stroke="${LINE}" stroke-width="3"/>
  <circle cx="40" cy="38" r="34" fill="${css(PALETTE.rossoDeserto)}" stroke="${LINE}" stroke-width="3"/>
  <circle cx="30" cy="28" r="9" fill="#FFD3D6" opacity="0.7"/>
  <path d="M40 22 L40 54 M24 38 L56 38" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.9"/>`;
  return { width: 80, height: 80, body };
}

/**
 * Bersaglio d'allenamento: statuetta di terracotta su un piedistallo di pietra.
 * La base tocca il fondo dell'immagine.
 */
export function targetStatueSvg() {
  const lapis = css(PALETTE.lapislazzuli);
  const gold = css(PALETTE.oro);
  const s = `stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"`;
  const body = `
  <defs>
    <linearGradient id="argilla" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#E39A62"/><stop offset="0.6" stop-color="#C46E3A"/><stop offset="1" stop-color="#8F4A22"/>
    </linearGradient>
    <linearGradient id="pietraB" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E8D9B5"/><stop offset="1" stop-color="#B49A70"/>
    </linearGradient>
  </defs>
  <path d="M10 108 L74 108 L70 124 L14 124 Z" fill="url(#pietraB)" ${s}/>
  <rect x="6" y="100" width="72" height="10" rx="3" fill="#EFE3C6" ${s}/>
  <path d="M28 100 Q22 70 26 44 L58 44 Q62 70 56 100 Z" fill="url(#argilla)" ${s}/>
  <path d="M30 60 L54 60 M29 72 L55 72 M29 84 L55 84" stroke="#8F4A22" stroke-width="2"/>
  <path d="M34 64 L50 64 L50 80 L34 80 Z" fill="#F1D9A0" stroke="#8F4A22" stroke-width="1.5"/>
  <path d="M38 68 L46 68 M38 72 L46 72 M38 76 L44 76" stroke="${lapis}" stroke-width="1.6"/>
  <path d="M24 44 Q22 18 42 14 Q62 18 60 44 L54 52 L30 52 Z" fill="${lapis}" ${s}/>
  <path d="M28 30 L56 30 M26 38 L58 38" stroke="${gold}" stroke-width="3"/>
  <path d="M32 26 Q32 18 42 18 Q52 18 52 26 L52 40 Q42 48 32 40 Z" fill="url(#argilla)" ${s}/>
  <path d="M35 29 L40 29 M44 29 L49 29" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M38 38 Q42 40 46 38" fill="none" stroke="#8F4A22" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M30 22 Q34 12 42 12" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.35" stroke-linecap="round"/>`;
  return { width: 84, height: 126, body };
}

/**
 * Colpo a mezzaluna, rivolto verso destra (angolo 0). Il centro dell'immagine è il punto da cui parte il colpo.
 * Raggio esterno 120px: va scalato in base alla portata dell'arma.
 */
export function crescentSvg() {
  const C = 128;
  const R = 120;
  const half = (55 * Math.PI) / 180;
  const p1 = { x: C + R * Math.cos(-half), y: C + R * Math.sin(-half) };
  const p2 = { x: C + R * Math.cos(half), y: C + R * Math.sin(half) };
  const f = (n: number) => n.toFixed(1);
  const body = `
  <defs><radialGradient id="mz" cx="${C}" cy="${C}" r="${R}" gradientUnits="userSpaceOnUse">
    <stop offset="0.6" stop-color="#F2B632" stop-opacity="0.15"/>
    <stop offset="0.82" stop-color="#F2B632" stop-opacity="0.85"/>
    <stop offset="0.93" stop-color="#FFF3C4" stop-opacity="1"/>
    <stop offset="1" stop-color="#FFFFFF" stop-opacity="1"/>
  </radialGradient></defs>
  <path d="M${f(p1.x)} ${f(p1.y)} A ${R} ${R} 0 0 1 ${f(p2.x)} ${f(p2.y)} A ${R * 1.35} ${R * 1.35} 0 0 0 ${f(p1.x)} ${f(p1.y)} Z"
    fill="url(#mz)" stroke="${css(PALETTE.oroOmbra)}" stroke-width="3" stroke-opacity="0.9"/>`;
  return { width: C * 2, height: C * 2, body };
}

/** Granello di sabbia per le particelle. */
export function grainSvg() {
  const body = `<circle cx="5" cy="5" r="4" fill="${css(PALETTE.sabbia)}" stroke="${css(PALETTE.sabbiaScura)}" stroke-width="1.5"/>`;
  return { width: 10, height: 10, body };
}

/** Mucchietto di sabbia che resta dove un personaggio o un bersaglio è stato sconfitto. */
export function sandPileSvg() {
  const dark = css(PALETTE.sabbiaScura);
  const body = `
  <ellipse cx="40" cy="26" rx="38" ry="8" fill="#14213D" opacity="0.15"/>
  <path d="M4 26 Q14 8 32 10 Q40 2 50 10 Q68 8 76 26 Z" fill="#E2BC62" stroke="${dark}" stroke-width="2"/>
  <path d="M24 16 Q32 12 40 14" fill="none" stroke="#F4D88A" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="54" cy="20" r="1.6" fill="${dark}"/><circle cx="20" cy="22" r="1.4" fill="${dark}"/><circle cx="44" cy="22" r="1.2" fill="${dark}"/>`;
  return { width: 80, height: 32, body };
}
