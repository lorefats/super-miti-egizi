import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, TURQ, backArm, collar, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

const SKIN: Tone = { light: '#F0BE8E', mid: '#CF8E5A', dark: '#8C5530' };
/** Vestito rosa (il colore che cambia per i bot). */
const DRESS: Tone = { light: '#FFC2D1', mid: '#FF8FAB', dark: '#B8476A' };
const WIG = '#1E2236';

/**
 * Hathor — dea della musica e della gioia: corna di mucca con il disco del sole in mezzo,
 * lunga parrucca nera, vestito rosa, il sistro (sonaglio sacro) nella mano.
 */
export function hathorSvg(variant: ColorVariant = 'base') {
  const d = variantTone(DRESS, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('vestito', d)}
    ${goldGrad()}
    <radialGradient id="sole" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#FFB38A"/><stop offset="0.6" stop-color="#E63946"/><stop offset="1" stop-color="#8E1B24"/>
    </radialGradient>
    <linearGradient id="corna" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFF6E0"/><stop offset="1" stop-color="#CDBB92"/>
    </linearGradient>
  </defs>

  <!-- corna di mucca a lira con il disco del sole -->
  <path d="M42 30 Q28 22 32 4 Q36 16 48 24 Z" fill="url(#corna)" ${S}/>
  <path d="M76 30 Q90 22 86 4 Q82 16 70 24 Z" fill="url(#corna)" ${S}/>
  <circle cx="59" cy="16" r="13" fill="url(#sole)" ${S}/>
  <path d="M53 10 Q57 7 61 8" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
  <!-- cobra d'oro davanti al disco -->
  <path d="M59 30 Q55 24 59 21 Q63 24 59 30 Z" fill="url(#oro)" ${S}/>

  <!-- capelli lunghi dietro le spalle -->
  <path d="M38 40 Q32 64 38 84 L52 82 Q48 62 52 44 Z" fill="${WIG}" ${S}/>

  ${backArm('url(#pelle)')}

  <!-- vestito lungo rosa, aderente -->
  <path d="M42 100 L76 100 L84 130 L34 130 Z" fill="url(#vestito)" ${S}/>
  <path d="M50 104 L46 128 M68 104 L72 128" stroke="${d.dark}" stroke-width="1.4" opacity="0.6"/>
  <path d="M40 70 Q58 64 78 70 L74 104 L44 104 Z" fill="url(#vestito)" ${S}/>
  <path d="M44 100 L74 100" stroke="${GOLD}" stroke-width="3"/>
  ${collar}

  <!-- collo -->
  <path d="M54 56 L52 70 L64 70 L64 56 Z" fill="url(#pelle)" ${S}/>

  <!-- braccio davanti alzato con il sistro -->
  <path d="M72 72 Q84 74 88 62 L94 66 Q90 82 74 84 Z" fill="url(#pelle)" ${S}/>
  <ellipse cx="92" cy="62" rx="6" ry="6.5" fill="url(#pelle)" ${S}/>
  <path d="M92 58 L92 48" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
  <path d="M92 58 L92 48" stroke="url(#oro)" stroke-width="3" stroke-linecap="round"/>
  <path d="M84 48 Q84 30 92 28 Q100 30 100 48 Z" fill="none" stroke="${LINE}" stroke-width="5.5"/>
  <path d="M84 48 Q84 30 92 28 Q100 30 100 48 Z" fill="none" stroke="url(#oro)" stroke-width="3"/>
  <path d="M85 36 L99 36 M84.5 42 L99.5 42" stroke="${LINE}" stroke-width="1.8"/>
  <circle cx="88" cy="36" r="2" fill="${TURQ}" stroke="${LINE}" stroke-width="1"/>
  <circle cx="96" cy="42" r="2" fill="${TURQ}" stroke="${LINE}" stroke-width="1"/>
  <rect x="80" y="70" width="7" height="9" rx="2" transform="rotate(-20 83 74)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- parrucca nera con la fascia d'oro -->
  <path d="M40 46 Q36 26 58 25 Q72 25 75 33 L66 35 L64 56 Q55 62 44 58 Q38 54 40 46 Z" fill="${WIG}" ${S}/>
  <path d="M45 34 L45 56 M51 31 L51 59" stroke="#3A4060" stroke-width="1.6"/>
  <!-- volto di profilo -->
  <path d="M63 31 Q74 29 77 38 L80 44 L77 46 Q79 52 75 54 Q72 59 65 58 L61 56 Z" fill="url(#pelle)" ${S}/>
  <!-- sorriso felice e guancia rosa -->
  <path d="M75 51 Q72 55 68 53" fill="none" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="69" cy="48" r="3" fill="#FF8FAB" opacity="0.6"/>
  <!-- occhio col trucco e ciglia -->
  <path d="M68 40 Q72 37 76 40 Q72 42 68 40 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="72.5" cy="39.9" r="1.6" fill="${LINE}"/>
  <path d="M68 40 L61 41" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M70 37 L69 34 M73 36.5 L73 33.5 M76 37.5 L77 34.5" stroke="${LINE}" stroke-width="1.2"/>
  <path d="M40 33 Q57 25 74 31" fill="none" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
  <path d="M40 33 Q57 25 74 31" fill="none" stroke="url(#oro)" stroke-width="3" stroke-linecap="round"/>
  <!-- orecchino -->
  <circle cx="58" cy="58" r="3.5" fill="url(#oro)" stroke="${LINE}" stroke-width="1.3"/>
  `;
  return { width: 112, height: 160, body };
}

export const hathorLegSvg = () => legSvg(SKIN, '#C9B48A');
