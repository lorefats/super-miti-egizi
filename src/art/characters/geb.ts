import type { ColorVariant } from '../palette';
import { LINE, S, backArm, belt, collar, frontArm, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

/** Pelle verde-marrone come la terra coltivata. */
const SKIN: Tone = { light: '#A8B86A', mid: '#6B8F3A', dark: '#3A5220' };
/** Gonnellino color terra (il colore che cambia per i bot). */
const KILT: Tone = { light: '#D9B98A', mid: '#9C6B3C', dark: '#5A3A1A' };

/** Geb — dio della terra: grande e robusto, pelle verde-marrone, un'oca bianca seduta sulla testa. */
export function gebSvg(variant: ColorVariant = 'base') {
  const k = variantTone(KILT, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('gonna', k)}
    ${goldGrad()}
    <linearGradient id="oca" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9CED8"/>
    </linearGradient>
  </defs>

  <!-- l'oca seduta sulla testa -->
  <path d="M42 26 Q40 12 56 12 Q66 12 70 18 L68 26 Z" fill="url(#oca)" ${S}/>
  <path d="M46 20 Q54 16 62 20" fill="none" stroke="#AEB4C0" stroke-width="1.6"/>
  <path d="M42 22 Q36 18 34 24 Q38 26 42 26 Z" fill="url(#oca)" ${S}/>
  <path d="M66 18 Q68 4 76 4 Q82 5 80 11 L76 12 Q72 10 72 18 Z" fill="url(#oca)" ${S}/>
  <path d="M80 7 L88 9 L80 11 Z" fill="#F4A261" ${S}/>
  <circle cx="77" cy="7" r="1.4" fill="${LINE}"/>

  ${backArm('url(#pelle)', true)}

  <!-- gonnellino corto color terra -->
  <path d="M40 102 L78 102 L84 124 L34 124 Z" fill="url(#gonna)" ${S}/>
  <path d="M46 106 L42 122 M55 106 L54 123 M64 106 L65 123 M72 106 L76 122" stroke="${k.dark}" stroke-width="1.5"/>

  <!-- busto largo e muscoloso -->
  <path d="M34 70 Q58 58 84 70 L78 104 L40 104 Z" fill="url(#pelle)" ${S}/>
  <path d="M50 86 Q58 90 66 86" fill="none" stroke="${SKIN.dark}" stroke-width="1.6"/>
  <!-- macchie di terra e un germoglio sulla spalla -->
  <ellipse cx="46" cy="94" rx="4" ry="2.5" fill="${SKIN.dark}" opacity="0.5"/>
  <ellipse cx="72" cy="90" rx="3" ry="2" fill="${SKIN.dark}" opacity="0.5"/>
  ${belt()}
  ${collar}

  <!-- collo grosso -->
  <path d="M50 54 L48 70 L66 70 L66 54 Z" fill="url(#pelle)" ${S}/>

  ${frontArm('url(#pelle)', true)}
  <!-- pugno di roccia -->
  <path d="M82 86 L92 84 L97 92 L93 101 L83 100 L80 93 Z" fill="#9AA0AA" ${S}/>
  <path d="M86 89 L92 91 M85 95 L91 96" stroke="#5D6475" stroke-width="1.5"/>

  <!-- capelli e barba scuri -->
  <path d="M40 46 Q38 26 58 26 Q72 26 74 34 L66 36 L64 54 Q54 60 44 56 Q38 52 40 46 Z" fill="#2E2A22" ${S}/>
  <!-- volto di profilo, naso largo -->
  <path d="M62 32 Q74 30 77 38 L82 45 L77 48 Q79 53 75 55 Q72 59 66 59 L60 56 Z" fill="url(#pelle)" ${S}/>
  <path d="M75 55 Q72 56 70 55" fill="none" stroke="${LINE}" stroke-width="1.3"/>
  <!-- barba lunga -->
  <path d="M66 58 Q68 68 74 74 Q64 73 60 60 Z" fill="#2E2A22" ${S}/>
  <!-- sopracciglio folto e occhio -->
  <path d="M66 39 Q71 36 76 39 Q71 41 66 39 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="71.5" cy="38.9" r="1.5" fill="${LINE}"/>
  <path d="M65 35 Q71 31 78 35" fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const gebLegSvg = () => legSvg(SKIN, '#6B4C20');
