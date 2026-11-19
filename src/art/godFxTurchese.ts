import { PALETTE, css } from './palette';

// Disegni degli effetti delle armi e delle super degli dèi Turchese (Osiride, Hathor, Geb, Khepri, Khnum).

const LINE = css(PALETTE.bluNotte);
const GOLD = css(PALETTE.oro);

/** Spiga di grano dorata (il campo di Osiride). */
export function wheatSvg() {
  const body = `
  <path d="M12 58 Q11 36 12 14" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M12 58 Q11 36 12 14" fill="none" stroke="#C9A227" stroke-width="2" stroke-linecap="round"/>
  ${[0, 1, 2, 3]
    .map((i) => {
      const y = 8 + i * 8;
      return `<ellipse cx="7" cy="${y + 4}" rx="4" ry="6" transform="rotate(-25 7 ${y + 4})" fill="${GOLD}" stroke="${LINE}" stroke-width="1.6"/>
      <ellipse cx="17" cy="${y + 4}" rx="4" ry="6" transform="rotate(25 17 ${y + 4})" fill="${GOLD}" stroke="${LINE}" stroke-width="1.6"/>`;
    })
    .join('')}
  <ellipse cx="12" cy="6" rx="3.5" ry="5.5" fill="#FFE08A" stroke="${LINE}" stroke-width="1.6"/>
  <path d="M12 46 Q4 40 2 30 M12 50 Q20 44 22 36" fill="none" stroke="#7FB04A" stroke-width="2.5" stroke-linecap="round"/>`;
  return { width: 24, height: 60, body };
}

/** Fiore di loto (spunta nel campo di Osiride). */
export function lotusSvg() {
  const body = `
  <path d="M18 30 Q6 26 4 12 Q12 16 18 26 Z" fill="#F7A8C4" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M18 30 Q30 26 32 12 Q24 16 18 26 Z" fill="#F7A8C4" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M18 30 Q10 18 18 2 Q26 18 18 30 Z" fill="#FFD1E0" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>
  <ellipse cx="18" cy="31" rx="10" ry="3" fill="#4CAF50" stroke="${LINE}" stroke-width="1.6"/>`;
  return { width: 36, height: 36, body };
}

/** Onda sonora del sistro: tre archi rosa (punta verso destra). */
export function soundWaveSvg() {
  const arcs = [0, 1, 2]
    .map((i) => {
      const x = 10 + i * 9;
      const h = 12 + i * 6;
      return `<path d="M${x} ${24 - h} Q${x + 10 + i * 2} 24 ${x} ${24 + h}" fill="none" stroke="${LINE}" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x} ${24 - h} Q${x + 10 + i * 2} 24 ${x} ${24 + h}" fill="none" stroke="${i === 1 ? '#FFFFFF' : '#FF8FAB'}" stroke-width="4" stroke-linecap="round"/>`;
    })
    .join('');
  return { width: 48, height: 48, body: arcs };
}

/** Nota musicale colorata (si tinge). */
export function musicNoteSvg() {
  const body = `
  <path d="M10 26 L10 6 L24 2 L24 22" fill="none" stroke="${LINE}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M10 6 L24 2" stroke="${LINE}" stroke-width="6"/>
  <ellipse cx="6" cy="26" rx="6" ry="4.5" transform="rotate(-20 6 26)" fill="#FFFFFF" stroke="${LINE}" stroke-width="2.4"/>
  <ellipse cx="20" cy="22" rx="6" ry="4.5" transform="rotate(-20 20 22)" fill="#FFFFFF" stroke="${LINE}" stroke-width="2.4"/>`;
  return { width: 28, height: 32, body };
}

/** Roccia appuntita che spunta dal terreno (Geb). */
export function rockSpikeSvg() {
  const body = `
  <defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#C9B8A0"/><stop offset="0.6" stop-color="#8C7A62"/><stop offset="1" stop-color="#4E4232"/>
  </linearGradient></defs>
  <path d="M4 58 L14 20 L24 6 L32 22 L40 14 L50 58 Z" fill="url(#r)" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M14 20 L22 40 L24 58 M32 22 L30 40" fill="none" stroke="#4E4232" stroke-width="1.8"/>
  <path d="M18 18 L24 8" stroke="#E8DCC8" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="27" cy="58" rx="24" ry="3" fill="#4E4232" opacity="0.5"/>`;
  return { width: 54, height: 62, body };
}

