import { PALETTE, css } from './palette';

const LINE = css(PALETTE.bluNotte);

/**
 * Misure della piramide grande in cui si entra (in pixel).
 * La base è un rettangolo largo W e profondo D sulla sabbia; la punta è alta H sopra il centro della base.
 */
export const BIG_PYRAMID = {
  W: 900,
  D: 380,
  H: 560,
  /** distanza dei muri interni dal bordo della base */
  inset: 30,
  /** spessore dei muri */
  wall: 26,
  /** altezza visibile del muro di fondo e di quello davanti */
  backWallH: 48,
  frontWallH: 60,
  /** larghezza della porta */
  doorW: 150,
  /** posizione delle torce sul muro di fondo (frazione della larghezza) */
  torches: [0.25, 0.75],
};

type P = { x: number; y: number };
const lerp = (p: P, q: P, t: number): P => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
const pt = (p: P) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

/** Dimensioni del disegno del "tetto" (le facce della piramide). La base davanti è a 4px dal fondo. */
export function bigPyramidRoofSize() {
  const { W, D, H } = BIG_PYRAMID;
  return { width: W + 4, height: 8 + H + D / 2 + 4 };
}

/** Le facce della piramide grande, con la porta davanti e un disco solare alato sopra la porta. */
export function bigPyramidRoofSvg() {
  const { W, D, H, doorW } = BIG_PYRAMID;
  const { width, height } = bigPyramidRoofSize();
  const mid = 8 + H;
  const y1 = mid + D / 2;
  const y0 = mid - D / 2;
  const A = { x: W / 2 + 2, y: 8 };
  const FL = { x: 2, y: y1 };
  const FR = { x: W + 2, y: y1 };
  const BL = { x: 2, y: y0 };
  const BR = { x: W + 2, y: y0 };

  let rows = '';
  for (let i = 1; i < 14; i++) {
    const t = i / 14;
    rows += `<polyline points="${pt(lerp(A, BL, t))} ${pt(lerp(A, FL, t))} ${pt(lerp(A, FR, t))} ${pt(lerp(A, BR, t))}" fill="none" stroke="#B88A4E" stroke-width="2.5" opacity="0.6"/>`;
  }
  const c = 0.12;
  const cap = `
  <polygon points="${pt(A)} ${pt(lerp(A, BL, c))} ${pt(lerp(A, FL, c))}" fill="#C8901C"/>
  <polygon points="${pt(A)} ${pt(lerp(A, FL, c))} ${pt(lerp(A, FR, c))}" fill="${css(PALETTE.oro)}"/>
  <polygon points="${pt(A)} ${pt(lerp(A, FR, c))} ${pt(lerp(A, BR, c))}" fill="${css(PALETTE.oroOmbra)}"/>`;

  // porta in basso al centro della faccia davanti
  const dx = A.x - doorW / 2;
  const dh = 118;
  const door = `
  <rect x="${dx - 14}" y="${y1 - dh - 26}" width="${doorW + 28}" height="${dh + 26}" fill="#E9D3A0" stroke="${LINE}" stroke-width="3"/>
  <rect x="${dx - 14}" y="${y1 - dh - 26}" width="${doorW + 28}" height="14" fill="${css(PALETTE.lapislazzuli)}" stroke="${LINE}" stroke-width="3"/>
  <path d="M${dx - 8} ${y1 - dh - 19} H${dx + doorW + 8}" stroke="${css(PALETTE.oro)}" stroke-width="3" stroke-dasharray="10 6"/>
  <rect x="${dx}" y="${y1 - dh}" width="${doorW}" height="${dh}" fill="#24170F" stroke="${LINE}" stroke-width="3"/>
  <path d="M${dx + 8} ${y1 - dh + 8} V${y1}" stroke="#3E2A1A" stroke-width="6"/>
  <g transform="translate(${A.x} ${y1 - dh - 66})">
    <path d="M-12 0 Q-60 -14 -96 6 Q-56 2 -14 10 Z" fill="${css(PALETTE.lapislazzuli)}" stroke="${LINE}" stroke-width="2.5"/>
    <path d="M12 0 Q60 -14 96 6 Q56 2 14 10 Z" fill="${css(PALETTE.lapislazzuli)}" stroke="${LINE}" stroke-width="2.5"/>
    <path d="M-80 4 Q-50 -4 -20 4 M80 4 Q50 -4 20 4" stroke="${css(PALETTE.turchese)}" stroke-width="2.5" fill="none"/>
    <circle cx="0" cy="2" r="15" fill="${css(PALETTE.oro)}" stroke="${LINE}" stroke-width="2.5"/>
    <circle cx="-4" cy="-3" r="5" fill="#FFF1C1" opacity="0.8"/>
  </g>`;

  const body = `
  <polygon points="${pt(A)} ${pt(BL)} ${pt(FL)}" fill="#D3A964"/>
  <polygon points="${pt(A)} ${pt(FL)} ${pt(FR)}" fill="#EBC982"/>
  <polygon points="${pt(A)} ${pt(FR)} ${pt(BR)}" fill="#C2924F"/>
  ${rows}
  ${cap}
  <polyline points="${pt(lerp(A, FL, 0.04))} ${pt(lerp(A, FL, 0.1))}" stroke="#FFF1C1" stroke-width="4" stroke-linecap="round"/>
  <line x1="${A.x}" y1="${A.y}" x2="${FL.x}" y2="${FL.y}" stroke="${LINE}" stroke-width="3"/>
  <line x1="${A.x}" y1="${A.y}" x2="${FR.x}" y2="${FR.y}" stroke="${LINE}" stroke-width="3"/>
  ${door}
  <polygon points="${pt(A)} ${pt(BL)} ${pt(FL)} ${pt(FR)} ${pt(BR)}" fill="none" stroke="${LINE}" stroke-width="4" stroke-linejoin="round"/>`;
  return { width, height, body };
}

