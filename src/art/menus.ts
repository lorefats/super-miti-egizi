import { PALETTE, css } from './palette';

// Disegni delle schermate Personaggi e Cammino delle Coppe (sezioni 6, 7, 9).

const LINE = css(PALETTE.bluNotte);
const GOLD = css(PALETTE.oro);
const GOLD_DARK = css(PALETTE.oroOmbra);

/**
 * Sagoma di una divinità con il copricapo: tutta bianca, così si colora con la tinta.
 * Serve per i personaggi bloccati ("in ombra") e per quelli che non hanno ancora un disegno.
 * Piedi in basso al centro.
 */
export function godSilhouetteSvg() {
  const body = `
  <g fill="#FFFFFF">
    <path d="M60 6 L76 14 L80 44 Q80 56 72 62 L76 70 L48 70 L50 62 Q40 56 40 44 L44 14 Z"/>
    <path d="M34 72 Q60 64 86 72 L94 116 L84 120 L82 98 L80 128 L88 168 L66 168 L60 134 L54 168 L32 168 L40 128 L38 98 L36 120 L26 116 Z"/>
  </g>`;
  return { width: 120, height: 170, body };
}

/** Stemma del Prestigio 1: ankh d'oro su uno scudo turchese con un'ala per lato. */
export function prestigeBadgeSvg() {
  const body = `
  <path d="M6 30 Q16 18 32 24 Q22 30 26 40 Q14 40 6 30 Z M90 30 Q80 18 64 24 Q74 30 70 40 Q82 40 90 30 Z" fill="${GOLD}" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M48 4 L72 14 L70 40 Q66 58 48 66 Q30 58 26 40 L24 14 Z" fill="${css(PALETTE.turchese)}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M48 4 L72 14 L70 40 Q66 58 48 66 Z" fill="#000000" opacity="0.12"/>
  <path d="M48 16 Q40 16 40 25 Q40 32 46 34 L36 34 L36 40 L45 40 L45 56 L51 56 L51 40 L60 40 L60 34 L50 34 Q56 32 56 25 Q56 16 48 16 Z M48 21 Q51 21 51 26 Q51 30 48 30 Q45 30 45 26 Q45 21 48 21 Z" fill="${GOLD}" stroke="${LINE}" stroke-width="2"/>`;
  return { width: 96, height: 70, body };
}

/** Tappa del Cammino: medaglione di pietra con bordo d'oro (il premio si disegna sopra). */
export function roadStopSvg() {
  const body = `
  <ellipse cx="60" cy="98" rx="46" ry="12" fill="#000000" opacity="0.25"/>
  <circle cx="60" cy="56" r="50" fill="${GOLD_DARK}" stroke="${LINE}" stroke-width="3"/>
  <circle cx="60" cy="52" r="46" fill="${GOLD}" stroke="${LINE}" stroke-width="2"/>
  <circle cx="60" cy="52" r="36" fill="#2A3A6B" stroke="${LINE}" stroke-width="2.5"/>
  <path d="M60 6 v8 M60 90 v8 M14 52 h8 M98 52 h8" stroke="${LINE}" stroke-width="2.5" stroke-linecap="round"/>`;
  return { width: 120, height: 112, body };
}
