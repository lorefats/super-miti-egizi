import { PALETTE, css } from './palette';

// Disegni della Lobby (docs/GAME_DESIGN.md, sezione 8): sala del trono di un tempio, colonne ai lati,
// e dietro un'apertura con le Piramidi. Il cielo cambia con l'ora (vedi LOBBY_SKIES).

const LINE = css(PALETTE.bluNotte);
const GOLD = css(PALETTE.oro);
const TURQ = css(PALETTE.turchese);
const LAPIS = css(PALETTE.lapislazzuli);
const RED = css(PALETTE.rossoDeserto);
const s = (w = 2.6) => `stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

export type TimeOfDay = 'alba' | 'giorno' | 'tramonto' | 'notte';

/** Colori del cielo e "luce" (tinta) sulle cose per ogni momento del giorno. */
export const LOBBY_SKIES: Record<TimeOfDay, { top: number; bottom: number; land: number; hall: number; sun: number }> = {
  alba: { top: 0x5b6bb8, bottom: 0xf6a77a, land: 0xf0c4b0, hall: 0xe8d6d0, sun: 0xffd29a },
  giorno: { top: 0x3f8fdc, bottom: 0xb9e4f5, land: 0xffffff, hall: 0xffffff, sun: 0xfff3c4 },
  tramonto: { top: 0x3b2a6e, bottom: 0xf28a3c, land: 0xf2a679, hall: 0xf0c8a8, sun: 0xffb347 },
  notte: { top: 0x0b1230, bottom: 0x24366e, land: 0x55639a, hall: 0x8a90b8, sun: 0xeef2ff },
};

/** Piramidi lontane con le dune, viste dall'apertura del tempio. Base in fondo al disegno. */
export function lobbyPyramidsSvg() {
  const pyr = (cx: number, base: number, h: number, w: number) => `
  <path d="M${cx - w / 2} ${base} L${cx} ${base - h} L${cx + w / 2} ${base} Z" fill="#E8B865" ${s(2.4)}/>
  <path d="M${cx} ${base - h} L${cx + w / 2} ${base} L${cx + w * 0.12} ${base} Z" fill="#C48A3E"/>
  <path d="M${cx} ${base - h} L${cx - w * 0.07} ${base - h * 0.84} L${cx + w * 0.07} ${base - h * 0.84} Z" fill="#FFE8A8"/>
  <path d="M${cx - w / 2} ${base} L${cx} ${base - h} L${cx + w / 2} ${base} Z" fill="none" ${s(2.4)}/>`;
  const body = `
  <path d="M0 250 Q160 200 330 236 Q520 270 700 226 Q900 190 1100 240 L1100 320 L0 320 Z" fill="#D9A55A" ${s(2)}/>
  ${pyr(330, 262, 210, 340)}
  ${pyr(640, 246, 250, 400)}
  ${pyr(880, 262, 140, 230)}
  <path d="M0 280 Q220 250 450 276 Q700 300 900 268 Q1000 256 1100 270 L1100 320 L0 320 Z" fill="#E9C46A" ${s(2)}/>
  <path d="M120 284 q30 -8 60 0 M520 290 q40 -10 80 0 M820 282 q30 -8 60 0" fill="none" stroke="#C99A4B" stroke-width="2.4"/>`;
  return { width: 1100, height: 320, body };
}

/** Muro di arenaria con geroglifici incisi (si ripete). */
export function lobbyWallSvg() {
  let glyphs = '';
  const g = ['M0 0 h14 M7 0 v16', 'M0 8 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', 'M0 12 q4 -10 7 0 q3 -10 7 0', 'M0 0 l7 14 l7 -14', 'M2 0 h10 v14 h-10 Z'];
  for (let i = 0; i < 8; i++) {
    const x = 30 + (i % 2) * 128 + ((i * 37) % 50);
    const y = 26 + Math.floor(i / 2) * 60;
    glyphs += `<path transform="translate(${x} ${y})" d="${g[i % g.length]}" fill="none" stroke="#A9814E" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  const body = `
  <rect width="256" height="256" fill="#D8B47C"/>
  <path d="M0 64 H256 M0 128 H256 M0 192 H256 M0 256 H256 M96 0 V64 M224 0 V64 M32 64 V128 M160 64 V128 M96 128 V192 M224 128 V192 M32 192 V256 M160 192 V256"
    stroke="#B48C58" stroke-width="3"/>
  <path d="M0 2 H256 M0 66 H256 M0 130 H256 M0 194 H256" stroke="#E9CB98" stroke-width="2"/>
  ${glyphs}`;
  return { width: 256, height: 256, body };
}