/**
 * Dimensioni del disegno della sala interna (pavimento + muro di fondo + muri laterali).
 * Il disegno parte in alto dalla cima del muro di fondo: offsetY = inset - backWallH rispetto al bordo dietro della base.
 */
export function bigPyramidFloorSize() {
  const { W, D, inset, backWallH } = BIG_PYRAMID;
  return { width: W, height: D + backWallH - inset, offsetY: inset - backWallH };
}

/** Sala interna: pavimento a lastre con un tappeto, muro di fondo con geroglifici e torce, muri laterali. */
export function bigPyramidFloorSvg() {
  const { W, D, inset, wall, backWallH, torches } = BIG_PYRAMID;
  const { width, height } = bigPyramidFloorSize();
  const top = '#D8BC86';
  const face = '#9C7848';
  const glyph = '#6E5130';

  let tiles = '';
  for (let x = inset + wall + 60; x < W - inset - wall; x += 60) {
    tiles += `<line x1="${x}" y1="${inset + wall}" x2="${x}" y2="${D}" stroke="#9F7B45" stroke-width="2" opacity="0.6"/>`;
  }
  for (let y = inset + wall + 50; y < D; y += 50) {
    tiles += `<line x1="${inset + wall}" y1="${y}" x2="${W - inset - wall}" y2="${y}" stroke="#9F7B45" stroke-width="2" opacity="0.6"/>`;
  }

  // geroglifici semplici (forme nostre) sul muro di fondo
  let glyphs = '';
  const faceTop = inset + wall - backWallH;
  for (let x = inset + 70; x < W - inset - 40; x += 70) {
    const k = Math.round(x / 70) % 4;
    const cx = x;
    const cy = faceTop + backWallH / 2 + 2;
    if (k === 0) glyphs += `<circle cx="${cx}" cy="${cy - 8}" r="6" fill="none" stroke="${glyph}" stroke-width="3"/><path d="M${cx} ${cy - 2} V${cy + 14} M${cx - 8} ${cy + 3} H${cx + 8}" stroke="${glyph}" stroke-width="3"/>`;
    else if (k === 1) glyphs += `<path d="M${cx - 10} ${cy + 10} Q${cx} ${cy - 16} ${cx + 10} ${cy + 10}" fill="none" stroke="${glyph}" stroke-width="3"/>`;
    else if (k === 2) glyphs += `<path d="M${cx - 10} ${cy} Q${cx} ${cy - 10} ${cx + 10} ${cy} Q${cx} ${cy + 10} ${cx - 10} ${cy} Z" fill="none" stroke="${glyph}" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="3" fill="${glyph}"/>`;
    else glyphs += `<path d="M${cx - 9} ${cy - 10} L${cx + 9} ${cy - 10} L${cx} ${cy + 12} Z" fill="none" stroke="${glyph}" stroke-width="3"/>`;
  }

  let torchArt = '';
  for (const t of torches) {
    const tx = W * t;
    const ty = faceTop + 10;
    torchArt += `
    <rect x="${tx - 4}" y="${ty + 8}" width="8" height="22" rx="2" fill="#5A3A1E" stroke="${LINE}" stroke-width="2"/>
    <path d="M${tx - 9} ${ty + 10} H${tx + 9}" stroke="${css(PALETTE.oro)}" stroke-width="4" stroke-linecap="round"/>
    <path d="M${tx} ${ty - 16} Q${tx + 10} ${ty - 2} ${tx + 6} ${ty + 8} H${tx - 6} Q${tx - 10} ${ty - 2} ${tx} ${ty - 16} Z" fill="#FF9F1C" stroke="#C1440E" stroke-width="2"/>
    <path d="M${tx} ${ty - 6} Q${tx + 4} ${ty + 2} ${tx} ${ty + 7} Q${tx - 4} ${ty + 2} ${tx} ${ty - 6} Z" fill="#FFE66D"/>`;
  }

  const rugW = 380;
  const rugH = 170;
  const rx = W / 2 - rugW / 2;
  const ry = inset + wall + (D - inset - wall) / 2 - rugH / 2 + 30;

  const body = `
  <g transform="translate(0 ${backWallH - inset})">
    <rect x="${inset}" y="${inset}" width="${W - 2 * inset}" height="${D - inset}" fill="#B8925A"/>
    ${tiles}
    <rect x="${rx}" y="${ry}" width="${rugW}" height="${rugH}" rx="6" fill="${css(PALETTE.lapislazzuli)}" stroke="${LINE}" stroke-width="3"/>
    <rect x="${rx + 12}" y="${ry + 12}" width="${rugW - 24}" height="${rugH - 24}" rx="4" fill="none" stroke="${css(PALETTE.oro)}" stroke-width="4"/>
    <path d="M${rx + 30} ${ry + rugH / 2} H${rx + rugW - 30}" stroke="${css(PALETTE.turchese)}" stroke-width="4" stroke-dasharray="14 10"/>
    <circle cx="${W / 2}" cy="${ry + rugH / 2}" r="22" fill="${css(PALETTE.oro)}" stroke="${LINE}" stroke-width="3"/>
    <!-- muro di fondo: faccia e cima -->
    <rect x="${inset}" y="${faceTop}" width="${W - 2 * inset}" height="${backWallH}" fill="${face}" stroke="${LINE}" stroke-width="3"/>
    ${glyphs}
    <rect x="${inset}" y="${faceTop - 14}" width="${W - 2 * inset}" height="16" fill="${top}" stroke="${LINE}" stroke-width="3"/>
    ${torchArt}
    <!-- muri laterali (si vede la cima) -->
    <rect x="${inset}" y="${faceTop - 14}" width="${wall}" height="${D - faceTop + 14}" fill="${top}" stroke="${LINE}" stroke-width="3"/>
    <rect x="${W - inset - wall}" y="${faceTop - 14}" width="${wall}" height="${D - faceTop + 14}" fill="${top}" stroke="${LINE}" stroke-width="3"/>
  </g>`;
  return { width, height, body };
}

