import type { ColorVariant } from '../palette';
import { LINE, S, backArm, belt, collar, frontArm, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

const SKIN: Tone = { light: '#EBB386', mid: '#C68552', dark: '#7F4E29' };
/** Mantello azzurro luna (il colore che cambia per i bot). */
const ROBE: Tone = { light: '#EEF2FF', mid: '#BFC8E8', dark: '#6A76A8' };

/** Khonsu — dio della luna, giovane: la treccia della giovinezza, sulla testa il disco e la falce di luna. */
export function khonsuSvg(variant: ColorVariant = 'base') {
  const r = variantTone(ROBE, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('veste', r)}
    ${goldGrad()}
    <radialGradient id="luna" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.7" stop-color="#DDE3F5"/><stop offset="1" stop-color="#9AA6CF"/>
    </radialGradient>
  </defs>

  <!-- luna piena dentro la falce -->
  <path d="M42 22 Q44 38 58 38 Q72 38 74 22 Q66 32 58 32 Q50 32 42 22 Z" fill="url(#oro)" ${S}/>
  <circle cx="58" cy="17" r="12" fill="url(#luna)" ${S}/>
  <circle cx="54" cy="14" r="2.5" fill="#C4CCE6"/><circle cx="62" cy="20" r="1.8" fill="#C4CCE6"/>

  <!-- treccia della giovinezza che scende di lato -->
  <path d="M46 44 Q36 52 40 70 Q44 76 46 70 Q42 56 50 48 Z" fill="#1E2236" ${S}/>

  ${backArm('url(#pelle)')}

  <!-- veste lunga argentata -->
  <path d="M42 100 L76 100 L82 130 L36 130 Z" fill="url(#veste)" ${S}/>
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#veste)" ${S}/>
  <path d="M50 106 L46 128 M68 106 L72 128" stroke="${r.dark}" stroke-width="1.4"/>
  ${belt()}
  ${collar}
  <path d="M54 56 L52 70 L64 70 L64 56 Z" fill="url(#pelle)" ${S}/>

  ${frontArm('url(#pelle)')}

  <!-- testa rasata del ragazzo -->
  <path d="M44 48 Q42 36 54 36 L66 36 Q74 38 77 44 L80 48 L77 50 Q78 55 74 57 Q70 61 64 60 Q48 60 44 48 Z" fill="url(#pelle)" ${S}/>
  <path d="M74 56 Q71 57 69 56" fill="none" stroke="${LINE}" stroke-width="1.3"/>
  <path d="M66 45 Q70 42 74 45 Q70 47 66 45 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="70.5" cy="44.9" r="1.5" fill="${LINE}"/>
  <path d="M66 45 L60 46" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M55 46 Q51 50 55 53" fill="none" stroke="${LINE}" stroke-width="1.5"/>
  `;
  return { width: 112, height: 160, body };
}

export const khonsuLegSvg = () => legSvg(SKIN, '#9AA6CF');