/** Grande colonna con capitello a papiro aperto. Base in fondo al disegno. */
export function lobbyColumnSvg() {
  const body = `
  <defs><linearGradient id="fusto" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#F7E6BE"/><stop offset="0.45" stop-color="#E2C690"/><stop offset="1" stop-color="#A9824C"/>
  </linearGradient></defs>
  <rect x="8" y="560" width="144" height="40" rx="4" fill="#CDB07A" ${s(3)}/>
  <rect x="26" y="130" width="108" height="432" fill="url(#fusto)" ${s(3)}/>
  <rect x="26" y="170" width="108" height="18" fill="${LAPIS}" ${s(2)}/>
  <rect x="26" y="192" width="108" height="10" fill="${RED}" ${s(2)}/>
  <rect x="26" y="206" width="108" height="14" fill="${TURQ}" ${s(2)}/>
  <rect x="26" y="500" width="108" height="14" fill="${TURQ}" ${s(2)}/>
  <rect x="26" y="518" width="108" height="10" fill="${GOLD}" ${s(2)}/>
  <path d="M50 250 v220 M80 244 v232 M110 250 v220" stroke="#B9965F" stroke-width="3" stroke-dasharray="14 10"/>
  <path d="M26 130 L2 50 Q80 18 158 50 L134 130 Z" fill="#7FB24E" ${s(3)}/>
  <path d="M14 56 L40 128 M46 40 L60 128 M80 34 L80 128 M114 40 L100 128 M146 56 L120 128" stroke="#4E7F2C" stroke-width="3"/>
  <path d="M20 70 Q80 54 140 70" fill="none" stroke="#B5DB84" stroke-width="3"/>
  <rect x="0" y="22" width="160" height="30" rx="3" fill="#E2C690" ${s(3)}/>
  <rect x="0" y="22" width="160" height="10" fill="${GOLD}" ${s(2)}/>`;
  return { width: 160, height: 600, body };
}

/** Architrave in alto (si ripete in orizzontale): fasce colorate e piccoli cobra. */
export function lobbyLintelSvg() {
  let cobras = '';
  for (let i = 0; i < 8; i++) {
    const x = 16 + i * 32;
    cobras += `<path d="M${x - 8} 120 Q${x - 9} 104 ${x} 98 Q${x + 9} 104 ${x + 8} 120 Z" fill="${GOLD}" ${s(2)}/>`;
  }
  const body = `
  <rect width="256" height="100" fill="#C9A46A"/>
  <rect y="10" width="256" height="20" fill="${LAPIS}"/>
  <rect y="30" width="256" height="8" fill="${GOLD}"/>
  <path d="M0 50 H256 M0 74 H256" stroke="#A9824C" stroke-width="3"/>
  <path d="M0 62 h20 M40 62 h30 M90 62 h18 M128 62 h34 M180 62 h22 M222 62 h24" stroke="#8C6A3F" stroke-width="3" stroke-linecap="round"/>
  <rect y="86" width="256" height="14" fill="${TURQ}"/>
  <path d="M0 100 H256" stroke="${LINE}" stroke-width="4"/>
  ${cobras}`;
  return { width: 256, height: 124, body };
}