/** Muro davanti della sala, con l'apertura della porta al centro. Il fondo del disegno è la base davanti. */
export function bigPyramidFrontWallSvg() {
  const { W, doorW, frontWallH, wall } = BIG_PYRAMID;
  const topH = 16;
  const h = frontWallH + topH;
  const seg = (x: number, w: number) => `
    <rect x="${x}" y="${topH}" width="${w}" height="${frontWallH}" fill="#C9A465" stroke="${LINE}" stroke-width="3"/>
    <rect x="${x}" y="2" width="${w}" height="${topH}" fill="#E2C88E" stroke="${LINE}" stroke-width="3"/>
    <path d="M${x} ${topH + frontWallH / 2} H${x + w}" stroke="#A9864C" stroke-width="2"/>`;
  const left = W / 2 - doorW / 2;
  const body = seg(2, left - 2) + seg(W / 2 + doorW / 2, left - 2);
  void wall;
  return { width: W, height: h, body };
}

/** Sarcofago decorativo sdraiato (si vede il coperchio dall'alto e il fianco davanti). Base in fondo al disegno. */
export function sarcophagusSvg() {
  const gold = css(PALETTE.oro);
  const lapis = css(PALETTE.lapislazzuli);
  const turq = css(PALETTE.turchese);
  const body = `
  <ellipse cx="85" cy="94" rx="80" ry="8" fill="#14213D" opacity="0.25"/>
  <path d="M14 56 Q8 40 22 30 L148 30 Q164 40 158 56 L158 82 Q160 92 148 92 L22 92 Q10 92 14 82 Z" fill="${css(PALETTE.oroOmbra)}" stroke="${LINE}" stroke-width="3"/>
  <path d="M14 56 Q8 24 30 14 L142 14 Q164 24 158 56 Q160 64 148 66 L24 66 Q12 64 14 56 Z" fill="${gold}" stroke="${LINE}" stroke-width="3"/>
  <path d="M54 18 L54 62 M78 18 L78 62 M102 18 L102 62 M126 18 L126 62" stroke="${turq}" stroke-width="4"/>
  <path d="M60 22 L60 58 M84 22 L84 58 M108 22 L108 58" stroke="${lapis}" stroke-width="2"/>
  <path d="M18 40 Q20 16 40 16 L44 16 L44 64 L40 64 Q20 64 18 40 Z" fill="${lapis}" stroke="${LINE}" stroke-width="2.5"/>
  <ellipse cx="34" cy="40" rx="10" ry="13" fill="#F3D27A" stroke="${LINE}" stroke-width="2"/>
  <path d="M29 37 H32 M36 37 H39" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
  <path d="M24 72 H150 M24 82 H150" stroke="#8C5A0C" stroke-width="2"/>`;
  return { width: 170, height: 104, body };
}

/** Bagliore caldo delle torce (si sovrappone in modo additivo). */
export function torchGlowSvg() {
  const body = `<defs><radialGradient id="g"><stop offset="0" stop-color="#FFD27A" stop-opacity="0.75"/><stop offset="0.5" stop-color="#FF9F1C" stop-opacity="0.25"/><stop offset="1" stop-color="#FF9F1C" stop-opacity="0"/></radialGradient></defs>
  <circle cx="80" cy="80" r="80" fill="url(#g)"/>`;
  return { width: 160, height: 160, body };
}
