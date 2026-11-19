import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, TURQ, backArm, goldGrad, grad, legSvg, linenGrad, variantTone, type Tone } from './common';

const SKIN: Tone = { light: '#9FCB8F', mid: '#588157', dark: '#2C4A2B' };
/** Berretto aderente blu (il colore che cambia per i bot). */
const CAP: Tone = { light: '#6C8BE8', mid: '#2D4FB8', dark: '#162A66' };

/** Ptah — dio costruttore: pelle verde, berretto blu aderente, veste stretta, lo scettro e il martello. */
export function ptahSvg(variant: ColorVariant = 'base') {
  const c = variantTone(CAP, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('berretto', c)}
    ${goldGrad()}
    ${linenGrad()}
  </defs>

  ${backArm('url(#lino)', true)}

  <!-- veste stretta bianca da mummia, fino ai piedi -->
  <path d="M38 100 L80 100 L82 130 L36 130 Z" fill="url(#lino)" ${S}/>
  <path d="M38 110 L80 112 M37 120 L81 122" stroke="#CBBE9F" stroke-width="1.6"/>
  <path d="M34 70 Q58 60 84 70 L80 104 L38 104 Z" fill="url(#lino)" ${S}/>
  <path d="M40 86 L78 82" stroke="#CBBE9F" stroke-width="1.6"/>
  <!-- collare largo -->
  <path d="M36 70 Q59 98 82 70 Q59 78 36 70 Z" fill="url(#oro)" ${S}/>
  <path d="M42 75 Q59 91 76 75" fill="none" stroke="${TURQ}" stroke-width="3"/>
  <!-- contrappeso del collare dietro la schiena -->
  <path d="M36 72 L30 92 L36 92 L40 74 Z" fill="url(#oro)" ${S}/>

  <path d="M52 54 L50 70 L66 70 L66 54 Z" fill="url(#pelle)" ${S}/>

  <!-- mani verdi che tengono lo scettro (pilastro djed + ankh) -->
  <path d="M60 128 L60 52" stroke="${LINE}" stroke-width="7" stroke-linecap="round"/>
  <path d="M60 128 L60 52" stroke="url(#oro)" stroke-width="4" stroke-linecap="round"/>
  <path d="M54 62 L66 62 M54 67 L66 67 M54 72 L66 72" stroke="${LINE}" stroke-width="2.4"/>
  <path d="M56 50 Q52 42 60 40 Q68 42 64 50 Z" fill="none" stroke="${LINE}" stroke-width="5"/>
  <path d="M56 50 Q52 42 60 40 Q68 42 64 50 Z" fill="none" stroke="${GOLD}" stroke-width="2.6"/>
  <path d="M62 86 Q70 84 72 92 Q66 98 58 94 Q54 88 62 86 Z" fill="url(#pelle)" ${S}/>
  <path d="M62 98 Q70 96 72 104 Q66 110 58 106 Q54 100 62 98 Z" fill="url(#pelle)" ${S}/>

  <!-- volto verde di profilo -->
  <path d="M48 36 L70 34 Q76 36 78 42 L82 47 L78 49 Q80 54 76 56 Q73 60 66 60 Q52 60 48 50 Z" fill="url(#pelle)" ${S}/>
  <!-- barba dritta -->
  <path d="M68 59 L70 72 L76 72 L74 58 Z" fill="${LINE}" ${S}/>
  <path d="M69 63 L75 63 M70 67 L75 67" stroke="#3A4060" stroke-width="1.2"/>
  <path d="M68 42 Q72 39 76 42 Q72 44 68 42 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="72.5" cy="41.9" r="1.5" fill="${LINE}"/>
  <path d="M68 42 L62 43" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
  <!-- berretto blu aderente -->
  <path d="M44 46 Q40 22 60 21 Q76 22 76 36 L48 38 Z" fill="url(#berretto)" ${S}/>
  <path d="M50 28 Q56 24 62 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" opacity="0.5" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const ptahLegSvg = () => legSvg({ light: '#F5F1E6', mid: '#E2D9C2', dark: '#B9AC8C' }, '#C9B48A');