/** Disco solare alato al centro dell'architrave. */
export function wingedSunSvg() {
  let feathers = '';
  for (let i = 0; i < 7; i++) {
    const x = 60 + i * 20;
    feathers += `<path d="M${x} 40 L${x - 4} ${68 - i * 2}" stroke="${LAPIS}" stroke-width="4"/>`;
    feathers += `<path d="M${420 - x} 40 L${424 - x} ${68 - i * 2}" stroke="${LAPIS}" stroke-width="4"/>`;
  }
  const body = `
  <path d="M170 46 Q100 20 10 34 Q40 60 80 72 Q130 80 170 66 Z" fill="${GOLD}" ${s(3)}/>
  <path d="M250 46 Q320 20 410 34 Q380 60 340 72 Q290 80 250 66 Z" fill="${GOLD}" ${s(3)}/>
  ${feathers}
  <circle cx="210" cy="52" r="34" fill="${RED}" ${s(3)}/>
  <circle cx="200" cy="42" r="10" fill="#FF8A8A"/>
  <path d="M176 82 Q172 96 184 100 M244 82 Q248 96 236 100" fill="none" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/>`;
  return { width: 420, height: 108, body };
}

/** Pavimento di lastre di pietra (si ripete). */
export function lobbyFloorSvg() {
  const body = `
  <rect width="256" height="128" fill="#C99E62"/>
  <path d="M0 0 H256 M0 64 H256 M0 128 H256 M64 0 V64 M192 0 V64 M0 64 V128 M128 64 V128" stroke="#9C7443" stroke-width="3"/>
  <path d="M2 4 H62 M66 4 H190 M194 4 H254 M2 68 H126 M130 68 H254" stroke="#DDB67C" stroke-width="2"/>
  <circle cx="128" cy="32" r="5" fill="${TURQ}" opacity="0.6"/>
  <circle cx="64" cy="96" r="5" fill="${TURQ}" opacity="0.6"/>`;
  return { width: 256, height: 128, body };
}

/** Piedistallo di pietra con fregi d'oro. Il punto dove stanno i piedi è a (160, 34). */
export function pedestalSvg() {
  const body = `
  <ellipse cx="160" cy="150" rx="150" ry="16" fill="#14213D" opacity="0.25"/>
  <path d="M30 40 L30 120 Q160 160 290 120 L290 40 Z" fill="#B48C58" ${s(3)}/>
  <path d="M30 40 L30 120 Q60 130 80 134 L80 52 Z" fill="#D2AC74"/>
  <path d="M30 76 Q160 114 290 76" fill="none" stroke="${GOLD}" stroke-width="6"/>
  <path d="M30 88 Q160 126 290 88" fill="none" stroke="${LAPIS}" stroke-width="4"/>
  <ellipse cx="160" cy="40" rx="130" ry="32" fill="#E7CC98" ${s(3)}/>
  <ellipse cx="160" cy="40" rx="104" ry="23" fill="none" stroke="${GOLD}" stroke-width="5"/>
  <path d="M60 30 Q100 16 150 14" fill="none" stroke="#FFF1C1" stroke-width="3" stroke-linecap="round"/>`;
  return { width: 320, height: 168, body };
}

/** Pulsante GIOCA a forma di cartiglio dorato (ovale con la barra legata a destra). */
export function playCartoucheSvg() {
  const body = `
  <defs><linearGradient id="cart" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFE59A"/><stop offset="0.5" stop-color="${GOLD}"/><stop offset="1" stop-color="#C98714"/>
  </linearGradient></defs>
  <rect x="10" y="22" width="320" height="110" rx="55" fill="#8A5A0C" ${s(4)}/>
  <rect x="10" y="12" width="320" height="110" rx="55" fill="url(#cart)" ${s(4)}/>
  <rect x="24" y="24" width="292" height="86" rx="43" fill="none" stroke="#FFF1C1" stroke-width="3" opacity="0.8"/>
  <rect x="336" y="18" width="18" height="108" rx="6" fill="url(#cart)" ${s(4)}/>
  <path d="M330 52 L344 46 M330 82 L344 88" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M40 40 Q80 22 140 24" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.6"/>`;
  return { width: 360, height: 140, body };
}

