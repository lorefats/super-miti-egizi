import { PALETTE, css } from './palette';

// Disegni degli effetti delle armi e delle super degli dèi d'Oro (Ammit, Amon, Maat, Kek, Thoth, Nefti).

const LINE = css(PALETTE.bluNotte);
const GOLD = css(PALETTE.oro);

/** Bolla d'ombra di Kek. */
export function shadowBubbleSvg() {
  const body = `
  <defs><radialGradient id="b" cx="0.35" cy="0.3" r="0.75">
    <stop offset="0" stop-color="#C9A6F7"/><stop offset="0.6" stop-color="#5A3A99"/><stop offset="1" stop-color="#1B1236"/>
  </radialGradient></defs>
  <circle cx="24" cy="24" r="21" fill="url(#b)" stroke="${LINE}" stroke-width="3" opacity="0.92"/>
  <path d="M12 16 Q16 10 22 9" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>`;
  return { width: 48, height: 48, body };
}

/** Lama d'ombra viola di Nefti (punta verso destra). */
export function shadowBladeSvg() {
  const body = `
  <path d="M4 18 Q30 2 60 12 Q40 14 30 22 Q18 20 4 18 Z" fill="#5A189A" stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M14 15 Q32 7 52 11" fill="none" stroke="#C9A6F7" stroke-width="2.4" stroke-linecap="round"/>`;
  return { width: 64, height: 26, body };
}

/** I geroglifici di Thoth (tre diversi): ankh, occhio, uccellino. */
export function glyphSvg(kind: 0 | 1 | 2) {
  const glyphs = [
    `<path d="M20 8 Q12 8 12 16 Q12 22 20 24 Q28 22 28 16 Q28 8 20 8 Z M20 24 L20 38 M10 26 L30 26" fill="none" stroke="#FFE08A" stroke-width="4.5" stroke-linecap="round"/>`,
    `<path d="M4 20 Q20 6 36 20 Q20 30 4 20 Z" fill="none" stroke="#FFE08A" stroke-width="4"/><circle cx="20" cy="19" r="4.5" fill="#FFE08A"/><path d="M14 28 L12 36 M22 28 Q26 36 32 32" fill="none" stroke="#FFE08A" stroke-width="3.5" stroke-linecap="round"/>`,
    `<path d="M8 30 Q10 18 20 16 Q24 8 30 12 L34 12 L30 16 Q32 26 22 30 Z M14 30 L12 38 M22 30 L22 38" fill="none" stroke="#FFE08A" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`,
  ];
  // contorno scuro dietro, così si legge su ogni terreno
  const glyph = glyphs[kind];
  const body = glyph.replace(/stroke="#FFE08A"/g, `stroke="${LINE}"`).replace(/stroke-width="([\d.]+)"/g, (_m, w) => `stroke-width="${Number(w) + 4}"`).replace(/fill="#FFE08A"/g, `fill="${LINE}"`) + glyph;
  return { width: 40, height: 40, body };
}

/** La bilancia d'oro di Maat (appare sopra il nemico). */
export function bigScaleSvg() {
  const body = `
  <path d="M60 12 L60 92 M40 100 L80 100 L60 90 Z" stroke="${LINE}" stroke-width="8" stroke-linecap="round" fill="${GOLD}"/>
  <path d="M60 12 L60 92" stroke="${GOLD}" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="60" cy="10" r="7" fill="${GOLD}" stroke="${LINE}" stroke-width="3"/>
  <path d="M14 22 L106 22" stroke="${LINE}" stroke-width="8" stroke-linecap="round"/>
  <path d="M14 22 L106 22" stroke="${GOLD}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M14 22 L4 52 M14 22 L24 52 M106 22 L96 52 M106 22 L116 52" stroke="${LINE}" stroke-width="2"/>
  <path d="M0 52 Q14 66 28 52 Z" fill="${GOLD}" stroke="${LINE}" stroke-width="3"/>
  <path d="M92 52 Q106 66 120 52 Z" fill="${GOLD}" stroke="${LINE}" stroke-width="3"/>`;
  return { width: 120, height: 104, body };
}
