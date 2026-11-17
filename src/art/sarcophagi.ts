import { PALETTE, css } from './palette';

// Sarcofagi premio (docs/GAME_DESIGN.md, sezione 5): di legno, di bronzo, d'oro.
// Il Sarcofago del Faraone usa i disegni del logo (quello che sogghigna), in logo.ts.
// Ognuno è diviso in cassa (interno luminoso) e coperchio, per far scivolare via il coperchio.

const LINE = css(PALETTE.bluNotte);
const s = (w = 3) => `stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** Dimensioni comuni di cassa e coperchio. */
export const PRIZE_SARC_SIZE = { width: 220, height: 310 };

const SHAPE = 'M110 8 C52 8 26 46 26 98 L32 176 Q40 256 70 300 L150 300 Q180 256 188 176 L194 98 C194 46 168 8 110 8 Z';

interface TierColors {
  light: string;
  mid: string;
  dark: string;
  /** colore del copricapo e delle fasce */
  band: string;
  bandStripe: string;
  face: string;
}

const COLORS: Record<'legno' | 'bronzo' | 'oro', TierColors> = {
  legno: { light: '#D49A60', mid: '#A8693A', dark: '#6B4423', band: '#7A4B26', bandStripe: '#E3B47A', face: '#E8C9A0' },
  bronzo: { light: '#F0B47A', mid: '#CD7F32', dark: '#7E4718', band: css(PALETTE.turchese), bandStripe: '#F0B47A', face: '#F5C894' },
  oro: { light: '#FFE59A', mid: css(PALETTE.oro), dark: '#9E640B', band: css(PALETTE.lapislazzuli), bandStripe: css(PALETTE.oro), face: '#FFE8A8' },
};

/** La cassa vista quando il coperchio scivola via: bordo colorato e interno pieno di luce d'oro. */
export function prizeCaseSvg(tier: 'legno' | 'bronzo' | 'oro') {
  const c = COLORS[tier];
  const body = `
  <defs>
    <radialGradient id="luce" cx="50%" cy="42%" r="60%">
      <stop offset="0" stop-color="#FFF8D6"/><stop offset="0.4" stop-color="${css(PALETTE.oro)}"/><stop offset="1" stop-color="#4A2C0A"/>
    </radialGradient>
  </defs>
  <path d="${SHAPE}" fill="${c.dark}" ${s(4)}/>
  <path d="M110 24 C62 24 42 58 42 100 L48 174 Q56 246 80 286 L140 286 Q164 246 172 174 L178 100 C178 58 158 24 110 24 Z" fill="url(#luce)"/>`;
  return { ...PRIZE_SARC_SIZE, body };
}

/** Il coperchio con una faccia tranquilla (solo quello del Faraone sogghigna). */
export function prizeLidSvg(tier: 'legno' | 'bronzo' | 'oro') {
  const c = COLORS[tier];
  // venature del legno, borchie del bronzo, gemme dell'oro
  const extra =
    tier === 'legno'
      ? `<path d="M50 250 Q70 244 84 256 M140 250 Q156 242 172 252 M60 280 Q80 274 96 284" fill="none" stroke="${c.dark}" stroke-width="2.5" stroke-linecap="round"/>`
      : tier === 'bronzo'
        ? [60, 92, 128, 160].map((x) => `<circle cx="${x}" cy="262" r="5" fill="${c.light}" ${s(2)}/>`).join('')
        : `<path d="M110 236 l10 12 -10 12 -10 -12 Z" fill="${css(PALETTE.rossoDeserto)}" ${s(2)}/>
           <circle cx="70" cy="262" r="7" fill="${css(PALETTE.turchese)}" ${s(2)}/><circle cx="150" cy="262" r="7" fill="${css(PALETTE.turchese)}" ${s(2)}/>`;
  const body = `
  <defs>
    <linearGradient id="corpo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.light}"/><stop offset="0.5" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.dark}"/>
    </linearGradient>
  </defs>
  <path d="${SHAPE}" fill="url(#corpo)" ${s(4)}/>
  <!-- copricapo a strisce -->
  <path d="M48 70 Q110 -2 172 70 L180 162 L154 166 L150 96 Q110 68 70 96 L66 166 L40 162 Z" fill="${c.band}" ${s(3)}/>
  <path d="M44 98 L68 102 M42 120 L68 122 M42 142 L67 144 M176 98 L152 102 M178 120 L152 122 M178 142 L153 144" stroke="${c.bandStripe}" stroke-width="6"/>
  <!-- viso -->
  <path d="M72 92 Q110 68 148 92 L146 146 Q110 182 74 146 Z" fill="${c.face}" ${s(3)}/>
  <path d="M84 110 Q92 104 100 110 M120 110 Q128 104 136 110" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="92" cy="120" rx="8" ry="6" fill="#FFFDF2" ${s(2.2)}/><circle cx="93" cy="120" r="3.4" fill="${LINE}"/>
  <ellipse cx="128" cy="120" rx="8" ry="6" fill="#FFFDF2" ${s(2.2)}/><circle cx="127" cy="120" r="3.4" fill="${LINE}"/>
  <path d="M110 124 L107 136 Q110 139 114 137" fill="none" stroke="${c.dark}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M98 148 Q110 156 122 148" fill="none" stroke="${LINE}" stroke-width="3.4" stroke-linecap="round"/>
  <!-- collare -->
  <path d="M60 164 Q110 204 160 164 L164 180 Q110 224 56 180 Z" fill="${c.band}" ${s(2.6)}/>
  <path d="M64 174 Q110 210 156 174" fill="none" stroke="${c.bandStripe}" stroke-width="4"/>
  <!-- fascia centrale -->
  <rect x="96" y="214" width="28" height="74" rx="4" fill="${c.light}" ${s(2.4)}/>
  <path d="M102 230 H118 M102 246 H118 M102 262 H118" stroke="${c.dark}" stroke-width="3"/>
  ${extra}
  <!-- riflesso -->
  <path d="M42 100 Q42 46 90 26" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.55"/>`;
  return { ...PRIZE_SARC_SIZE, body };
}

/** Raggio di luce morbido che esce dal sarcofago aperto. */
export function lightBeamSvg() {
  const body = `
  <defs><linearGradient id="raggio" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#FFF4C2" stop-opacity="0.95"/><stop offset="1" stop-color="${css(PALETTE.oro)}" stop-opacity="0"/>
  </linearGradient></defs>
  <path d="M70 400 L0 0 L240 0 L170 400 Z" fill="url(#raggio)"/>`;
  return { width: 240, height: 400, body };
}
