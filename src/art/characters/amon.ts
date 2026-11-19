import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, belt, collar, frontArm, goldGrad, grad, legSvg, linenGrad, variantTone, type Tone } from './common';

/** Pelle blu (il colore che cambia per i bot). */
const SKIN: Tone = { light: '#6F8EE0', mid: '#1F3A93', dark: '#0E1C4A' };

/** Amon — il dio nascosto: pelle blu, corona con due piume altissime. */
export function amonSvg(variant: ColorVariant = 'base') {
  const k = variantTone(SKIN, variant);
  const body = `
  <defs>
    ${grad('pelle', k)}
    ${goldGrad()}
    ${linenGrad()}
    <linearGradient id="piume" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#C9851A"/>
    </linearGradient>
  </defs>

  <!-- due piume altissime -->
  <path d="M50 30 L46 2 Q52 -1 56 2 L58 30 Z" fill="url(#piume)" ${S}/>
  <path d="M60 30 L62 2 Q68 -1 72 2 L68 30 Z" fill="url(#piume)" ${S}/>
  <path d="M47 10 L56 10 M47 18 L57 18 M62 10 L70 10 M62 18 L69 18" stroke="#A86A0C" stroke-width="1.6"/>

  ${backArm('url(#pelle)')}

  <path d="M42 102 L76 102 L82 124 L36 124 Z" fill="url(#lino)" ${S}/>
  <path d="M55 104 L63 104 L65 123 L53 123 Z" fill="url(#oro)" ${S}/>
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#pelle)" ${S}/>
  <!-- bretella d'oro -->
  <path d="M42 72 L70 102" stroke="${LINE}" stroke-width="6"/>
  <path d="M42 72 L70 102" stroke="${GOLD}" stroke-width="3.5"/>
  ${belt()}
  ${collar}
  <path d="M53 56 L51 70 L64 70 L64 56 Z" fill="url(#pelle)" ${S}/>

  ${frontArm('url(#pelle)')}
  <rect x="80" y="84" width="7" height="10" rx="2" transform="rotate(-40 83 89)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- corona bassa rossa da cui partono le piume -->
  <path d="M44 38 Q44 26 58 26 Q72 26 72 38 Z" fill="#C0392B" ${S}/>
  <!-- volto blu di profilo -->
  <path d="M48 38 L72 36 Q76 38 78 44 L82 48 L78 50 Q80 55 76 57 Q73 61 66 60 Q52 60 48 50 Z" fill="url(#pelle)" ${S}/>
  <path d="M76 57 Q73 58 71 57" fill="none" stroke="${LINE}" stroke-width="1.3"/>
  <path d="M68 59 L70 70 L75 70 L73 58 Z" fill="${LINE}"/>
  <path d="M68 44 Q72 41 76 44 Q72 46 68 44 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="72.5" cy="43.9" r="1.5" fill="${LINE}"/>
  <path d="M68 44 L62 45" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
  <!-- sorrisetto misterioso -->
  <path d="M73 53 Q75 54 77 52" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const amonLegSvg = () => legSvg(SKIN, '#C9B48A');