/** Palla di sabbia dorata di Khepri (rotola). */
export function sandBallSvg() {
  const body = `
  <defs><radialGradient id="b" cx="0.35" cy="0.3" r="0.75">
    <stop offset="0" stop-color="#FFE7A8"/><stop offset="0.6" stop-color="#E0B058"/><stop offset="1" stop-color="#946524"/>
  </radialGradient></defs>
  <circle cx="24" cy="24" r="21" fill="url(#b)" stroke="${LINE}" stroke-width="3"/>
  <path d="M10 18 Q20 26 14 36 M28 8 Q24 20 34 26 M30 38 Q36 32 42 34" fill="none" stroke="#946524" stroke-width="2" stroke-linecap="round"/>
  <circle cx="18" cy="14" r="2" fill="#FFFFFF" opacity="0.8"/>`;
  return { width: 48, height: 48, body };
}

/** Mucchio di terra smossa (Khepri che scava sotto terra). */
export function dirtMoundSvg() {
  const body = `
  <path d="M4 34 Q10 12 30 10 Q52 10 60 34 Z" fill="#B98B47" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M16 22 Q26 16 36 18" fill="none" stroke="#E8C58E" stroke-width="3" stroke-linecap="round"/>
  <circle cx="44" cy="24" r="3" fill="#6B4C20"/><circle cx="22" cy="28" r="2.5" fill="#6B4C20"/>`;
  return { width: 64, height: 38, body };
}

/** Vaso d'argilla di Khnum. */
export function clayPotSvg() {
  const body = `
  <defs><linearGradient id="v" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#E8A26A"/><stop offset="0.6" stop-color="#B5651D"/><stop offset="1" stop-color="#6B3410"/>
  </linearGradient></defs>
  <path d="M12 4 L28 4 L26 10 Q38 16 36 28 Q34 40 20 40 Q6 40 4 28 Q2 16 14 10 Z" fill="url(#v)" stroke="${LINE}" stroke-width="2.8" stroke-linejoin="round"/>
  <path d="M8 22 Q20 26 32 22" fill="none" stroke="${GOLD}" stroke-width="2.4"/>
  <path d="M9 28 Q20 32 31 28" fill="none" stroke="#2EC4B6" stroke-width="2"/>`;
  return { width: 40, height: 44, body };
}

/** Coccio di vaso (le schegge). */
export function shardSvg() {
  const body = `<path d="M2 10 L8 2 L16 6 L12 14 Z" fill="#C97A3A" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>`;
  return { width: 18, height: 16, body };
}

/** Golem d'argilla di Khnum (guarda a destra, piedi in fondo). */
export function golemSvg() {
  const body = `
  <defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#E8A26A"/><stop offset="0.6" stop-color="#B5651D"/><stop offset="1" stop-color="#6B3410"/>
  </linearGradient></defs>
  <!-- gambe tozze -->
  <path d="M30 96 L28 118 L46 118 L46 96 Z M58 96 L58 118 L76 118 L74 96 Z" fill="url(#c)" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <!-- braccio dietro -->
  <path d="M22 50 Q8 70 12 92 L26 92 Q24 72 32 58 Z" fill="url(#c)" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <!-- corpo a vaso -->
  <path d="M30 34 L74 34 Q92 50 86 78 Q80 102 52 102 Q24 102 20 78 Q16 50 30 34 Z" fill="url(#c)" stroke="${LINE}" stroke-width="3.2" stroke-linejoin="round"/>
  <path d="M24 62 Q52 72 84 62" fill="none" stroke="${GOLD}" stroke-width="3"/>
  <path d="M22 72 Q52 82 84 72" fill="none" stroke="#2EC4B6" stroke-width="2.6"/>
  <path d="M40 88 L46 80 L52 90" fill="none" stroke="#6B3410" stroke-width="2"/>
  <!-- testa con il bordo del vaso e occhi luminosi -->
  <path d="M34 34 Q34 12 54 12 Q74 12 72 34 Z" fill="url(#c)" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="30" y="30" width="46" height="8" rx="3" fill="#C97A3A" stroke="${LINE}" stroke-width="2.6"/>
  <ellipse cx="58" cy="24" rx="4" ry="5" fill="#FFE08A" stroke="${LINE}" stroke-width="2"/>
  <ellipse cx="68" cy="24" rx="3.5" ry="4.5" fill="#FFE08A" stroke="${LINE}" stroke-width="2"/>
  <!-- braccio davanti con il pugno grande -->
  <path d="M74 50 Q94 58 96 76 L84 80 Q82 66 70 60 Z" fill="url(#c)" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="92" cy="82" r="10" fill="url(#c)" stroke="${LINE}" stroke-width="3"/>`;
  return { width: 106, height: 122, body };
}