/** Scarabeo d'oro (valuta). */
export function scarabSvg() {
  const body = `
  <path d="M8 18 L2 12 M8 30 L1 32 M10 40 L4 46 M40 18 L46 12 M40 30 L47 32 M38 40 L44 46" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="24" cy="11" rx="9" ry="7" fill="#C98714" ${s(2.2)}/>
  <ellipse cx="24" cy="30" rx="15" ry="17" fill="${GOLD}" ${s(2.4)}/>
  <path d="M24 15 V46" stroke="${LINE}" stroke-width="2.2"/>
  <path d="M14 22 Q16 18 21 18" fill="none" stroke="#FFF1C1" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="24" cy="5" r="4" fill="${RED}" ${s(1.6)}/>`;
  return { width: 48, height: 50, body };
}

/** Polvere di stelle (valuta): un mucchietto di stelline viola e turchese. */
export function stardustSvg() {
  const star = (cx: number, cy: number, r: number, c: string) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r : r * 0.45;
      d += `${i === 0 ? 'M' : 'L'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
    }
    return `<path d="${d}Z" fill="${c}" ${s(2)}/>`;
  };
  const body = `
  <ellipse cx="24" cy="40" rx="20" ry="7" fill="#8C6CC0" ${s(2)}/>
  ${star(24, 22, 16, '#C7A8FF')}
  ${star(10, 34, 8, TURQ)}
  ${star(38, 33, 7, '#FFF1C1')}
  <circle cx="20" cy="18" r="3" fill="#FFFFFF"/>`;
  return { width: 48, height: 50, body };
}

/** Sarcofago piccolo per la pila da aprire nella Lobby. */
export function sarcophagusIconSvg() {
  const body = `
  <path d="M40 4 C18 4 10 18 10 36 L14 70 Q18 98 28 106 L52 106 Q62 98 66 70 L70 36 C70 18 62 4 40 4 Z" fill="${GOLD}" ${s(3)}/>
  <path d="M22 30 Q40 6 58 30 L60 56 L52 56 L52 36 Q40 26 28 36 L28 56 L20 56 Z" fill="${TURQ}" ${s(2.2)}/>
  <path d="M28 36 Q40 28 52 36 L52 54 Q40 66 28 54 Z" fill="#FFE59A" ${s(2.2)}/>
  <circle cx="35" cy="44" r="3" fill="${LINE}"/><circle cx="46" cy="44" r="3" fill="${LINE}"/>
  <path d="M34 52 Q40 56 47 51" fill="none" stroke="${LINE}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M20 66 Q40 80 60 66" fill="none" stroke="${LAPIS}" stroke-width="5"/>
  <path d="M34 84 H46 M34 92 H46" stroke="#9E640B" stroke-width="3"/>`;
  return { width: 80, height: 110, body };
}

/** Icona del Cammino delle Coppe: strada di sabbia con due torce e una coppa in fondo. */
export function trophyRoadIconSvg() {
  const body = `
  <rect x="2" y="2" width="96" height="96" rx="20" fill="${LAPIS}" ${s(3)}/>
  <path d="M30 96 Q40 60 48 30 L54 30 Q62 60 72 96 Z" fill="${css(PALETTE.sabbia)}" ${s(2.2)}/>
  <path d="M50 40 v6 M51 56 v8 M52 74 v10" stroke="#C99A4B" stroke-width="3" stroke-linecap="round"/>
  <path d="M18 92 V58 M84 92 V58" stroke="#8A5A2B" stroke-width="5" stroke-linecap="round"/>
  <path d="M18 58 Q12 48 18 40 Q24 48 18 58 Z M84 58 Q78 48 84 40 Q90 48 84 58 Z" fill="#FF9F1C" stroke="${LINE}" stroke-width="2"/>
  <path d="M40 12 L62 12 Q62 26 51 30 Q40 26 40 12 Z" fill="${GOLD}" ${s(2.2)}/>`;
  return { width: 100, height: 100, body };
}

/** Icone a geroglifico per la barra in basso. Tutte 72x72. */
export function navIconSvg(kind: 'personaggi' | 'sarcofagi' | 'coppe' | 'club' | 'impostazioni') {
  const ink = LINE;
  const st = `stroke="${ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const glyph: Record<typeof kind, string> = {
    // figura seduta (geroglifico "persona")
    personaggi: `<circle cx="36" cy="16" r="8" fill="${GOLD}" stroke="${ink}" stroke-width="4"/>
      <path d="M36 26 L34 46 L50 46 L52 62 M34 46 L22 62 M36 32 L50 36" ${st}/>`,
    sarcofagi: `<path d="M36 6 C22 6 18 16 18 28 L21 50 Q24 64 30 68 L42 68 Q48 64 51 50 L54 28 C54 16 50 6 36 6 Z" fill="${GOLD}" stroke="${ink}" stroke-width="4"/>
      <path d="M28 30 Q36 22 44 30 L44 42 Q36 50 28 42 Z" fill="${TURQ}" stroke="${ink}" stroke-width="3"/>`,
    coppe: `<path d="M18 8 L54 8 Q54 36 36 42 Q18 36 18 8 Z" fill="${GOLD}" stroke="${ink}" stroke-width="4"/>
      <path d="M18 14 Q6 14 8 24 Q10 32 20 32 M54 14 Q66 14 64 24 Q62 32 52 32" ${st}/>
      <path d="M36 42 V54 M24 64 H48 L44 54 H28 Z" fill="${GOLD}" stroke="${ink}" stroke-width="4"/>`,
    // scudo con tre teste: un gruppo di amici
    club: `<path d="M36 6 L60 14 V34 Q60 56 36 66 Q12 56 12 34 V14 Z" fill="${TURQ}" stroke="${ink}" stroke-width="4"/>
      <circle cx="24" cy="32" r="6" fill="${GOLD}" stroke="${ink}" stroke-width="3"/>
      <circle cx="48" cy="32" r="6" fill="${GOLD}" stroke="${ink}" stroke-width="3"/>
      <circle cx="36" cy="27" r="7" fill="${GOLD}" stroke="${ink}" stroke-width="3"/>
      <path d="M16 50 Q24 38 32 46 M40 46 Q48 38 56 50 M26 50 Q36 34 46 50" ${st}/>`,
    // ruota del sole con raggi (le impostazioni)
    impostazioni: `<path d="M36 6 V16 M36 56 V66 M6 36 H16 M56 36 H66 M15 15 L22 22 M50 50 L57 57 M57 15 L50 22 M22 50 L15 57" ${st}/>
      <circle cx="36" cy="36" r="17" fill="${GOLD}" stroke="${ink}" stroke-width="4"/>
      <circle cx="36" cy="36" r="6" fill="${TURQ}" stroke="${ink}" stroke-width="3"/>`,
  };
  // tondo chiaro dietro, così il geroglifico si vede bene sulla barra scura
  const disc = `<circle cx="36" cy="36" r="34" fill="#E9D4A4" stroke="${GOLD}" stroke-width="3"/>`;
  return { width: 72, height: 72, body: disc + glyph[kind] };
}

