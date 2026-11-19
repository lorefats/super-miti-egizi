import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, collar, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

/** Corpo di ippopotamo (il colore che cambia per i bot). */
const HIPPO: Tone = { light: '#C7A27A', mid: '#8D6E3F', dark: '#4E3A1C' };
const CROC: Tone = { light: '#8FD18A', mid: '#3E9B4F', dark: '#1D5428' };
const MANE: Tone = { light: '#F7C77E', mid: '#D9963F', dark: '#8C5A1E' };

/** Ammit — divoratrice dei cuori: testa di coccodrillo, criniera di leone, pancione da ippopotamo. Buffa e paurosa. */
export function ammitSvg(variant: ColorVariant = 'base') {
  const h = variantTone(HIPPO, variant);
  const body = `
  <defs>
    ${grad('ippo', h)}
    ${grad('cocco', CROC)}
    ${grad('criniera', MANE)}
    ${goldGrad()}
  </defs>

  ${backArm('url(#ippo)', true)}

  <!-- pancione tondo da ippopotamo -->
  <path d="M30 76 Q26 104 40 124 L80 124 Q94 104 88 76 Q60 62 30 76 Z" fill="url(#ippo)" ${S}/>
  <path d="M44 92 Q60 116 78 92" fill="none" stroke="${h.light}" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="62" cy="104" rx="3" ry="2" fill="${h.dark}"/>
  ${collar}

  <!-- criniera di leone attorno al collo -->
  <path d="M34 52 Q26 40 36 30 Q40 20 52 22 Q62 14 72 22 Q82 22 82 34 Q90 44 82 54 Q84 66 72 70 Q60 76 48 70 Q34 68 34 52 Z" fill="url(#criniera)" ${S}/>
  <path d="M38 40 L32 38 M36 54 L28 56 M44 66 L40 72 M78 64 L84 70" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>

  <!-- braccio tozzo davanti -->
  <path d="M76 76 Q92 82 96 94 L86 100 Q80 90 72 86 Z" fill="url(#ippo)" ${S}/>
  <ellipse cx="91" cy="97" rx="8" ry="7.5" fill="url(#ippo)" ${S}/>
  <rect x="80" y="86" width="8" height="10" rx="2" transform="rotate(-40 84 91)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- testa di coccodrillo con il muso lungo e i dentoni -->
  <path d="M50 36 Q58 26 70 30 L104 38 Q110 42 106 46 L72 50 Q56 52 50 44 Z" fill="url(#cocco)" ${S}/>
  <path d="M70 50 L104 48 Q106 54 100 56 L70 58 Q58 58 54 50 Z" fill="url(#cocco)" ${S}/>
  <path d="M76 49 L78 53 L80 49 L82 53 L84 49 L86 53 L88 49 L90 53 L92 49 L94 53 L96 49" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round"/>
  <ellipse cx="102" cy="40" rx="2.5" ry="1.6" fill="${LINE}"/>
  <!-- occhio grande e un po' matto -->
  <circle cx="64" cy="33" r="6" fill="#FFF3B0" stroke="${LINE}" stroke-width="1.8"/>
  <circle cx="66" cy="33" r="2.6" fill="${LINE}"/>
  <path d="M58 28 Q64 24 70 28" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
  <path d="M74 40 Q86 38 96 40" fill="none" stroke="${CROC.light}" stroke-width="2" stroke-linecap="round"/>
  <circle cx="60" cy="58" r="3" fill="${GOLD}" stroke="${LINE}" stroke-width="1.2"/>
  `;
  return { width: 112, height: 160, body };
}

export const ammitLegSvg = () => legSvg(HIPPO, '#4E3A1C');
