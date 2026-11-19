import type { ColorVariant } from '../palette';
import { LINE, S, backArm, collar, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

/** Corpo blu del cielo (il colore che cambia per i bot). */
const SKY: Tone = { light: '#6C7FE0', mid: '#2B2F9E', dark: '#140F4A' };

/** Stelline sparse sul corpo. */
function stars(points: [number, number][]): string {
  return points
    .map(([x, y]) => `<path d="M${x} ${y - 3} L${x + 1} ${y - 1} L${x + 3} ${y} L${x + 1} ${y + 1} L${x} ${y + 3} L${x - 1} ${y + 1} L${x - 3} ${y} L${x - 1} ${y - 1} Z" fill="#FFF3B0"/>`)
    .join('');
}

/** Nut — dea del cielo: corpo blu pieno di stelle, un vaso (il suo geroglifico) sulla testa. */
export function nutSvg(variant: ColorVariant = 'base') {
  const k = variantTone(SKY, variant);
  const body = `
  <defs>
    ${grad('cielo', k)}
    ${goldGrad()}
  </defs>

  <!-- vaso sulla testa -->
  <path d="M52 8 L64 8 L62 13 Q70 16 68 24 L48 24 Q46 16 54 13 Z" fill="url(#oro)" ${S}/>

  <!-- capelli neri lunghi -->
  <path d="M38 40 Q32 64 38 84 L52 82 Q48 62 52 44 Z" fill="#0B0A26" ${S}/>

  ${backArm('url(#cielo)')}

  <!-- vestito-cielo lungo -->
  <path d="M42 100 L76 100 L84 130 L34 130 Z" fill="url(#cielo)" ${S}/>
  <path d="M40 70 Q58 64 78 70 L74 104 L44 104 Z" fill="url(#cielo)" ${S}/>
  ${collar}
  <path d="M54 56 L52 70 L64 70 L64 56 Z" fill="url(#cielo)" ${S}/>
  ${stars([[48, 110], [66, 116], [56, 124], [74, 108], [50, 90], [66, 94], [44, 120]])}

  <!-- braccio davanti alzato verso il cielo -->
  <path d="M72 72 Q84 70 88 56 L95 60 Q92 78 74 84 Z" fill="url(#cielo)" ${S}/>
  <ellipse cx="92" cy="56" rx="6" ry="6.5" fill="url(#cielo)" ${S}/>
  ${stars([[84, 70], [90, 62]])}

  <!-- parrucca e volto blu -->
  <path d="M40 46 Q36 26 58 25 Q72 25 75 33 L66 35 L64 56 Q55 62 44 58 Q38 54 40 46 Z" fill="#0B0A26" ${S}/>
  <path d="M63 31 Q74 29 77 38 L80 44 L77 46 Q79 52 75 54 Q72 59 65 58 L61 56 Z" fill="url(#cielo)" ${S}/>
  <path d="M75 51 Q72 54 68 52" fill="none" stroke="#FFF3B0" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M68 40 Q72 37 76 40 Q72 42 68 40 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="72.5" cy="39.9" r="1.6" fill="${LINE}"/>
  <path d="M68 40 L61 41" stroke="#FFF3B0" stroke-width="1.8" stroke-linecap="round"/>
  ${stars([[70, 33], [66, 50]])}
  <path d="M40 33 Q57 25 74 31" fill="none" stroke="url(#oro)" stroke-width="3" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const nutLegSvg = () => legSvg(SKY, '#C9B48A');
