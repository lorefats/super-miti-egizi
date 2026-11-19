import type { ColorVariant } from '../palette';
import { LINE, S, backArm, collar, frontArm, goldGrad, grad, legSvg, linenGrad, variantTone, type Tone } from './common';

const SKIN: Tone = { light: '#E2AC78', mid: '#B97B48', dark: '#7A4A24' };
/** Fascia azzurro cielo che svolazza (il colore che cambia per i bot). */
const SASH: Tone = { light: '#DDF7F8', mid: '#8FD3D8', dark: '#3F8A90' };
const WIG = '#1E2236';

/** Shu — dio dell'aria: volto umano con la barba divina, una piuma sulla testa, vestiti bianchi svolazzanti. */
export function shuSvg(variant: ColorVariant = 'base') {
  const sash = variantTone(SASH, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('fascia', sash)}
    ${goldGrad()}
    ${linenGrad()}
    <linearGradient id="piuma" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9D3E0"/>
    </linearGradient>
  </defs>

  <!-- fascia che svolazza nel vento -->
  <path d="M44 98 Q24 94 8 104 Q22 104 30 112 Q18 118 10 132 Q32 120 46 108 Z" fill="url(#fascia)" ${S}/>
  <path d="M40 101 Q26 100 16 106" fill="none" stroke="${sash.light}" stroke-width="2"/>

  <!-- la piuma alta sulla testa -->
  <path d="M55 28 Q48 14 54 3 Q66 2 69 12 Q69 22 60 29 Z" fill="url(#piuma)" ${S}/>
  <path d="M58 28 Q59 16 61 4" fill="none" stroke="${LINE}" stroke-width="1.4"/>
  <path d="M59 22 L53 18 M59 16 L53 11 M60 10 L56 6 M59 22 L66 17 M60 16 L67 11" stroke="#AEB8C8" stroke-width="1.2"/>

  ${backArm('url(#pelle)')}

  <!-- gonnellino lungo bianco a pieghe -->
  <path d="M42 102 L76 102 L85 130 L34 130 Z" fill="url(#lino)" ${S}/>
  <path d="M47 106 L42 128 M54 106 L52 129 M64 106 L66 129 M71 106 L76 128" stroke="#CBBE9F" stroke-width="1.5"/>

  <!-- busto con la veste bianca sulla spalla -->
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#pelle)" ${S}/>
  <path d="M38 70 Q48 65 58 66 L75 104 L50 104 Q44 88 38 70 Z" fill="url(#lino)" ${S}/>
  <path d="M50 76 Q58 86 62 98" fill="none" stroke="#CBBE9F" stroke-width="1.5"/>

  <!-- cintura nel colore della fascia -->
  <rect x="41" y="99" width="37" height="7" rx="2" fill="url(#fascia)" ${S}/>
  ${collar}

  <!-- collo -->
  <path d="M54 56 L52 70 L64 70 L64 56 Z" fill="url(#pelle)" ${S}/>

  ${frontArm('url(#pelle)')}
  <rect x="80" y="84" width="7" height="10" rx="2" transform="rotate(-40 83 89)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- parrucca scura -->
  <path d="M40 44 Q37 26 56 24 Q70 24 73 32 L66 34 L64 54 Q56 61 44 58 Q38 52 40 44 Z" fill="${WIG}" ${S}/>
  <path d="M44 34 L44 54 M50 31 L50 57 M56 30 L57 58" stroke="#3A4060" stroke-width="1.6"/>
  <!-- volto di profilo -->
  <path d="M63 30 Q74 28 77 37 L81 44 L77 46 Q79 52 75 54 Q73 58 67 58 L61 56 Z" fill="url(#pelle)" ${S}/>
  <path d="M75 54 Q72 55 70 54" fill="none" stroke="${LINE}" stroke-width="1.3"/>
  <!-- barba divina intrecciata -->
  <path d="M69 57 Q71 64 75 70 Q69 69 65 60 Z" fill="${WIG}" ${S}/>
  <path d="M68 61 L71 61 M69 65 L72 65" stroke="#3A4060" stroke-width="1.2"/>
  <!-- occhio col trucco -->
  <path d="M68 39 Q72 36 76 39 Q72 41 68 39 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="72.5" cy="38.9" r="1.5" fill="${LINE}"/>
  <path d="M68 39 L62 40" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M67 35 Q72 33 77 35" fill="none" stroke="${LINE}" stroke-width="1.6"/>
  <!-- fascia sulla fronte che tiene la piuma -->
  <path d="M40 34 Q56 26 73 31" fill="none" stroke="${LINE}" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M40 34 Q56 26 73 31" fill="none" stroke="${sash.mid}" stroke-width="3" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const shuLegSvg = () => legSvg(SKIN, '#C9B48A');
