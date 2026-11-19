import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, collar, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

const SKIN: Tone = { light: '#D9A27A', mid: '#A9714A', dark: '#653E22' };
/** Ali e vestito viola scuro (il colore che cambia per i bot). */
const NIGHT: Tone = { light: '#9D6BD6', mid: '#5A189A', dark: '#240747' };

/** Nefti — dea della notte e della protezione: ali scure, sulla testa il suo simbolo (una casa con il cesto sopra). */
export function neftiSvg(variant: ColorVariant = 'base') {
  const n = variantTone(NIGHT, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('notte', n)}
    ${goldGrad()}
  </defs>

  <!-- simbolo sulla testa: cesto sopra una casa -->
  <path d="M50 10 Q58 16 66 10 L66 12 Q58 18 50 12 Z" fill="url(#oro)" ${S}/>
  <rect x="51" y="14" width="14" height="10" fill="url(#oro)" ${S}/>
  <rect x="55" y="17" width="6" height="7" fill="${n.dark}"/>

  <!-- ali scure dietro, aperte -->
  <path d="M44 72 Q16 60 4 86 Q18 82 22 92 Q28 84 34 96 Q38 86 46 92 Z" fill="url(#notte)" ${S}/>
  <path d="M14 82 Q24 76 36 82 M20 90 Q30 84 40 90" fill="none" stroke="${n.light}" stroke-width="1.6"/>

  <path d="M38 40 Q32 64 38 84 L52 82 Q48 62 52 44 Z" fill="#14102A" ${S}/>
  ${backArm('url(#pelle)')}

  <path d="M42 100 L76 100 L84 130 L34 130 Z" fill="url(#notte)" ${S}/>
  <path d="M40 70 Q58 64 78 70 L74 104 L44 104 Z" fill="url(#notte)" ${S}/>
  <path d="M44 100 L74 100" stroke="${GOLD}" stroke-width="3"/>
  ${collar}
  <path d="M54 56 L52 70 L64 70 L64 56 Z" fill="url(#pelle)" ${S}/>

  <!-- braccio davanti con una lama d'ombra -->
  <path d="M74 72 Q86 80 92 90 L86 96 Q78 88 70 82 Z" fill="url(#pelle)" ${S}/>
  <ellipse cx="89" cy="93" rx="6" ry="7" fill="url(#pelle)" ${S}/>
  <path d="M90 88 Q104 70 100 52 Q96 72 86 86 Z" fill="${n.mid}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>

  <path d="M40 46 Q36 26 58 25 Q72 25 75 33 L66 35 L64 56 Q55 62 44 58 Q38 54 40 46 Z" fill="#14102A" ${S}/>
  <path d="M63 31 Q74 29 77 38 L80 44 L77 46 Q79 52 75 54 Q72 59 65 58 L61 56 Z" fill="url(#pelle)" ${S}/>
  <path d="M75 52 Q72 53 69 52" fill="none" stroke="${LINE}" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M68 40 Q72 37 76 40 Q72 42 68 40 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="72.5" cy="39.9" r="1.6" fill="${n.mid}"/>
  <path d="M68 40 L60 42" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M67 36 Q72 34 77 36" fill="none" stroke="${n.mid}" stroke-width="2"/>
  <path d="M40 33 Q57 25 74 31" fill="none" stroke="url(#oro)" stroke-width="3" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const neftiLegSvg = () => legSvg(SKIN, '#240747');
