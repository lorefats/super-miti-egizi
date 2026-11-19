import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, belt, collar, frontArm, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

/** Pelo della leonessa. */
const FUR: Tone = { light: '#F7C77E', mid: '#D9963F', dark: '#8C5A1E' };
/** Vestito rosso fuoco (il colore che cambia per i bot). */
const DRESS: Tone = { light: '#F2706A', mid: '#D62828', dark: '#6E1010' };

/** Sekhmet — dea leonessa guerriera, rossa e oro: criniera, disco del sole con il cobra sulla testa. */
export function sekhmetSvg(variant: ColorVariant = 'base') {
  const d = variantTone(DRESS, variant);
  const body = `
  <defs>
    ${grad('pelo', FUR)}
    ${grad('vestito', d)}
    ${goldGrad()}
    <radialGradient id="sole" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#FFE08A"/><stop offset="0.6" stop-color="#FF7B1C"/><stop offset="1" stop-color="#B8400A"/>
    </radialGradient>
  </defs>

  <!-- disco del sole -->
  <circle cx="56" cy="14" r="12" fill="url(#sole)" ${S}/>
  <path d="M56 28 Q52 22 56 19 Q60 22 56 28 Z" fill="url(#oro)" ${S}/>

  <!-- criniera folta dietro la testa -->
  <path d="M36 50 Q30 30 46 22 Q60 18 70 26 L66 66 Q50 74 40 66 Q32 60 36 50 Z" fill="${FUR.dark}" ${S}/>
  <path d="M38 40 L32 44 M38 52 L31 56 M42 62 L36 68" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>

  ${backArm('url(#pelo)')}

  <!-- vestito rosso da guerriera -->
  <path d="M42 100 L76 100 L82 126 L36 126 Z" fill="url(#vestito)" ${S}/>
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#vestito)" ${S}/>
  <path d="M46 76 L72 76" stroke="${GOLD}" stroke-width="2.5"/>
  ${belt()}
  ${collar}
  <path d="M53 56 L51 70 L64 70 L64 56 Z" fill="url(#pelo)" ${S}/>

  ${frontArm('url(#pelo)')}
  <rect x="80" y="84" width="7" height="10" rx="2" transform="rotate(-40 83 89)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- testa di leonessa -->
  <path d="M46 46 Q44 28 60 27 Q72 27 76 36 L86 42 Q88 50 82 54 Q78 60 68 60 Q52 60 46 46 Z" fill="url(#pelo)" ${S}/>
  <path d="M50 30 Q48 22 54 22 Q58 26 56 32 Z" fill="url(#pelo)" ${S}/>
  <!-- naso e bocca che ruggisce -->
  <path d="M84 42 Q88 42 87 46 Q84 47 83 44 Z" fill="${LINE}"/>
  <path d="M86 50 Q80 54 74 52" fill="none" stroke="${LINE}" stroke-width="1.6"/>
  <path d="M78 52 L79 55 M82 51 L82.5 54" stroke="#FFFFFF" stroke-width="1.6"/>
  <!-- occhio feroce -->
  <path d="M66 38 Q71 35 76 38 Q71 40 66 38 Z" fill="#FFE08A" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="72" cy="38" r="1.5" fill="${LINE}"/>
  <path d="M65 34 L77 36" stroke="${LINE}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M74 48 L66 46 M74 50 L66 50" stroke="${FUR.dark}" stroke-width="1.2"/>
  `;
  return { width: 112, height: 160, body };
}

export const sekhmetLegSvg = () => legSvg(FUR, '#8C2A1A');
