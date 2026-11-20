// Disegni della mappa "Il Grande Nilo" (vedi GAME_DESIGN.md, sezione 3).
// Ogni oggetto ha la base (dove tocca terra) in fondo al disegno, salvo il ponte (ripetibile).
import { PALETTE, css } from './palette';

const L = css(PALETTE.bluNotte);
const TURQ = css(PALETTE.turchese);
const s = (w = 3) => `stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const shadow = (cx: number, cy: number, rx: number, ry: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#14213D" opacity="0.22"/>`;

type Art = { width: number; height: number; body: string };

/** Casetta di mattoni di fango del villaggio, con tetto piatto e qualcosa sopra. */
export function houseSvg(variant: number): Art {
  const wall = ['#D9A86C', '#E3BF8A', '#C99560'][variant % 3];
  const dark = ['#B0804A', '#C29C66', '#A1703F'][variant % 3];
  const door = [TURQ, '#2B59C3', '#E63946'][variant % 3];
  // sul tetto: anfore, un telo steso o una gabbia di piccioni
  const roof = [
    `<path d="M40 44 Q36 30 46 26 Q56 30 52 44 Z" fill="#B5651D" ${s(2.2)}/><path d="M62 44 Q58 32 66 28 Q74 32 70 44 Z" fill="#C97A3A" ${s(2.2)}/>`,
    `<path d="M120 44 V22 M176 44 V22" stroke="#6B4A2A" stroke-width="4"/><path d="M120 24 Q148 34 176 24 L176 36 Q148 46 120 36 Z" fill="#FFF1C1" ${s(2)}/><path d="M128 30 H168" stroke="${door}" stroke-width="3"/>`,
    `<path d="M150 44 L150 16 L180 6 L180 44 Z" fill="${dark}" ${s(2.5)}/><circle cx="160" cy="26" r="3" fill="${L}"/><circle cx="170" cy="22" r="3" fill="${L}"/><circle cx="165" cy="34" r="3" fill="${L}"/>`,
  ][variant % 3];
  const body = `
  ${shadow(110, 176, 104, 10)}
  ${roof}
  <path d="M14 46 L206 46 L206 174 L14 174 Z" fill="${wall}" ${s()}/>
  <path d="M8 40 H212 V52 H8 Z" fill="${dark}" ${s(2.5)}/>
  <path d="M206 52 L206 174" stroke="${dark}" stroke-width="10"/>
  <path d="M30 80 H60 M74 100 H110 M150 76 H190 M40 140 H70 M150 150 H186" stroke="${dark}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
  <path d="M90 174 V122 Q110 104 130 122 V174 Z" fill="${door}" ${s(2.5)}/>
  <path d="M110 112 V174" stroke="${L}" stroke-width="2" opacity="0.5"/>
  <rect x="34" y="96" width="30" height="26" rx="4" fill="#3B2A1A" ${s(2.5)}/>
  <rect x="158" y="96" width="30" height="26" rx="4" fill="#3B2A1A" ${s(2.5)}/>
  <path d="M34 100 H64 M158 100 H188" stroke="${TURQ}" stroke-width="3"/>`;
  return { width: 220, height: 184, body };
}

/** Pezzo di ponte di legno (si ripete dall'alto in basso), con le sponde ai lati. */
export function bridgeSvg(width: number): Art {
  const h = 64;
  let planks = '';
  for (let y = 0; y < h; y += 16) {
    planks += `<rect x="16" y="${y + 1}" width="${width - 32}" height="14" rx="2" fill="${(y / 16) % 2 ? '#B07A44' : '#BF8A50'}"/>`;
    planks += `<circle cx="26" cy="${y + 8}" r="1.8" fill="#5A3A1E"/><circle cx="${width - 26}" cy="${y + 8}" r="1.8" fill="#5A3A1E"/>`;
  }
  const body = `
  <rect x="10" y="0" width="${width - 20}" height="${h}" fill="#5A3A1E"/>
  ${planks}
  <rect x="0" y="0" width="16" height="${h}" fill="#8E5A2E"/>
  <rect x="${width - 16}" y="0" width="16" height="${h}" fill="#8E5A2E"/>
  <path d="M15 0 V${h} M${width - 15} 0 V${h}" stroke="${L}" stroke-width="3"/>
  <rect x="2" y="26" width="12" height="12" rx="2" fill="#6B4A2A" ${s(2)}/>
  <rect x="${width - 14}" y="26" width="12" height="12" rx="2" fill="#6B4A2A" ${s(2)}/>`;
  return { width, height: h, body };
}
