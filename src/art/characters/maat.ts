import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, TURQ, backArm, collar, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

const SKIN: Tone = { light: '#EFB98A', mid: '#CC8B57', dark: '#87522C' };
/** Vestito bianco perla con i riflessi (il colore che cambia per i bot). */
const DRESS: Tone = { light: '#FFFFFF', mid: '#F1FAEE', dark: '#B8C4BC' };

/** Maat — dea della giustizia: una piuma di struzzo sulla testa, la bilancia d'oro in mano. */
export function maatSvg(variant: ColorVariant = 'base') {
  const d = variantTone(DRESS, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('vestito', d)}
    ${goldGrad()}
    <linearGradient id="piuma" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9D3E0"/>
    </linearGradient>
  </defs>

  <!-- la piuma di struzzo, curva all'indietro -->
  <path d="M54 30 Q46 14 50 2 Q58 0 62 8 Q62 20 58 30 Z" fill="url(#piuma)" ${S}/>
  <path d="M56 28 Q54 16 55 4" fill="none" stroke="${LINE}" stroke-width="1.3"/>

  <path d="M38 40 Q32 64 38 84 L52 82 Q48 62 52 44 Z" fill="#1E2236" ${S}/>
  ${backArm('url(#pelle)')}

  <path d="M42 100 L76 100 L84 130 L34 130 Z" fill="url(#vestito)" ${S}/>
  <path d="M40 70 Q58 64 78 70 L74 104 L44 104 Z" fill="url(#vestito)" ${S}/>
  <path d="M44 100 L74 100" stroke="${GOLD}" stroke-width="3"/>
  <path d="M50 104 L46 128 M68 104 L72 128" stroke="${d.dark}" stroke-width="1.4"/>
  ${collar}
  <path d="M54 56 L52 70 L64 70 L64 56 Z" fill="url(#pelle)" ${S}/>

  <!-- braccio teso con la bilancia d'oro -->
  <path d="M72 72 Q86 76 92 72 L94 78 Q84 86 70 82 Z" fill="url(#pelle)" ${S}/>
  <ellipse cx="94" cy="75" rx="5.5" ry="6" fill="url(#pelle)" ${S}/>
  <path d="M94 70 L94 52 M82 54 L106 54" stroke="${LINE}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M94 70 L94 52 M82 54 L106 54" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M82 54 L78 64 L86 64 Z M106 54 L102 64 L110 64 Z" fill="none" stroke="${LINE}" stroke-width="1.2"/>
  <path d="M76 64 Q82 70 88 64 Z" fill="url(#oro)" stroke="${LINE}" stroke-width="1.6"/>
  <path d="M100 64 Q106 70 112 64 Z" fill="url(#oro)" stroke="${LINE}" stroke-width="1.6"/>

  <path d="M40 46 Q36 26 58 25 Q72 25 75 33 L66 35 L64 56 Q55 62 44 58 Q38 54 40 46 Z" fill="#1E2236" ${S}/>
  <path d="M63 31 Q74 29 77 38 L80 44 L77 46 Q79 52 75 54 Q72 59 65 58 L61 56 Z" fill="url(#pelle)" ${S}/>
  <path d="M75 51 Q72 53 69 52" fill="none" stroke="${LINE}" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M68 40 Q72 37 76 40 Q72 42 68 40 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="72.5" cy="39.9" r="1.6" fill="${LINE}"/>
  <path d="M68 40 L61 41" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
  <!-- fascia che tiene la piuma -->
  <path d="M40 33 Q57 25 74 31" fill="none" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
  <path d="M40 33 Q57 25 74 31" fill="none" stroke="${TURQ}" stroke-width="3" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const maatLegSvg = () => legSvg(SKIN, '#C9B48A');
