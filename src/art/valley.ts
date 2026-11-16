// Disegni della mappa "Valle dei Due Egitti" (vedi GAME_DESIGN.md, sezione 3).
// Ogni oggetto ha la base (dove tocca terra) in fondo al disegno, salvo terreni e tappeti.
import { PALETTE, css } from './palette';

const L = css(PALETTE.bluNotte);
const GOLD = css(PALETTE.oro);
const LAPIS = css(PALETTE.lapislazzuli);
const TURQ = css(PALETTE.turchese);
const RED = css(PALETTE.rossoDeserto);
const s = (w = 3) => `stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const shadow = (cx: number, cy: number, rx: number, ry: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#14213D" opacity="0.22"/>`;

type Art = { width: number; height: number; body: string };

/** Numeri "a caso" ma sempre uguali, per i disegni ripetuti. */
function seeded(seed: number) {
  return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
}

// ---------------------------------------------------------------- terreni

/** Terreno ripetibile: colore di base + macchie e segni. */
function groundTile(base: string, marks: string, size = 256): Art {
  return { width: size, height: size, body: `<rect width="${size}" height="${size}" fill="${base}"/>${marks}` };
}

export function rockGroundSvg(): Art {
  const r = seeded(3);
  let m = '';
  for (let i = 0; i < 18; i++) {
    const x = r() * 256;
    const y = r() * 256;
    const w = 6 + r() * 16;
    m += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${w.toFixed(0)}" ry="${(w * 0.55).toFixed(0)}" fill="${r() < 0.5 ? '#B98E5E' : '#A87C4E'}" opacity="0.7"/>`;
  }
  for (let i = 0; i < 6; i++) {
    const x = r() * 256;
    const y = r() * 256;
    m += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l${(10 + r() * 20).toFixed(0)} ${(4 + r() * 6).toFixed(0)} l${(6 + r() * 10).toFixed(0)} -${(6 + r() * 6).toFixed(0)}" fill="none" stroke="#8E6A40" stroke-width="2" opacity="0.6"/>`;
  }
  return groundTile('#C9A06A', m);
}

export function pavedGroundSvg(): Art {
  let m = '';
  for (let y = 0; y < 256; y += 64) {
    const off = (y / 64) % 2 === 0 ? 0 : 48;
    m += `<line x1="0" y1="${y}" x2="256" y2="${y}" stroke="#B9A57C" stroke-width="3"/>`;
    for (let x = off; x < 256 + 96; x += 96) m += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 64}" stroke="#B9A57C" stroke-width="3"/>`;
  }
  m += `<circle cx="40" cy="30" r="3" fill="#C4B088"/><circle cx="170" cy="110" r="3" fill="#C4B088"/><circle cx="100" cy="200" r="2.5" fill="#C4B088"/>`;
  return groundTile('#E2D2AB', m);
}

export function asphaltGroundSvg(): Art {
  const r = seeded(9);
  let m = '';
  for (let i = 0; i < 40; i++) m += `<circle cx="${(r() * 256).toFixed(0)}" cy="${(r() * 256).toFixed(0)}" r="${(1 + r() * 1.5).toFixed(1)}" fill="${r() < 0.5 ? '#8F8A80' : '#B4AEA2'}"/>`;
  m += `<rect x="0" y="0" width="256" height="10" fill="#BDB6A6"/><rect x="0" y="0" width="10" height="256" fill="#BDB6A6"/>`;
  return groundTile('#A49D90', m);
}

export function bazaarGroundSvg(): Art {
  let m = '';
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 32) {
      const k = (x / 32 + y / 32) % 2 === 0;
      m += `<rect x="${x + 1}" y="${y + 1}" width="30" height="30" fill="${k ? '#D9A066' : '#CF9157'}"/>`;
    }
  }
  m += `<path d="M0 128 H256 M128 0 V256" stroke="#B5763F" stroke-width="2"/>`;
  return groundTile('#C2844C', m);
}

export function grassGroundSvg(): Art {
  const r = seeded(21);
  let m = '';
  for (let i = 0; i < 30; i++) {
    const x = r() * 256;
    const y = r() * 256;
    m += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-3 -8 M${x.toFixed(0)} ${y.toFixed(0)} l1 -10 M${x.toFixed(0)} ${y.toFixed(0)} l5 -7" stroke="${r() < 0.5 ? '#3E8E41' : '#5DB060'}" stroke-width="2" stroke-linecap="round"/>`;
  }
  return groundTile('#8DBB5A', m);
}

