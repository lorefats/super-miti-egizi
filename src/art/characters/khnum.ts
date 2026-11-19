import type { ColorVariant } from '../palette';
import { LINE, S, backArm, belt, collar, frontArm, goldGrad, grad, legSvg, linenGrad, variantTone, type Tone } from './common';

const SKIN: Tone = { light: '#E0A673', mid: '#B5763F', dark: '#6E4220' };
/** Pelo di ariete. */
const WOOL: Tone = { light: '#F3E6CF', mid: '#D6C09A', dark: '#8F7754' };
/** Grembiule da vasaio color argilla (il colore che cambia per i bot). */
const CLAY: Tone = { light: '#E8A26A', mid: '#B5651D', dark: '#6B3410' };

/** Khnum — dio vasaio: testa di ariete con le corna ondulate di lato, grembiule sporco d'argilla. */
export function khnumSvg(variant: ColorVariant = 'base') {
  const c = variantTone(CLAY, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('lana', WOOL)}
    ${grad('argilla', c)}
    ${goldGrad()}
    ${linenGrad()}
    <linearGradient id="corno" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFF1D0"/><stop offset="1" stop-color="#B89B6A"/>
    </linearGradient>
  </defs>

  <!-- corna ondulate che vanno di lato (dietro) -->
  <path d="M50 30 Q40 22 30 28 Q22 22 12 28 Q18 32 24 30 Q32 36 42 32 Q46 36 52 36 Z" fill="url(#corno)" ${S}/>
  <path d="M28 27 L26 31 M38 29 L36 33" stroke="#9C7F4E" stroke-width="1.5"/>

  ${backArm('url(#pelle)')}

  <!-- gonnellino bianco e grembiule d'argilla -->
  <path d="M42 102 L76 102 L82 124 L36 124 Z" fill="url(#lino)" ${S}/>
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#pelle)" ${S}/>
  <path d="M46 82 L74 82 L78 122 L44 122 Z" fill="url(#argilla)" ${S}/>
  <!-- schizzi d'argilla -->
  <circle cx="52" cy="96" r="2.5" fill="${c.dark}"/>
  <circle cx="68" cy="110" r="3" fill="${c.dark}"/>
  <circle cx="60" cy="88" r="1.8" fill="${c.light}"/>
  ${belt()}
  ${collar}

  <!-- collo -->
  <path d="M53 56 L51 70 L64 70 L64 56 Z" fill="url(#lana)" ${S}/>

  ${frontArm('url(#pelle)')}
  <rect x="80" y="84" width="7" height="10" rx="2" transform="rotate(-40 83 89)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- testa di ariete: muso lungo e arrotondato -->
  <path d="M46 46 Q44 26 62 26 Q74 26 80 38 L86 48 Q86 56 78 58 L64 60 Q48 58 46 46 Z" fill="url(#lana)" ${S}/>
  <path d="M80 50 Q83 52 85 50" fill="none" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="82" cy="46" r="1.2" fill="${LINE}"/>
  <!-- riccioli di lana sulla fronte -->
  <path d="M50 30 Q53 26 57 29 Q60 25 64 28 Q67 25 70 29" fill="none" stroke="${WOOL.dark}" stroke-width="2" stroke-linecap="round"/>
  <!-- orecchio pendente -->
  <path d="M54 40 Q44 44 46 52 Q52 50 56 44 Z" fill="url(#lana)" ${S}/>
  <!-- occhio -->
  <path d="M66 39 Q70 36 74 39 Q70 41 66 39 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="70.5" cy="38.9" r="1.5" fill="${LINE}"/>
  <path d="M65 35 Q70 33 75 35" fill="none" stroke="${LINE}" stroke-width="1.6"/>
  <!-- corno davanti: spirale ondulata verso l'avanti -->
  <path d="M58 34 Q66 30 74 34 Q84 28 94 34 Q88 38 82 36 Q74 42 64 38 Z" fill="url(#corno)" ${S}/>
  <path d="M74 33 L72 37 M84 32 L83 36" stroke="#9C7F4E" stroke-width="1.5"/>
  <!-- barba divina -->
  <path d="M66 59 Q68 67 72 72 Q65 71 62 60 Z" fill="#3A2A1A" ${S}/>
  `;
  return { width: 112, height: 160, body };
}

export const khnumLegSvg = () => legSvg(SKIN, '#8A5A2B');
