import { PALETTE, css, type ColorVariant } from '../palette';

// Pezzi in comune tra i disegni dei personaggi (stesse proporzioni di Anubi, vedi docs/ART_STYLE.md).
// Tutti i personaggi sono 112×160, girati a destra, con i piedi sul fondo del disegno.

export const LINE = '#10162B';
export const GOLD = css(PALETTE.oro);
export const TURQ = css(PALETTE.turchese);
export const LAPIS = css(PALETTE.lapislazzuli);
/** Contorno sottile blu notte. */
export const S = `stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;

/** Tre toni di un colore: chiaro (luce in alto a sinistra), medio e scuro (ombra). */
export interface Tone {
  light: string;
  mid: string;
  dark: string;
}

/** Colori "da bot": il giocatore usa il colore del personaggio, i bot uno di questi per riconoscerli. */
const VARIANT_TONES: Record<Exclude<ColorVariant, 'base'>, Tone> = {
  rosso: { light: '#F07A70', mid: '#C0392B', dark: '#6E1C14' },
  verde: { light: '#7FD08A', mid: '#3E9B4F', dark: '#1D5428' },
  viola: { light: '#B394E0', mid: '#7A52B3', dark: '#3E2463' },
  grigio: { light: '#E4E7EE', mid: '#A3AABB', dark: '#5D6475' },
  sabbia: { light: '#E8C58E', mid: '#B98B47', dark: '#6B4C20' },
};

/** Il colore principale del personaggio, cambiato per i bot. */
export function variantTone(base: Tone, variant: ColorVariant): Tone {
  return variant === 'base' ? base : VARIANT_TONES[variant];
}

/** Sfumatura in diagonale (luce in alto a sinistra). */
export function grad(id: string, t: Tone): string {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${t.light}"/><stop offset="0.55" stop-color="${t.mid}"/><stop offset="1" stop-color="${t.dark}"/>
  </linearGradient>`;
}

/** Oro con riflesso in alto. */
export function goldGrad(id = 'oro'): string {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFE08A"/><stop offset="0.5" stop-color="${GOLD}"/><stop offset="1" stop-color="#A86A0C"/>
  </linearGradient>`;
}

/** Lino bianco. */
export function linenGrad(id = 'lino'): string {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D8CCB4"/>
  </linearGradient>`;
}

/** Braccio dietro il corpo. */
export const backArm = (fill: string, thick = false) =>
  thick
    ? `<path d="M37 72 Q27 86 30 104 L41 105 Q41 88 47 76 Z" fill="${fill}" ${S}/>`
    : `<path d="M40 72 Q32 86 34 102 L42 103 Q42 88 48 76 Z" fill="${fill}" ${S}/>`;

/** Braccio davanti con il pugno (per chi non tiene un'arma separata). */
export const frontArm = (fill: string, thick = false) =>
  (thick
    ? `<path d="M72 70 Q88 78 94 90 L86 98 Q78 90 68 84 Z" fill="${fill}" ${S}/>`
    : `<path d="M74 72 Q86 80 92 90 L86 96 Q78 88 70 82 Z" fill="${fill}" ${S}/>`) +
  `<ellipse cx="89" cy="93" rx="${thick ? 7.5 : 6}" ry="${thick ? 8 : 7}" fill="${fill}" ${S}/>`;

/** Braccialetto d'oro sul braccio davanti. */
export const bracelet = `<rect x="80" y="84" width="7" height="10" rx="2" transform="rotate(-40 83 89)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>`;

/** Cintura d'oro con la gemma turchese. */
export const belt = (fill = 'url(#oro)') =>
  `<rect x="41" y="99" width="37" height="7" rx="2" fill="${fill}" ${S}/>
  <rect x="56" y="99" width="7" height="7" fill="${TURQ}" stroke="${LINE}" stroke-width="1.5"/>`;

/** Collare usekh d'oro con le file turchese e lapislazzuli. */
export const collar = `<path d="M38 70 Q59 96 80 70 Q59 78 38 70 Z" fill="url(#oro)" ${S}/>
  <path d="M43 75 Q59 90 75 75" fill="none" stroke="${TURQ}" stroke-width="3"/>
  <path d="M47 80 Q59 88 71 80" fill="none" stroke="${LAPIS}" stroke-width="2.5"/>`;

/** Collo. */
export const neck = (fill: string) => `<path d="M52 56 L50 70 L64 70 L64 56 Z" fill="${fill}" ${S}/>`;

/** Anche (punto in cui ruota la gamba), misurate dai piedi del personaggio girato a destra. */
export const HIPS = { back: { x: -5, y: -35 }, front: { x: 9, y: -35 } };

/** Una gamba con il sandalo (il punto dell'anca è in alto). */
export function legSvg(skin: Tone, sandal = '#8A5A2B', strap = GOLD) {
  const body = `
  <defs>${grad('pelle', skin)}</defs>
  <path d="M6 2 L6 28 L14 28 L16 2 Z" fill="url(#pelle)" ${S}/>
  <path d="M3 28 L17 28 L20 34 L2 34 Z" fill="${sandal}" ${S}/>
  <path d="M10 24 L12 28" stroke="${strap}" stroke-width="2"/>`;
  return { width: 22, height: 36, body, hipX: 11, hipY: 3 };
}