export function oasisGroundSvg(): Art {
  const r = seeded(33);
  let m = '';
  for (let i = 0; i < 9; i++) {
    const x = r() * 256;
    const y = r() * 256;
    m += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-4 -9 M${x.toFixed(0)} ${y.toFixed(0)} l0 -11 M${x.toFixed(0)} ${y.toFixed(0)} l5 -8" stroke="#6FA34A" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 16; i++) m += `<circle cx="${(r() * 256).toFixed(0)}" cy="${(r() * 256).toFixed(0)}" r="1.8" fill="#C9A35A"/>`;
  return groundTile('#E6C46E', m);
}

export function waterSvg(): Art {
  let m = '';
  for (let i = 0; i < 6; i++) {
    const y = 20 + i * 42;
    const x = (i * 57) % 200;
    m += `<path d="M${x} ${y} q12 -8 24 0 t24 0" fill="none" stroke="#7FD6C9" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
    m += `<path d="M${(x + 120) % 256} ${y + 18} q10 -6 20 0" fill="none" stroke="#1D6F6A" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`;
  }
  return groundTile(css(PALETTE.acquaNilo), m);
}

// ---------------------------------------------------------------- Piana di Giza

export function sphinxSvg(): Art {
  const body = `
  ${shadow(200, 196, 180, 14)}
  <path d="M120 120 Q130 70 210 74 L330 80 Q366 84 366 130 L366 186 L120 186 Z" fill="#D9AE6C" ${s()}/>
  <path d="M330 80 Q372 70 376 120 L376 186 L362 186 Z" fill="#C2924F" ${s()}/>
  <path d="M40 170 L130 170 L130 192 L36 192 Q28 182 40 170 Z" fill="#D9AE6C" ${s()}/>
  <path d="M40 150 L130 150 L130 172 L36 172 Q28 162 40 150 Z" fill="#E3BC7C" ${s()}/>
  <path d="M44 160 H52 M44 182 H52" stroke="#9C7040" stroke-width="2"/>
  <path d="M96 40 Q98 12 128 10 Q160 12 162 40 L166 120 L92 120 Z" fill="${LAPIS}" ${s()}/>
  <path d="M98 50 H160 M96 66 H162 M94 82 H164 M93 98 H165" stroke="${GOLD}" stroke-width="5"/>
  <path d="M108 40 Q108 22 128 22 Q148 22 148 40 L148 88 Q128 104 108 88 Z" fill="#E3BC7C" ${s()}/>
  <path d="M114 50 L124 50 M132 50 L142 50" stroke="${L}" stroke-width="3" stroke-linecap="round"/>
  <path d="M125 58 L128 70 L131 58" fill="none" stroke="#9C7040" stroke-width="2"/>
  <path d="M120 80 Q128 84 136 80" fill="none" stroke="#9C7040" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M126 104 L128 124 L130 104" fill="${LAPIS}" ${s(2)}/>
  <path d="M190 110 Q230 100 300 112 M200 140 Q250 132 320 140" stroke="#B88A4E" stroke-width="3" fill="none"/>`;
  return { width: 384, height: 204, body };
}

// ---------------------------------------------------------------- Tempio di Karnak

export function columnSvg(): Art {
  const body = `
  ${shadow(40, 262, 36, 8)}
  <rect x="10" y="236" width="60" height="26" rx="3" fill="#D8C49A" ${s()}/>
  <rect x="18" y="64" width="44" height="176" fill="#E6D3A6" ${s()}/>
  <rect x="18" y="64" width="12" height="176" fill="#F4E6C2"/>
  <rect x="18" y="96" width="44" height="10" fill="${LAPIS}"/>
  <rect x="18" y="110" width="44" height="6" fill="${RED}"/>
  <rect x="18" y="200" width="44" height="10" fill="${TURQ}"/>
  <path d="M28 130 V190 M40 126 V194 M52 130 V190" stroke="#B49B6A" stroke-width="2" stroke-dasharray="6 5"/>
  <path d="M18 64 L4 30 Q40 14 76 30 L62 64 Z" fill="#8DBB5A" ${s()}/>
  <path d="M12 34 L24 62 M28 26 L34 62 M52 26 L46 62 M68 34 L56 62" stroke="#5E8E3A" stroke-width="2"/>
  <rect x="2" y="16" width="76" height="16" rx="2" fill="#E6D3A6" ${s()}/>
  <rect x="18" y="64" width="44" height="176" fill="none" ${s()}/>`;
  return { width: 80, height: 272, body };
}

export function obeliskSvg(): Art {
  const body = `
  ${shadow(36, 316, 34, 8)}
  <rect x="6" y="290" width="60" height="26" rx="2" fill="#D8C49A" ${s()}/>
  <path d="M20 50 L52 50 L58 292 L14 292 Z" fill="#E3B977" ${s()}/>
  <path d="M20 50 L28 50 L26 292 L14 292 Z" fill="#F1CF94"/>
  <path d="M20 50 L36 14 L52 50 Z" fill="${GOLD}" ${s()}/>
  <path d="M28 40 L36 20 L40 30" fill="none" stroke="#FFF1C1" stroke-width="2"/>
  <path d="M30 80 h12 M32 96 a5 5 0 1 0 8 0 M30 120 l6 10 l6 -10 M30 150 h12 v10 h-12 Z M32 180 q4 -8 8 0 M30 210 h12 M31 238 l5 8 l5 -8 M30 262 h12"
    fill="none" stroke="#A0703C" stroke-width="2.5"/>
  <path d="M20 50 L52 50 L58 292 L14 292 Z" fill="none" ${s()}/>`;
  return { width: 72, height: 324, body };
}

export function statueSvg(): Art {
  const body = `
  ${shadow(70, 226, 64, 10)}
  <rect x="14" y="120" width="112" height="106" rx="4" fill="#C7A877" ${s()}/>
  <path d="M20 140 H120 M20 210 H120" stroke="#A88A5A" stroke-width="2"/>
  <path d="M38 132 L102 132 L108 196 L32 196 Z" fill="#E3C793" ${s()}/>
  <rect x="34" y="150" width="20" height="58" rx="4" fill="#E3C793" ${s()}/>
  <rect x="86" y="150" width="20" height="58" rx="4" fill="#E3C793" ${s()}/>
  <path d="M46 70 L94 70 L100 136 L40 136 Z" fill="#E3C793" ${s()}/>
  <path d="M44 120 Q70 132 96 120" fill="none" stroke="${GOLD}" stroke-width="5"/>
  <path d="M44 34 Q46 8 70 6 Q94 8 96 34 L102 92 L38 92 Z" fill="${LAPIS}" ${s()}/>
  <path d="M42 44 H98 M40 58 H100 M39 72 H101 M38 86 H102" stroke="${GOLD}" stroke-width="4"/>
  <path d="M54 32 Q54 18 70 18 Q86 18 86 32 L86 64 Q70 76 54 64 Z" fill="#E3C793" ${s()}/>
  <path d="M60 38 H66 M74 38 H80" stroke="${L}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M66 74 L70 92 L74 74" fill="${LAPIS}" ${s(2)}/>`;
  return { width: 140, height: 234, body };
}

/** Pezzo di muro del tempio (orizzontale), con incisioni. */
export function templeWallSvg(): Art {
  const body = `
  ${shadow(130, 126, 128, 7)}
  <rect x="4" y="10" width="252" height="36" rx="3" fill="#EADBB5" ${s()}/>
  <rect x="4" y="44" width="252" height="76" rx="3" fill="#CDB487" ${s()}/>
  <path d="M10 52 H250" stroke="#E2CFA2" stroke-width="3"/>
  <path d="M30 70 h14 v30 h-14 Z M70 66 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M78 74 v26 M120 100 l10 -30 l10 30 M170 70 h20 M170 84 h20 M170 98 h20 M216 72 q8 -10 16 0 v26 h-16 Z"
    fill="none" stroke="#9C7F52" stroke-width="2.5"/>
  <rect x="4" y="10" width="252" height="8" fill="${LAPIS}" opacity="0.85"/>`;
  return { width: 260, height: 132, body };
}

/** Blocco quadrato del tempio (per i muri verticali, uno sopra l'altro). */
export function templeBlockSvg(): Art {
  const body = `
  <rect x="4" y="4" width="56" height="44" rx="3" fill="#EADBB5" ${s()}/>
  <rect x="4" y="44" width="56" height="34" rx="3" fill="#CDB487" ${s()}/>
  <path d="M10 48 H54" stroke="#E2CFA2" stroke-width="3"/>`;
  return { width: 64, height: 82, body };
}

// ---------------------------------------------------------------- Valle dei Re

export function cliffTombSvg(): Art {
  const body = `
  ${shadow(160, 226, 156, 9)}
  <path d="M6 222 L14 90 Q30 40 80 30 L140 14 Q200 8 250 24 Q300 40 312 100 L316 222 Z" fill="#C98F55" ${s()}/>
  <path d="M20 120 Q100 104 300 118 M16 170 Q120 156 310 168" stroke="#A86F3A" stroke-width="4" fill="none"/>
  <path d="M60 40 Q120 24 190 26" stroke="#E2AE74" stroke-width="5" fill="none" stroke-linecap="round"/>
  <rect x="118" y="100" width="84" height="16" fill="#E9D3A0" ${s()}/>
  <path d="M126 102 H194" stroke="${LAPIS}" stroke-width="4"/>
  <rect x="126" y="116" width="68" height="106" fill="#24170F" ${s()}/>
  <path d="M126 222 L194 222 L204 212 L116 212 Z M120 206 L200 206" fill="#B3804A" stroke="${L}" stroke-width="2"/>
  <path d="M140 128 V200" stroke="#3E2A1A" stroke-width="5"/>`;
  return { width: 320, height: 232, body };
}

export function boulderSvg(): Art {
  const body = `
  ${shadow(62, 84, 56, 8)}
  <path d="M10 80 Q4 40 34 22 Q60 6 92 22 Q118 40 112 80 Z" fill="#B98A57" ${s()}/>
  <path d="M30 32 Q50 20 70 24" stroke="#D9AA74" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M70 50 L82 66 M40 56 L50 70" stroke="#8E643A" stroke-width="3"/>`;
  return { width: 124, height: 92, body };
}

export function torchStandSvg(): Art {
  const body = `
  ${shadow(20, 112, 16, 5)}
  <path d="M16 112 L18 40 H22 L24 112 Z" fill="#5A3A1E" ${s(2)}/>
  <path d="M6 36 Q20 50 34 36 Z" fill="${GOLD}" ${s(2)}/>
  <path d="M20 4 Q32 20 28 34 H12 Q8 20 20 4 Z" fill="#FF9F1C" stroke="#C1440E" stroke-width="2"/>
  <path d="M20 16 Q25 24 22 32 H18 Q15 24 20 16 Z" fill="#FFE66D"/>`;
  return { width: 40, height: 118, body };
}

// ---------------------------------------------------------------- Rive del Nilo

/** Canne di papiro: un cespuglio dove nascondersi. */
export function papyrusSvg(): Art {
  const r = seeded(5);
  let stalks = '';
  for (let i = 0; i < 11; i++) {
    const x = 20 + r() * 110;
    const top = 18 + r() * 50;
    const lean = (r() - 0.5) * 30;
    stalks += `<path d="M${x.toFixed(0)} 150 Q${(x + lean / 2).toFixed(0)} ${((150 + top) / 2).toFixed(0)} ${(x + lean).toFixed(0)} ${top.toFixed(0)}" stroke="#2E7D32" stroke-width="4" fill="none"/>`;
    stalks += `<path d="M${(x + lean).toFixed(0)} ${top.toFixed(0)} l-14 -10 M${(x + lean).toFixed(0)} ${top.toFixed(0)} l-6 -16 M${(x + lean).toFixed(0)} ${top.toFixed(0)} l2 -17 M${(x + lean).toFixed(0)} ${top.toFixed(0)} l10 -14 M${(x + lean).toFixed(0)} ${top.toFixed(0)} l15 -6" stroke="#7CC46A" stroke-width="3" stroke-linecap="round"/>`;
  }
  const body = `
  ${shadow(75, 150, 70, 10)}
  <path d="M10 150 Q20 110 40 120 Q60 100 75 116 Q95 98 110 120 Q130 108 140 150 Z" fill="#3E8E41" ${s(2.5)}/>
  ${stalks}`;
  return { width: 150, height: 160, body };
}

export function feluccaSvg(): Art {
  const body = `
  <ellipse cx="120" cy="214" rx="110" ry="12" fill="#1D6F6A" opacity="0.5"/>
  <path d="M14 180 Q120 236 228 180 L214 206 Q120 236 28 206 Z" fill="#8E5A2E" ${s()}/>
  <path d="M20 182 Q120 222 222 182" stroke="#B57A45" stroke-width="4" fill="none"/>
  <path d="M120 186 L124 20" stroke="#5A3A1E" stroke-width="5"/>
  <path d="M124 20 L50 176 L200 176 Z" fill="#FBF6EA" ${s()}/>
  <path d="M124 20 L90 176" stroke="#D9CBB0" stroke-width="2"/>
  <path d="M124 22 L210 60" stroke="#5A3A1E" stroke-width="3"/>`;
  return { width: 240, height: 230, body };
}

// ---------------------------------------------------------------- Bazar del Cairo

/** Bancarella con merci e tendone a strisce. */
export function stallSvg(variant: number): Art {
  const colors = [
    [RED, '#FFF1C1'],
    [TURQ, '#FFF1C1'],
    [GOLD, LAPIS],
  ][variant % 3];
  let stripes = '';
  for (let i = 0; i < 7; i++) stripes += `<path d="M${14 + i * 26} 30 l26 0 l-4 34 l-26 0 Z" fill="${i % 2 === 0 ? colors[0] : colors[1]}"/>`;
  const body = `
  ${shadow(105, 174, 100, 9)}
  <path d="M20 64 V174 M190 64 V174" stroke="#5A3A1E" stroke-width="6"/>
  <rect x="14" y="110" width="182" height="64" rx="3" fill="#A86B3C" ${s()}/>
  <path d="M18 128 H192 M18 150 H192" stroke="#7A4A26" stroke-width="2"/>
  <path d="M30 110 Q44 86 58 110 Z" fill="#E4572E" ${s(2)}/>
  <path d="M66 110 Q80 90 94 110 Z" fill="${GOLD}" ${s(2)}/>
  <path d="M102 110 Q116 84 130 110 Z" fill="#6A994E" ${s(2)}/>
  <rect x="140" y="88" width="18" height="22" rx="6" fill="${TURQ}" ${s(2)}/>
  <rect x="164" y="92" width="16" height="18" rx="5" fill="#C1440E" ${s(2)}/>
  <path d="M10 30 L200 30 L194 64 L16 64 Z" fill="${colors[0]}"/>
  ${stripes}
  <path d="M10 30 L200 30 L194 64 L16 64 Z" fill="none" ${s()}/>
  <path d="M16 64 q13 10 26 0 q13 10 26 0 q13 10 26 0 q13 10 26 0 q13 10 26 0 q13 10 26 0 q13 10 26 0" fill="none" ${s(2.5)}/>`;
  return { width: 210, height: 182, body };
}

/** Tenda colorata del bazar: un cespuglio dove nascondersi. */
export function tentSvg(): Art {
  const body = `
  ${shadow(85, 146, 80, 9)}
  <path d="M8 146 L40 50 L85 18 L130 50 L162 146 Z" fill="#B23A48" ${s()}/>
  <path d="M40 50 L85 18 L130 50 L120 146 L50 146 Z" fill="#E4572E"/>
  <path d="M60 146 L85 40 L110 146" fill="${GOLD}"/>
  <path d="M85 40 L72 146 M85 40 L98 146" stroke="#B97A12" stroke-width="2"/>
  <path d="M8 146 L40 50 L85 18 L130 50 L162 146 Z" fill="none" ${s()}/>
  <path d="M24 100 H146" stroke="${TURQ}" stroke-width="6"/>
  <path d="M85 18 V4" stroke="#5A3A1E" stroke-width="4"/>
  <path d="M85 4 L104 10 L85 16 Z" fill="${TURQ}" ${s(2)}/>`;
  return { width: 170, height: 156, body };
}

export function lanternPostSvg(): Art {
  const body = `
  ${shadow(22, 170, 16, 5)}
  <path d="M19 170 L20 40 H24 L25 170 Z" fill="#6B4A2A" ${s(2)}/>
  <path d="M22 42 Q40 30 36 52" fill="none" stroke="#6B4A2A" stroke-width="4"/>
  <path d="M28 52 L44 52 L40 82 L32 82 Z" fill="#FFD27A" ${s(2)}/>
  <path d="M26 52 L46 52 L36 40 Z" fill="${GOLD}" ${s(2)}/>
  <path d="M30 82 H42 L36 92 Z" fill="${GOLD}" ${s(2)}/>
  <path d="M33 60 V76 M39 60 V76" stroke="#E4572E" stroke-width="2"/>`;
  return { width: 50, height: 176, body };
}

export function carpetSvg(variant: number): Art {
  const c = [
    [RED, GOLD, LAPIS],
    [LAPIS, TURQ, GOLD],
    ['#6A994E', GOLD, RED],
  ][variant % 3];
  const body = `
  <rect x="6" y="6" width="158" height="84" rx="4" fill="${c[0]}" ${s(2.5)}/>
  <rect x="16" y="16" width="138" height="64" rx="2" fill="none" stroke="${c[1]}" stroke-width="5"/>
  <path d="M85 26 L110 48 L85 70 L60 48 Z" fill="${c[2]}" stroke="${c[1]}" stroke-width="3"/>
  <path d="M6 20 h-4 M6 36 h-4 M6 52 h-4 M6 68 h-4 M164 20 h4 M164 36 h4 M164 52 h4 M164 68 h4" stroke="#FBF6EA" stroke-width="2"/>`;
  return { width: 170, height: 96, body };
}

export function cartSvg(): Art {
  const body = `
  ${shadow(76, 110, 70, 7)}
  <rect x="20" y="40" width="112" height="44" rx="4" fill="#A86B3C" ${s()}/>
  <path d="M24 56 H128 M24 70 H128" stroke="#7A4A26" stroke-width="2"/>
  <path d="M132 64 L150 58" stroke="#5A3A1E" stroke-width="5" stroke-linecap="round"/>
  <path d="M30 40 Q40 14 62 22 Q72 8 92 22 Q110 14 120 40 Z" fill="#E9D3A0" ${s(2.5)}/>
  <path d="M60 24 Q64 34 60 40 M92 24 Q88 34 92 40" stroke="#C9B183" stroke-width="2" fill="none"/>
  <circle cx="44" cy="90" r="16" fill="#6B4A2A" ${s()}/>
  <circle cx="108" cy="90" r="16" fill="#6B4A2A" ${s()}/>
  <path d="M44 76 V104 M30 90 H58 M108 76 V104 M94 90 H122" stroke="#B57A45" stroke-width="3"/>`;
  return { width: 156, height: 116, body };
}

// ---------------------------------------------------------------- Cairo moderno

/** Palazzo moderno in 2.5D: tetto (con cisterne e antenna) e facciata con finestre. */
export function buildingSvg(variant: number): Art {
  const colors = [
    ['#E8C9A0', '#D2AD7E', '#F3DEC0'],
    ['#E6B8A2', '#CC9A84', '#F2D3C4'],
    ['#D9D2B8', '#BFB696', '#ECE6D2'],
  ][variant % 3];
  const floors = 5 + (variant % 2);
  const top = 360 - 110 - floors * 46;
  let windows = '';
  for (let f = 0; f < floors; f++) {
    for (let w = 0; w < 5; w++) {
      const x = 24 + w * 44;
      const y = top + 110 + 12 + f * 46;
      windows += `<rect x="${x}" y="${y}" width="28" height="26" rx="2" fill="${(f + w + variant) % 4 === 0 ? '#FFE8A3' : '#5E7EA6'}" ${s(2)}/>`;
      if ((f + w) % 3 === 1) windows += `<rect x="${x - 2}" y="${y + 24}" width="32" height="5" fill="#8C8578" stroke="${L}" stroke-width="1.5"/>`;
    }
  }
  const body = `
  ${shadow(130, 352, 128, 9)}
  <rect x="6" y="${top}" width="248" height="112" rx="3" fill="${colors[2]}" ${s()}/>
  <rect x="30" y="${top + 20}" width="40" height="30" rx="4" fill="#C9CED6" ${s(2)}/>
  <rect x="80" y="${top + 26}" width="34" height="24" rx="4" fill="#C9CED6" ${s(2)}/>
  <path d="M200 ${top + 70} V${top + 10} M190 ${top + 24} H210 M194 ${top + 36} H206" stroke="${L}" stroke-width="3"/>
  <rect x="140" y="${top + 60}" width="44" height="30" fill="#BFB696" ${s(2)}/>
  <rect x="6" y="${top + 110}" width="248" height="${350 - top - 110}" fill="${colors[0]}" ${s()}/>
  <rect x="6" y="${top + 110}" width="20" height="${350 - top - 110}" fill="${colors[1]}" opacity="0.6"/>
  ${windows}
  <rect x="104" y="306" width="52" height="44" fill="#4A3B2C" ${s()}/>
  <rect x="96" y="300" width="68" height="8" fill="${colors[1]}" ${s(2)}/>`;
  return { width: 260, height: 360, body };
}

export function taxiSvg(): Art {
  let checks = '';
  for (let i = 0; i < 10; i++) checks += `<rect x="${18 + i * 12}" y="58" width="6" height="6" fill="${L}"/>`;
  const body = `
  ${shadow(76, 88, 72, 7)}
  <path d="M10 76 L12 50 Q16 42 30 40 L44 22 Q50 16 60 16 L104 16 Q114 16 120 24 L132 40 Q144 42 144 52 L144 76 Z" fill="#F4F4F0" ${s()}/>
  <path d="M50 26 L60 22 H100 L112 38 H44 Z" fill="#7FB7D9" ${s(2)}/>
  <path d="M78 22 V38" stroke="${L}" stroke-width="2.5"/>
  <rect x="64" y="8" width="28" height="9" rx="2" fill="${GOLD}" ${s(2)}/>
  ${checks}
  <rect x="12" y="66" width="132" height="10" fill="#2A2A2A" opacity="0.15"/>
  <circle cx="38" cy="78" r="12" fill="#2B2D42" ${s()}/>
  <circle cx="118" cy="78" r="12" fill="#2B2D42" ${s()}/>
  <circle cx="38" cy="78" r="4" fill="#C9CED6"/><circle cx="118" cy="78" r="4" fill="#C9CED6"/>
  <rect x="136" y="48" width="8" height="6" fill="#FFE66D" stroke="${L}" stroke-width="1.5"/>`;
  return { width: 156, height: 96, body };
}

export function streetLampSvg(): Art {
  const body = `
  ${shadow(18, 212, 14, 4)}
  <rect x="14" y="40" width="8" height="172" fill="#6E7682" ${s(2)}/>
  <path d="M18 44 Q20 14 52 18" fill="none" stroke="#6E7682" stroke-width="6"/>
  <path d="M18 44 Q20 14 52 18" fill="none" stroke="${L}" stroke-width="1.5"/>
  <path d="M42 18 H64 L58 28 H48 Z" fill="#FFE8A3" ${s(2)}/>
  <rect x="8" y="200" width="20" height="12" rx="2" fill="#5A626E" ${s(2)}/>`;
  return { width: 70, height: 218, body };
}

/** Torre alta al centro della città: fusto a rete che si stringe verso l'alto, terrazza e antenna. */
export function towerSvg(): Art {
  let lattice = '';
  for (let y = 150; y < 560; y += 26) {
    const k = (y - 150) / 410;
    const half = 30 + k * 26;
    lattice += `<path d="M${85 - half} ${y} L${85 + half} ${y + 26} M${85 + half} ${y} L${85 - half} ${y + 26}" stroke="#B4572C" stroke-width="2.5"/>`;
  }
  const body = `
  ${shadow(85, 592, 80, 10)}
  <path d="M55 150 L115 150 L141 586 L29 586 Z" fill="#D9774A" ${s()}/>
  ${lattice}
  <path d="M55 150 L115 150 L141 586 L29 586 Z" fill="none" ${s()}/>
  <rect x="20" y="560" width="130" height="30" rx="3" fill="#E8C9A0" ${s()}/>
  <path d="M30 100 L140 100 L128 150 L42 150 Z" fill="#E8C9A0" ${s()}/>
  <rect x="38" y="112" width="94" height="16" fill="#5E7EA6" ${s(2)}/>
  <path d="M24 100 Q85 70 146 100 Z" fill="${TURQ}" ${s()}/>
  <path d="M85 80 V8" stroke="${L}" stroke-width="5"/>
  <path d="M85 80 V8" stroke="#C9CED6" stroke-width="2.5"/>
  <circle cx="85" cy="8" r="5" fill="${RED}" ${s(2)}/>`;
  return { width: 170, height: 600, body };
}

// ---------------------------------------------------------------- Oasi del deserto

export function palmSvg(): Art {
  const fronds = [
    'M100 82 Q60 50 18 70 Q60 62 100 90',
    'M100 82 Q70 30 40 22 Q76 44 100 88',
    'M100 82 Q110 24 140 14 Q118 46 104 88',
    'M100 82 Q150 50 176 70 Q140 64 104 92',
    'M100 84 Q140 96 160 130 Q130 104 102 94',
    'M100 84 Q60 98 44 134 Q70 106 100 94',
  ];
  const body = `
  ${shadow(92, 286, 40, 8)}
  <path d="M84 286 Q78 200 96 86 L106 88 Q92 200 100 286 Z" fill="#9C6B3A" ${s()}/>
  <path d="M84 250 H100 M83 220 H99 M84 190 H99 M86 160 H101 M89 130 H102 M92 104 H104" stroke="#6E4A26" stroke-width="2.5"/>
  ${fronds.map((d) => `<path d="${d} Z" fill="#4CAF50" ${s(2.5)}/>`).join('')}
  <path d="M100 84 Q70 50 30 66 M100 84 Q120 36 138 20 M100 84 Q140 58 170 70" stroke="#2E7D32" stroke-width="2" fill="none"/>
  <circle cx="94" cy="96" r="6" fill="#E07A1F" ${s(2)}/><circle cx="106" cy="98" r="6" fill="#C1440E" ${s(2)}/><circle cx="100" cy="106" r="6" fill="#E07A1F" ${s(2)}/>`;
  return { width: 190, height: 294, body };
}

export function wellSvg(): Art {
  const body = `
  ${shadow(60, 112, 56, 7)}
  <path d="M14 30 V100 M106 30 V100" stroke="#6B4A2A" stroke-width="6"/>
  <path d="M8 26 L60 6 L112 26 Z" fill="#A86B3C" ${s()}/>
  <path d="M60 30 V58" stroke="#5A3A1E" stroke-width="2"/>
  <rect x="52" y="56" width="16" height="14" rx="2" fill="#8E5A2E" ${s(2)}/>
  <ellipse cx="60" cy="74" rx="50" ry="16" fill="#1D6F6A" ${s()}/>
  <path d="M10 74 L10 100 Q60 122 110 100 L110 74 Q60 92 10 74 Z" fill="#CDB487" ${s()}/>
  <path d="M30 88 V108 M60 92 V112 M90 88 V108" stroke="#A88A5A" stroke-width="2"/>`;
  return { width: 120, height: 120, body };
}

export function duneSvg(): Art {
  const body = `
  <path d="M4 104 Q70 20 150 30 Q220 40 276 104 Z" fill="#E2B964"/>
  <path d="M60 64 Q120 30 170 40" stroke="#F4D88A" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M150 30 Q200 60 276 104 L200 104 Q190 60 150 30 Z" fill="#CFA14E" opacity="0.7"/>`;
  return { width: 280, height: 110, body };
}

export function camelSvg(): Art {
  const body = `
  ${shadow(86, 136, 70, 7)}
  <path d="M40 130 L44 84 M58 130 L60 86 M112 130 L110 86 M128 130 L126 84" stroke="#B5844B" stroke-width="8" stroke-linecap="round"/>
  <path d="M40 130 L44 84 M58 130 L60 86 M112 130 L110 86 M128 130 L126 84" stroke="${L}" stroke-width="1.5" fill="none"/>
  <path d="M30 90 Q26 60 50 54 Q70 20 92 52 Q112 30 130 56 Q150 64 140 92 Z" fill="#D9A766" ${s()}/>
  <path d="M136 70 Q154 58 150 34 Q148 16 160 12 Q172 12 170 24 L164 30 Q162 58 146 80 Z" fill="#D9A766" ${s()}/>
  <circle cx="162" cy="20" r="2.2" fill="${L}"/>
  <path d="M70 46 Q92 36 112 46 L110 62 Q92 56 72 62 Z" fill="${RED}" ${s(2)}/>
  <path d="M74 54 H108" stroke="${GOLD}" stroke-width="3"/>
  <path d="M30 80 Q16 86 18 104" stroke="#B5844B" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  return { width: 176, height: 142, body };
}
