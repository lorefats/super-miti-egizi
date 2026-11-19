import type { ColorVariant } from '../palette';
import { LINE, S, backArm, belt, collar, frontArm, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

/** Pelle nera e viola (il colore che cambia per i bot). */
const SKIN: Tone = { light: '#8C6BC2', mid: '#3D2A66', dark: '#140A26' };

/** Kek — dio dell'oscurità: testa di rana, pelle nera e viola, grandi occhi gialli. */
export function kekSvg(variant: ColorVariant = 'base') {
  const k = variantTone(SKIN, variant);
  const body = `
  <defs>
    ${grad('pelle', k)}
    ${goldGrad()}
  </defs>

  ${backArm('url(#pelle)')}

  <!-- gonnellino scuro con le stelline -->
  <path d="M42 102 L76 102 L82 124 L36 124 Z" fill="#1B1236" ${S}/>
  <circle cx="50" cy="112" r="1.6" fill="#FFF3B0"/><circle cx="66" cy="116" r="1.6" fill="#FFF3B0"/><circle cx="58" cy="108" r="1.2" fill="#FFF3B0"/>
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#pelle)" ${S}/>
  <path d="M48 80 Q56 76 64 82 M46 92 Q54 88 62 94" fill="none" stroke="${k.light}" stroke-width="2" opacity="0.6"/>
  ${belt()}
  ${collar}
  <path d="M53 56 L51 70 L64 70 L64 56 Z" fill="url(#pelle)" ${S}/>

  ${frontArm('url(#pelle)')}

  <!-- testa di rana larga e piatta -->
  <path d="M42 50 Q40 36 54 34 Q70 32 84 40 Q90 46 86 52 Q76 60 60 60 Q46 60 42 50 Z" fill="url(#pelle)" ${S}/>
  <path d="M86 50 Q72 56 58 54" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
  <!-- due occhi gialli sporgenti sulla testa -->
  <circle cx="58" cy="32" r="8" fill="url(#pelle)" ${S}/>
  <circle cx="74" cy="34" r="8" fill="url(#pelle)" ${S}/>
  <circle cx="58" cy="31" r="5.5" fill="#FFD60A" stroke="${LINE}" stroke-width="1.4"/>
  <circle cx="74" cy="33" r="5.5" fill="#FFD60A" stroke="${LINE}" stroke-width="1.4"/>
  <ellipse cx="59" cy="31" rx="1.6" ry="3.6" fill="${LINE}"/>
  <ellipse cx="75" cy="33" rx="1.6" ry="3.6" fill="${LINE}"/>
  <circle cx="82" cy="44" r="1.2" fill="${LINE}"/>
  `;
  return { width: 112, height: 160, body };
}

export const kekLegSvg = () => legSvg(SKIN, '#1B1236');
