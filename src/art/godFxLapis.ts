import { PALETTE, css } from './palette';

// Disegni degli effetti delle armi e delle super degli dèi Lapislazzuli (Iside, Seth, Sekhmet, Khonsu, Nut, Ptah).

const LINE = css(PALETTE.bluNotte);
const GOLD = css(PALETTE.oro);

/** Lancia del Caos di Seth (punta verso destra). */
export function spearSvg() {
  const body = `
  <path d="M4 9 L70 9" stroke="${LINE}" stroke-width="6" stroke-linecap="round"/>
  <path d="M4 9 L70 9" stroke="#8C2A1A" stroke-width="3" stroke-linecap="round"/>
  <path d="M66 1 L92 9 L66 17 L70 9 Z" fill="#E63946" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M70 5 L84 9" stroke="#FFB3B8" stroke-width="2" stroke-linecap="round"/>
  <path d="M14 4 L20 9 L14 14" fill="none" stroke="${GOLD}" stroke-width="2.6"/>`;
  return { width: 94, height: 18, body };
}

/** Lingua di fuoco (si tinge di rosso, arancio, giallo). */
export function flameSvg() {
  const body = `
  <path d="M16 2 Q26 14 24 24 Q22 32 16 32 Q8 32 7 24 Q6 16 12 12 Q12 18 15 18 Q14 10 16 2 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`;
  return { width: 32, height: 34, body };
}

/** Falce di luna argentata di Khonsu (il boomerang). */
export function moonSickleSvg() {
  const body = `
  <defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#9AA6CF"/>
  </linearGradient></defs>
  <path d="M32 4 Q6 8 6 32 Q6 56 32 60 Q16 50 16 32 Q16 14 32 4 Z" fill="url(#m)" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M22 14 Q14 22 14 32" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`;
  return { width: 64, height: 64, body };
}

/** Luna piena scura dell'eclissi, con l'anello di luce. */
export function eclipseSvg() {
  const body = `
  <defs><radialGradient id="c" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0.6" stop-color="#FFF3B0" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/>
  </radialGradient></defs>
  <circle cx="60" cy="60" r="58" fill="url(#c)"/>
  <circle cx="60" cy="60" r="36" fill="#1B1F3B" stroke="${LINE}" stroke-width="3"/>
  <circle cx="50" cy="52" r="5" fill="#2A2F55"/><circle cx="68" cy="68" r="4" fill="#2A2F55"/>`;
  return { width: 120, height: 120, body };
}

/** Stella cadente dorata di Nut. */
export function fallingStarSvg() {
  const body = `
  <path d="M20 2 L25 15 L38 15 L28 23 L32 37 L20 29 L8 37 L12 23 L2 15 L15 15 Z" fill="#FFE08A" stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M16 13 L20 6" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`;
  return { width: 40, height: 40, body };
}

/** Meteora infuocata (cade dall'alto, la coda verso l'alto a destra). */
export function meteorSvg() {
  const body = `
  <path d="M30 34 L70 2 L76 8 L40 42 Z" fill="#FF7B1C" opacity="0.8"/>
  <path d="M34 30 L64 6 L68 10 L38 36 Z" fill="#FFE08A" opacity="0.9"/>
  <circle cx="24" cy="44" r="16" fill="#8C5A3C" stroke="${LINE}" stroke-width="3"/>
  <circle cx="18" cy="40" r="4" fill="#5E3A24"/><circle cx="28" cy="50" r="3" fill="#5E3A24"/>
  <path d="M14 34 Q20 30 26 32" fill="none" stroke="#FFB38A" stroke-width="2.4" stroke-linecap="round"/>`;
  return { width: 80, height: 64, body };
}

/** Martello del Creatore di Ptah. */
export function hammerSvg() {
  const body = `
  <path d="M24 46 L24 14" stroke="${LINE}" stroke-width="7" stroke-linecap="round"/>
  <path d="M24 46 L24 14" stroke="#9C6B3C" stroke-width="4" stroke-linecap="round"/>
  <rect x="6" y="4" width="36" height="16" rx="3" fill="#B8C0CE" stroke="${LINE}" stroke-width="2.8"/>
  <rect x="6" y="4" width="8" height="16" rx="2" fill="${GOLD}" stroke="${LINE}" stroke-width="2"/>
  <rect x="34" y="4" width="8" height="16" rx="2" fill="${GOLD}" stroke="${LINE}" stroke-width="2"/>
  <path d="M16 8 L32 8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`;
  return { width: 48, height: 50, body };
}

/** Obelisco Guardiano di Ptah: pietra chiara, punta d'oro e un occhio che brilla. */
export function guardianObeliskSvg() {
  const body = `
  <defs><linearGradient id="o" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#F3E3C0"/><stop offset="0.6" stop-color="#D8C094"/><stop offset="1" stop-color="#9E8458"/>
  </linearGradient></defs>
  <rect x="4" y="132" width="52" height="14" rx="3" fill="#B39B6C" stroke="${LINE}" stroke-width="3"/>
  <path d="M14 134 L20 26 L40 26 L46 134 Z" fill="url(#o)" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M20 26 L30 4 L40 26 Z" fill="${GOLD}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M30 8 L26 22" stroke="#FFF3B0" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M22 44 Q30 38 38 44 Q30 50 22 44 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="2"/>
  <circle cx="30" cy="44" r="3.5" fill="#2EC4B6" stroke="${LINE}" stroke-width="1.4"/>
  <path d="M26 64 L34 64 M30 60 L30 76 M25 86 Q30 80 35 86 M27 100 L33 100 L30 108 Z" fill="none" stroke="#7A6440" stroke-width="2.2" stroke-linecap="round"/>`;
  return { width: 60, height: 148, body };
}