/** Lucchetto piccolo (per le cose che arriveranno nei prossimi passi). */
export function lockSvg() {
  const body = `
  <path d="M10 18 V12 Q10 3 18 3 Q26 3 26 12 V18" fill="none" stroke="${LINE}" stroke-width="4"/>
  <rect x="5" y="17" width="26" height="20" rx="4" fill="${GOLD}" ${s(2.6)}/>
  <circle cx="18" cy="26" r="3" fill="${LINE}"/>`;
  return { width: 36, height: 40, body };
}

/** Stellina del cielo notturno. */
export function skyStarSvg() {
  const body = `<path d="M6 0 L7.4 4.6 L12 6 L7.4 7.4 L6 12 L4.6 7.4 L0 6 L4.6 4.6 Z" fill="#FFFFFF"/>`;
  return { width: 12, height: 12, body };
}

/** Sole o luna: un disco con un alone morbido (si colora con la tinta). */
export function skyDiscSvg() {
  const body = `<defs><radialGradient id="a"><stop offset="0.35" stop-color="#FFFFFF"/><stop offset="0.42" stop-color="#FFFFFF" stop-opacity="0.45"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient></defs>
  <circle cx="100" cy="100" r="100" fill="url(#a)"/>`;
  return { width: 200, height: 200, body };
}
