// Disegni del Calcio del Nilo: la palla e le porte.
import { PALETTE, css } from './palette';

const L = css(PALETTE.bluNotte);
const GOLD = css(PALETTE.oro);
const TURQ = css(PALETTE.turchese);
const LAPIS = css(PALETTE.lapislazzuli);

type Art = { width: number; height: number; body: string };

/** Palla di cuoio chiaro con spicchi d'oro e turchese e un piccolo scarabeo. */
export function ballSvg(): Art {
  const body = `
  <defs><radialGradient id="p" cx="0.38" cy="0.32" r="0.75">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#F3E3C0"/><stop offset="1" stop-color="#C9A877"/>
  </radialGradient></defs>
  <circle cx="26" cy="26" r="22" fill="url(#p)" stroke="${L}" stroke-width="3"/>
  <path d="M26 4 Q36 14 26 26 Q16 14 26 4 Z" fill="${GOLD}" stroke="${L}" stroke-width="1.8"/>
  <path d="M26 48 Q16 38 26 26 Q36 38 26 48 Z" fill="${TURQ}" stroke="${L}" stroke-width="1.8"/>
  <path d="M4 26 Q14 18 26 26 Q14 34 4 26 Z" fill="${LAPIS}" stroke="${L}" stroke-width="1.8"/>
  <path d="M48 26 Q38 34 26 26 Q38 18 48 26 Z" fill="${GOLD}" stroke="${L}" stroke-width="1.8"/>
  <circle cx="26" cy="26" r="4" fill="#E63946" stroke="${L}" stroke-width="1.6"/>
  <path d="M15 12 Q19 9 23 10" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`;
  return { width: 52, height: 52, body };
}

/**
 * Porta (quella di sinistra: l'apertura guarda a destra). Larga `depth` e alta `mouth` pixel,
 * più i due pali a forma di piccolo obelisco che sporgono in alto.
 */
export function goalSvg(depth: number, mouth: number): Art {
  const top = 70; // spazio sopra per i pali
  const w = depth + 30;
  const h = mouth + top + 30;
  let net = '';
  for (let x = 8; x < depth; x += 16) net += `<path d="M${x} ${top} V${top + mouth}" stroke="#FFFFFF" stroke-width="2" opacity="0.7"/>`;
  for (let y = top + 10; y < top + mouth; y += 16) net += `<path d="M0 ${y} H${depth}" stroke="#FFFFFF" stroke-width="2" opacity="0.7"/>`;
  const post = (y: number) => `
    <path d="M${depth - 6} ${y} L${depth - 2} ${y - 62} L${depth + 14} ${y - 62} L${depth + 18} ${y} Z" fill="#F3E3C0" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${depth - 2} ${y - 62} L${depth + 6} ${y - 76} L${depth + 14} ${y - 62} Z" fill="${GOLD}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M${depth + 2} ${y - 44} H${depth + 10} M${depth + 2} ${y - 30} H${depth + 10}" stroke="${TURQ}" stroke-width="3"/>`;
  const body = `
  <rect x="0" y="${top}" width="${depth}" height="${mouth}" fill="#14213D" opacity="0.25"/>
  ${net}
  <path d="M0 ${top} H${depth} M0 ${top + mouth} H${depth}" stroke="${L}" stroke-width="6"/>
  <path d="M${depth + 6} ${top - 14} V${top + mouth}" stroke="${L}" stroke-width="10" stroke-linecap="round"/>
  <path d="M${depth + 6} ${top - 14} V${top + mouth}" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>
  ${post(top)}
  ${post(top + mouth)}`;
  return { width: w, height: h, body };
}

/** Distanza tra il bordo alto del disegno della porta e l'inizio dell'apertura. */
export const GOAL_ART_TOP = 70;
