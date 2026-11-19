import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, TURQ, LAPIS, backArm, collar, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

const SKIN: Tone = { light: '#EFB98A', mid: '#CC8B57', dark: '#87522C' };
/** Vestito viola (il colore che cambia per i bot). */
const DRESS: Tone = { light: '#CBA6F7', mid: '#9B5DE5', dark: '#542A8C' };
const WIG = '#1E2236';

/** Iside — grande maga: ali colorate sulle braccia, il trono (il suo geroglifico) sulla testa. */
export function isideSvg(variant: ColorVariant = 'base') {
  const d = variantTone(DRESS, variant);
  const feathers = [d.mid, TURQ, GOLD, LAPIS, '#E63946'];
  // ala dietro, aperta verso il basso a sinistra
  const backWing = feathers
    .map((c, i) => `<path d="M42 74 Q${20 - i * 3} ${82 + i * 7} ${6 + i * 2} ${96 + i * 8} Q${24 + i * 2} ${92 + i * 6} 44 ${82 + i * 4} Z" fill="${c}" ${S}/>`)
    .join('');
  // ala davanti, sul braccio teso in avanti
  const frontWing = feathers
    .map((c, i) => `<path d="M74 74 Q${92 + i * 2} ${80 + i * 6} ${104 - i} ${92 + i * 7} Q${88 + i} ${90 + i * 5} 72 ${84 + i * 3} Z" fill="${c}" ${S}/>`)
    .join('');
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('vestito', d)}
    ${goldGrad()}
  </defs>

  <!-- il trono sulla testa -->
  <path d="M50 22 L50 4 L58 4 L58 14 L70 14 L70 22 Z" fill="url(#oro)" ${S}/>
  <path d="M53 8 L55 8 M53 12 L55 12" stroke="${LINE}" stroke-width="1.5"/>

  <!-- capelli lunghi dietro -->
  <path d="M38 40 Q32 64 38 84 L52 82 Q48 62 52 44 Z" fill="${WIG}" ${S}/>

  ${backWing}
  ${backArm('url(#pelle)')}

  <!-- vestito lungo -->
  <path d="M42 100 L76 100 L84 130 L34 130 Z" fill="url(#vestito)" ${S}/>
  <path d="M40 70 Q58 64 78 70 L74 104 L44 104 Z" fill="url(#vestito)" ${S}/>
  <path d="M44 100 L74 100" stroke="${GOLD}" stroke-width="3"/>
  <path d="M59 104 L59 128" stroke="${d.dark}" stroke-width="1.5"/>
  ${collar}

  <path d="M54 56 L52 70 L64 70 L64 56 Z" fill="url(#pelle)" ${S}/>

  ${frontWing}
  <path d="M72 72 Q86 80 92 90 L86 96 Q78 88 70 82 Z" fill="url(#pelle)" ${S}/>
  <ellipse cx="89" cy="93" rx="6" ry="7" fill="url(#pelle)" ${S}/>

  <!-- parrucca nera con la fascia d'oro -->
  <path d="M40 46 Q36 26 58 25 Q72 25 75 33 L66 35 L64 56 Q55 62 44 58 Q38 54 40 46 Z" fill="${WIG}" ${S}/>
  <path d="M45 34 L45 56 M51 31 L51 59" stroke="#3A4060" stroke-width="1.6"/>
  <path d="M63 31 Q74 29 77 38 L80 44 L77 46 Q79 52 75 54 Q72 59 65 58 L61 56 Z" fill="url(#pelle)" ${S}/>
  <path d="M75 52 Q72 54 69 53" fill="none" stroke="${LINE}" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M68 40 Q72 37 76 40 Q72 42 68 40 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="72.5" cy="39.9" r="1.6" fill="${LINE}"/>
  <path d="M68 40 L61 41" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M40 33 Q57 25 74 31" fill="none" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
  <path d="M40 33 Q57 25 74 31" fill="none" stroke="url(#oro)" stroke-width="3" stroke-linecap="round"/>
  <circle cx="58" cy="58" r="3.5" fill="${TURQ}" stroke="${LINE}" stroke-width="1.3"/>
  `;
  return { width: 112, height: 160, body };
}

export const isideLegSvg = () => legSvg(SKIN, '#C9B48A');
