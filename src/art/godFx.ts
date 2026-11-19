import { PALETTE, css } from './palette';

// Disegni degli effetti delle armi e delle super degli dèi di Bronzo (Horus, Sobek, Bastet, Tefnut, Shu).

const LINE = css(PALETTE.bluNotte);
const GOLD = css(PALETTE.oro);
const LAPIS = css(PALETTE.lapislazzuli);

/** Freccia d'oro di Horus con le penne blu (punta verso destra). */
export function arrowSvg() {
  const body = `
  <path d="M10 9 L74 9" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
  <path d="M10 9 L74 9" stroke="#E8B04A" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M70 2.5 L90 9 L70 15.5 L74 9 Z" fill="#F4F1E8" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M2 3 L16 9 L2 15 L8 9 Z" fill="#2F67D8" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M12 4 L22 9 L12 14" fill="none" stroke="#2F67D8" stroke-width="2.4"/>`;
  return { width: 92, height: 18, body };
}

/** Mascella di coccodrillo con i denti (punta verso destra, denti in giù). Quella di sotto è la stessa capovolta. */
export function jawSvg() {
  const body = `
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7CC47F"/><stop offset="1" stop-color="#2F6E3C"/>
  </linearGradient></defs>
  <path d="M14 30 L24 40 L30 30 L38 41 L45 30 L53 41 L60 30 L68 40 L75 30 L82 38 L88 30 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M4 30 Q8 8 40 6 Q84 4 108 20 Q112 28 102 31 Z" fill="url(#g)" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="100" cy="17" rx="4" ry="2.5" fill="#1D4A26"/>
  <path d="M20 16 Q50 9 86 13" fill="none" stroke="#A6E0A2" stroke-width="2.4" stroke-linecap="round"/>`;
  return { width: 114, height: 44, body };
}

/** Goccia d'acqua. */
export function dropSvg() {
  const body = `
  <path d="M10 2 Q2 14 2 18 Q2 26 10 26 Q18 26 18 18 Q18 14 10 2 Z" fill="#5FD3F0" stroke="${LINE}" stroke-width="2"/>
  <path d="M7 14 Q6 19 9 22" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`;
  return { width: 20, height: 28, body };
}

/** Nuvola della pioggia di Tefnut. */
export function rainCloudSvg() {
  const body = `
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F4FAFF"/><stop offset="1" stop-color="#93A9C9"/>
  </linearGradient></defs>
  <path d="M40 112 Q8 112 10 86 Q12 62 42 64 Q46 30 88 32 Q110 6 148 18 Q176 6 200 30 Q236 26 244 58 Q274 64 270 90 Q266 114 236 112 Z"
    fill="url(#g)" stroke="${LINE}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M60 60 Q66 44 86 44 M140 30 Q160 22 180 34" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
  <path d="M30 104 Q140 116 252 104" fill="none" stroke="#7D93B5" stroke-width="5" stroke-linecap="round"/>`;
  return { width: 280, height: 124, body };
}

/** Il tornado di Shu (la punta tocca terra in basso al centro). */
export function tornadoSvg() {
  const body = `
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="0.6" stop-color="#D9EEF3" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#9FC3CF" stop-opacity="0.9"/>
  </linearGradient></defs>
  <path d="M8 22 Q75 0 142 22 Q136 44 112 62 Q100 100 90 140 Q82 182 76 226 Q68 182 60 140 Q48 100 36 62 Q14 44 8 22 Z"
    fill="url(#g)" stroke="${LINE}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M18 26 Q75 44 132 26 M36 62 Q76 76 112 62 M48 100 Q78 110 102 100 M58 138 Q78 146 92 138 M66 176 Q78 182 86 176"
    fill="none" stroke="#86AEBC" stroke-width="3" stroke-linecap="round"/>
  <path d="M30 30 Q60 40 80 38 M44 70 Q64 78 80 76" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>`;
  return { width: 150, height: 230, body };
}

/** L'Occhio di Horus (udjat) d'oro e lapislazzuli, che appare nel cielo. */
export function horusEyeSvg() {
  const body = `
  <path d="M30 24 Q110 0 192 24 L188 36 Q110 14 34 36 Z" fill="${LAPIS}" stroke="${GOLD}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M38 58 Q110 14 182 58 Q110 92 38 58 Z" fill="#FFFFFF" stroke="${GOLD}" stroke-width="10" stroke-linejoin="round"/>
  <path d="M38 58 Q110 14 182 58 Q110 92 38 58 Z" fill="none" stroke="${LAPIS}" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="110" cy="56" r="21" fill="${LAPIS}" stroke="${GOLD}" stroke-width="3"/>
  <circle cx="103" cy="49" r="6" fill="#FFFFFF" opacity="0.85"/>
  <path d="M182 58 L210 56" stroke="${GOLD}" stroke-width="10" stroke-linecap="round"/>
  <path d="M182 58 L210 56" stroke="${LAPIS}" stroke-width="5" stroke-linecap="round"/>
  <path d="M96 84 L90 118" stroke="${GOLD}" stroke-width="12" stroke-linecap="round"/>
  <path d="M96 84 L90 118" stroke="${LAPIS}" stroke-width="6" stroke-linecap="round"/>
  <path d="M128 82 Q138 110 160 108 Q176 102 168 88" fill="none" stroke="${GOLD}" stroke-width="12" stroke-linecap="round"/>
  <path d="M128 82 Q138 110 160 108 Q176 102 168 88" fill="none" stroke="${LAPIS}" stroke-width="6" stroke-linecap="round"/>`;
  return { width: 222, height: 124, body };
}

/** Piumetta bianca portata dal vento. */
export function smallFeatherSvg() {
  const body = `
  <path d="M8 2 Q16 12 13 30 Q8 36 4 30 Q0 14 8 2 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.6"/>
  <path d="M8 6 Q9 20 7 36" fill="none" stroke="#AEB8C8" stroke-width="1.4"/>`;
  return { width: 18, height: 38, body };
}
