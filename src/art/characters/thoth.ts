import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, belt, collar, goldGrad, grad, legSvg, linenGrad, variantTone, type Tone } from './common';

const SKIN: Tone = { light: '#E0A673', mid: '#B97B48', dark: '#74461F' };
/** Piume bianche e nere dell'ibis; il mantello azzurro cambia per i bot. */
const CLOAK: Tone = { light: '#9EE7F5', mid: '#48CAE4', dark: '#1B6F82' };

/** Thoth — dio della scrittura e della sapienza: testa di ibis con il becco lungo e curvo, rotolo di papiro. */
export function thothSvg(variant: ColorVariant = 'base') {
  const c = variantTone(CLOAK, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('mantello', c)}
    ${goldGrad()}
    ${linenGrad()}
    <linearGradient id="papiro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF6D6"/><stop offset="1" stop-color="#E0CC93"/>
    </linearGradient>
  </defs>

  <!-- disco lunare sulla testa -->
  <path d="M46 26 Q48 14 58 14 Q68 14 70 26 Q64 20 58 20 Q52 20 46 26 Z" fill="url(#oro)" ${S}/>

  ${backArm('url(#pelle)')}

  <path d="M42 102 L76 102 L82 124 L36 124 Z" fill="url(#lino)" ${S}/>
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#mantello)" ${S}/>
  ${belt()}
  ${collar}
  <path d="M53 56 L51 70 L64 70 L64 56 Z" fill="#FFFFFF" ${S}/>

  <!-- braccio con il rotolo di papiro aperto -->
  <path d="M74 72 Q86 80 90 88 L84 94 Q78 86 70 82 Z" fill="url(#pelle)" ${S}/>
  <rect x="80" y="78" width="26" height="22" rx="2" fill="url(#papiro)" ${S}/>
  <rect x="78" y="76" width="5" height="26" rx="2.5" fill="#C9A86A" stroke="${LINE}" stroke-width="1.6"/>
  <rect x="103" y="76" width="5" height="26" rx="2.5" fill="#C9A86A" stroke="${LINE}" stroke-width="1.6"/>
  <path d="M87 83 L91 83 M95 83 L99 87 M87 90 Q89 87 91 90 M95 92 L100 92 M89 95 L89 97" stroke="${LINE}" stroke-width="1.4" stroke-linecap="round"/>

  <!-- testa di ibis bianca e nera con il becco lungo e curvo -->
  <path d="M44 48 Q42 30 58 28 Q72 28 74 40 Q74 54 64 58 L54 58 Q44 56 44 48 Z" fill="#FFFFFF" ${S}/>
  <path d="M44 48 Q42 36 50 32 Q46 42 52 52 Z" fill="#1E2236"/>
  <path d="M72 40 Q90 42 100 58 Q104 66 100 70 Q94 56 72 48 Z" fill="#2B2D42" ${S}/>
  <circle cx="64" cy="38" r="3.2" fill="#FFD60A" stroke="${LINE}" stroke-width="1.4"/>
  <circle cx="65" cy="38" r="1.4" fill="${LINE}"/>
  <path d="M58 28 Q62 26 66 28" fill="none" stroke="${GOLD}" stroke-width="2"/>
  `;
  return { width: 112, height: 160, body };
}

export const thothLegSvg = () => legSvg(SKIN, '#C9B48A');
