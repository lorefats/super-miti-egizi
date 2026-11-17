import { PALETTE, css } from './palette';

// Logo (docs/GAME_DESIGN.md, sezione 1): un sarcofago che sogghigna, dorato e turchese,
// con occhi grandi tipo Occhio di Horus, un sopracciglio alzato e un sorriso furbo con un dente d'oro.
// È diviso in pezzi per poterlo animare: la cassa (con l'interno luminoso), il coperchio con la faccia,
// e una "palpebra" che si mette sopra l'occhio destro per fare l'occhiolino.

const LINE = css(PALETTE.bluNotte);
const GOLD = css(PALETTE.oro);
const LAPIS = css(PALETTE.lapislazzuli);
const s = (w = 3) => `stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** Dimensioni comuni di cassa e coperchio (il coperchio sta esattamente sopra la cassa). */
export const LOGO_SIZE = { width: 260, height: 370 };
/** Centro dell'occhio destro (quello che fa l'occhiolino), misurato dall'angolo in alto a sinistra. */
export const LOGO_WINK_EYE = { x: 154, y: 132 };

/** Sagoma del sarcofago: largo alle spalle, stretto ai piedi. */
const SHAPE = 'M130 10 C62 10 30 54 30 116 L38 206 Q48 302 82 356 L178 356 Q212 302 222 206 L230 116 C230 54 198 10 130 10 Z';

/** La cassa: si vede solo quando il coperchio si apre (interno scuro con luce d'oro). */
export function logoCaseSvg() {
  const body = `
  <defs>
    <radialGradient id="luce" cx="50%" cy="40%" r="60%">
      <stop offset="0" stop-color="#FFF4C2"/><stop offset="0.35" stop-color="${GOLD}"/><stop offset="1" stop-color="#3A2208"/>
    </radialGradient>
  </defs>
  <path d="${SHAPE}" fill="${LAPIS}" ${s(4)}/>
  <path d="M130 26 C74 26 46 64 46 118 L54 204 Q63 292 92 342 L168 342 Q197 292 206 204 L214 118 C214 64 186 26 130 26 Z" fill="url(#luce)"/>`;
  return { ...LOGO_SIZE, body };
}

/** Occhio "di Horus": mandorla, pupilla, riga di trucco e (se tear) la goccia a spirale sotto. */
function horusEye(cx: number, cy: number, dir: 1 | -1): string {
  const w = 17;
  return `
  <path d="M${cx - w} ${cy} Q${cx} ${cy - 15} ${cx + w} ${cy} Q${cx} ${cy + 12} ${cx - w} ${cy} Z" fill="#FFFDF2" ${s(2.6)}/>
  <circle cx="${cx + dir * 2}" cy="${cy - 1}" r="7.5" fill="${LAPIS}" stroke="${LINE}" stroke-width="2"/>
  <circle cx="${cx + dir * 2}" cy="${cy - 1}" r="3.6" fill="${LINE}"/>
  <circle cx="${cx + dir * 2 - 2.5}" cy="${cy - 4}" r="2" fill="#FFFFFF"/>
  <path d="M${cx + dir * w} ${cy} L${cx + dir * (w + 12)} ${cy - 2}" stroke="${LINE}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M${cx - dir * 4} ${cy + 9} L${cx - dir * 6} ${cy + 22}" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
  <path d="M${cx + dir * 4} ${cy + 9} Q${cx + dir * 10} ${cy + 26} ${cx + dir * 18} ${cy + 20} Q${cx + dir * 21} ${cy + 15} ${cx + dir * 16} ${cy + 14}" fill="none" stroke="${LINE}" stroke-width="2.6" stroke-linecap="round"/>`;
}

/** Il coperchio con la faccia che sogghigna. */
export function logoLidSvg() {
  // geroglifici semplici sulla fascia centrale
  const glyphs = `
  <path d="M130 268 m-6 0 a6 6 0 1 1 12 0 a6 6 0 1 1 -12 0 M130 274 v14 M122 280 h16" fill="none" stroke="${LINE}" stroke-width="2.4"/>
  <path d="M120 300 q5 -6 10 0 q5 6 10 0" fill="none" stroke="${LINE}" stroke-width="2.4"/>
  <path d="M121 316 h18 M124 322 h12 M127 328 h6" stroke="${LINE}" stroke-width="2.4"/>`;
  const body = `
  <defs>
    <linearGradient id="oroL" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFE59A"/><stop offset="0.5" stop-color="${GOLD}"/><stop offset="1" stop-color="#9E640B"/>
    </linearGradient>
    <linearGradient id="viso" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFE8A8"/><stop offset="1" stop-color="#E7B04A"/>
    </linearGradient>
    <linearGradient id="turchL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#59E0D3"/><stop offset="1" stop-color="#1C9A8F"/>
    </linearGradient>
  </defs>
  <!-- corpo d'oro -->
  <path d="${SHAPE}" fill="url(#oroL)" ${s(4)}/>
  <!-- ali incrociate sul petto -->
  <path d="M46 214 Q130 262 214 214 L210 240 Q130 290 50 240 Z" fill="url(#turchL)" ${s(2.6)}/>
  <path d="M56 226 Q130 268 204 226 M60 236 Q130 278 200 236" fill="none" stroke="${LAPIS}" stroke-width="3"/>
  <!-- fascia centrale con geroglifici -->
  <rect x="112" y="256" width="36" height="86" rx="4" fill="#FFF1C1" ${s(2.4)}/>
  ${glyphs}
  <!-- piedi: righe -->
  <path d="M86 330 L112 330 M148 330 L174 330 M90 344 L112 344 M148 344 L170 344" stroke="#9E640B" stroke-width="3"/>
  <!-- copricapo a strisce -->
  <path d="M56 78 Q130 -6 204 78 L214 186 L182 192 L178 110 Q130 78 82 110 L78 192 L46 186 Z" fill="url(#turchL)" ${s(3)}/>
  <path d="M52 112 L80 116 M50 136 L80 138 M49 160 L79 162 M208 112 L180 116 M210 136 L180 138 M211 160 L181 162" stroke="${GOLD}" stroke-width="7"/>
  <path d="M80 56 Q130 26 180 56" fill="none" stroke="${GOLD}" stroke-width="7"/>
  <!-- cobra d'oro sulla fronte -->
  <path d="M124 78 Q122 62 130 58 Q138 62 136 78 Z" fill="url(#oroL)" ${s(2.2)}/>
  <circle cx="130" cy="66" r="2.6" fill="${css(PALETTE.rossoDeserto)}"/>
  <!-- collare a fasce -->
  <path d="M68 190 Q130 236 192 190 L196 206 Q130 256 64 206 Z" fill="${LAPIS}" ${s(2.6)}/>
  <path d="M72 200 Q130 242 188 200" fill="none" stroke="${GOLD}" stroke-width="4"/>
  <!-- viso -->
  <path d="M84 104 Q130 76 176 104 L174 168 Q130 210 86 168 Z" fill="url(#viso)" ${s(3)}/>
  <path d="M94 112 Q110 100 126 102" fill="none" stroke="#FFF6D6" stroke-width="3" stroke-linecap="round"/>
  <!-- sopracciglia: la sinistra dritta, la destra alzata (furbo) -->
  <path d="M90 116 Q106 110 122 114" fill="none" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
  <path d="M138 108 Q154 92 172 104" fill="none" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
  ${horusEye(106, 132, -1)}
  ${horusEye(LOGO_WINK_EYE.x, LOGO_WINK_EYE.y, 1)}
  <!-- naso -->
  <path d="M130 136 L126 154 Q130 158 136 155" fill="none" stroke="#B9822A" stroke-width="2.6" stroke-linecap="round"/>
  <!-- sorriso furbo, storto, con dente d'oro -->
  <path d="M106 166 Q132 182 160 160" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M110 167 Q132 186 157 163 Q134 176 110 167 Z" fill="#7A2A1E"/>
  <rect x="136" y="168" width="9" height="9" rx="1.5" fill="#FFE59A" stroke="${LINE}" stroke-width="2"/>
  <path d="M160 160 Q165 158 166 154" fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
  <!-- barba del faraone -->
  <path d="M122 186 L138 186 L136 214 Q130 220 124 214 Z" fill="${LAPIS}" ${s(2.4)}/>
  <path d="M123 194 H137 M123 202 H137 M124 210 H136" stroke="${GOLD}" stroke-width="2.6"/>
  <!-- riflesso sul bordo -->
  <path d="M48 112 Q48 50 104 30" fill="none" stroke="#FFF6D6" stroke-width="4" stroke-linecap="round" opacity="0.8"/>`;
  return { ...LOGO_SIZE, body };
}

/** Palpebra chiusa per l'occhiolino: copre l'occhio destro. Il centro dell'immagine va su LOGO_WINK_EYE. */
export function logoWinkSvg() {
  const body = `
  <ellipse cx="30" cy="20" rx="25" ry="17" fill="#F7CB6A"/>
  <path d="M10 20 Q30 32 50 20" fill="none" stroke="${LINE}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M50 20 L58 16" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M18 26 L15 32 M30 29 L30 35 M42 26 L45 32" stroke="${LINE}" stroke-width="2.6" stroke-linecap="round"/>`;
  return { width: 60, height: 40, body };
}

/** Raggi di luce che escono quando il coperchio si apre. */
export function logoRaysSvg() {
  let rays = '';
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.22;
    const x2 = 200 + Math.cos(a) * 200;
    const y2 = 200 + Math.sin(a) * 200;
    const x3 = 200 + Math.cos(a + 0.08) * 200;
    const y3 = 200 + Math.sin(a + 0.08) * 200;
    rays += `<path d="M200 200 L${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} Z" fill="url(#r)"/>`;
  }
  const body = `<defs><radialGradient id="r" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#FFF4C2" stop-opacity="0.95"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
  </radialGradient></defs>${rays}`;
  return { width: 400, height: 400, body };
}
