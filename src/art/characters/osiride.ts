import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, collar, goldGrad, grad, legSvg, linenGrad, variantTone, type Tone } from './common';

/** Pelle verde: il segno di Osiride (non cambia per i bot). */
const SKIN: Tone = { light: '#9FDB8A', mid: '#4CAF50', dark: '#22632A' };
/** Strisce delle bende e piume della corona (il colore che cambia per i bot). */
const ACCENT: Tone = { light: '#8FE3DA', mid: '#2EC4B6', dark: '#16716A' };

/**
 * Osiride — re dell'aldilà: pelle verde, alta corona bianca con due piume, corpo avvolto nelle bende,
 * pastorale e flagello incrociati sul petto.
 */
export function osirideSvg(variant: ColorVariant = 'base') {
  const a = variantTone(ACCENT, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('accento', a)}
    ${goldGrad()}
    ${linenGrad()}
    <linearGradient id="corona" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D6DCE6"/>
    </linearGradient>
  </defs>

  <!-- piume ai lati della corona -->
  <path d="M44 34 Q36 18 40 4 Q48 14 50 32 Z" fill="url(#accento)" ${S}/>
  <path d="M76 34 Q84 18 80 4 Q72 14 70 32 Z" fill="url(#accento)" ${S}/>
  <!-- corona bianca alta a bulbo -->
  <path d="M48 36 Q46 20 54 8 Q60 0 66 8 Q74 20 72 36 Z" fill="url(#corona)" ${S}/>
  <circle cx="60" cy="5" r="4" fill="url(#oro)" ${S}/>
  <path d="M52 30 Q60 26 68 30" fill="none" stroke="#B8C0CE" stroke-width="1.6"/>

  ${backArm('url(#pelle)')}

  <!-- corpo avvolto nelle bende (fino ai piedi) -->
  <path d="M40 100 L78 100 L82 130 L36 130 Z" fill="url(#lino)" ${S}/>
  <path d="M38 108 L80 112 M37 117 L81 121 M37 125 L81 128" stroke="#CBBE9F" stroke-width="1.6"/>
  <path d="M55 102 L63 102 L64 129 L54 129 Z" fill="url(#accento)" ${S}/>
  <path d="M38 70 Q58 62 80 70 L76 104 L42 104 Z" fill="url(#lino)" ${S}/>
  <path d="M42 84 L77 80 M43 94 L76 91" stroke="#CBBE9F" stroke-width="1.6"/>
  ${collar}

  <!-- collo verde -->
  <path d="M53 56 L51 70 L64 70 L64 56 Z" fill="url(#pelle)" ${S}/>

  <!-- pastorale (bastone ricurvo) e flagello incrociati sul petto -->
  <path d="M46 102 L72 64 Q76 58 71 55 Q66 53 65 58" fill="none" stroke="${LINE}" stroke-width="6" stroke-linecap="round"/>
  <path d="M46 102 L72 64 Q76 58 71 55 Q66 53 65 58" fill="none" stroke="url(#oro)" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M48 70 L74 100" stroke="${LINE}" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M48 70 L74 100" stroke="${a.mid}" stroke-width="3" stroke-linecap="round"/>
  <path d="M48 70 Q40 66 36 72 M48 70 Q42 62 36 64 M48 70 Q44 60 40 58" fill="none" stroke="${LINE}" stroke-width="2.6" stroke-linecap="round"/>
  <!-- braccia incrociate verdi che li tengono -->
  <path d="M74 72 Q80 86 62 92 L58 86 Q68 82 68 76 Z" fill="url(#pelle)" ${S}/>
  <rect x="62" y="84" width="7" height="9" rx="2" transform="rotate(-30 65 88)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- volto verde di profilo -->
  <path d="M50 34 L72 34 Q76 36 78 42 L82 47 L78 49 Q80 54 76 56 Q73 60 66 60 Q54 60 50 52 Z" fill="url(#pelle)" ${S}/>
  <path d="M76 56 Q73 57 71 56" fill="none" stroke="${LINE}" stroke-width="1.3"/>
  <!-- barba divina dorata -->
  <path d="M68 59 Q70 67 74 72 Q67 71 64 61 Z" fill="url(#oro)" ${S}/>
  <path d="M67 63 L70 63 M68 67 L71 67" stroke="#A86A0C" stroke-width="1.2"/>
  <!-- occhio col trucco -->
  <path d="M68 42 Q72 39 76 42 Q72 44 68 42 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="72.5" cy="41.9" r="1.5" fill="${LINE}"/>
  <path d="M68 42 L62 43" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M67 38 Q72 36 77 38" fill="none" stroke="${LINE}" stroke-width="1.6"/>
  <!-- orecchio -->
  <path d="M56 42 Q52 46 56 50" fill="none" stroke="${LINE}" stroke-width="1.6"/>
  <path d="M48 36 L72 36" stroke="${GOLD}" stroke-width="3"/>
  `;
  return { width: 112, height: 160, body };
}

export const osirideLegSvg = () => legSvg({ light: '#F5F1E6', mid: '#E2D9C2', dark: '#B9AC8C' }, '#C9B48A');
