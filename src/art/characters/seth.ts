import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, belt, collar, frontArm, goldGrad, grad, legSvg, linenGrad, variantTone, type Tone } from './common';

/** Pelo rosso del misterioso animale di Seth (il colore che cambia per i bot). */
const FUR: Tone = { light: '#F27D72', mid: '#E63946', dark: '#7A1520' };

/** Seth — dio del caos e del deserto: testa di animale misterioso con il muso curvo e le orecchie squadrate, tutto rosso. */
export function sethSvg(variant: ColorVariant = 'base') {
  const f = variantTone(FUR, variant);
  const body = `
  <defs>
    ${grad('pelo', f)}
    ${goldGrad()}
    ${linenGrad()}
  </defs>

  <!-- coda dritta e biforcuta -->
  <path d="M42 104 Q30 100 24 84 L20 70 L26 72 L28 64 L32 80 Q36 94 46 98 Z" fill="url(#pelo)" ${S}/>

  ${backArm('url(#pelo)')}

  <!-- gonnellino bianco con il pannello rosso -->
  <path d="M42 102 L76 102 L82 124 L36 124 Z" fill="url(#lino)" ${S}/>
  <path d="M55 104 L63 104 L65 123 L53 123 Z" fill="url(#pelo)" ${S}/>
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#pelo)" ${S}/>
  ${belt()}
  ${collar}
  <path d="M53 56 L51 70 L64 70 L64 56 Z" fill="url(#pelo)" ${S}/>

  ${frontArm('url(#pelo)')}
  <rect x="80" y="84" width="7" height="10" rx="2" transform="rotate(-40 83 89)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- orecchie alte con la cima piatta (squadrate) -->
  <path d="M50 34 L46 6 L56 6 L58 32 Z" fill="url(#pelo)" ${S}/>
  <path d="M60 32 L60 4 L70 4 L68 32 Z" fill="url(#pelo)" ${S}/>
  <path d="M62 8 L67 8 L66 28 L63 28 Z" fill="${f.dark}"/>
  <!-- testa con il muso lungo e curvo all'ingiù -->
  <path d="M44 48 Q42 30 58 28 Q70 28 76 36 Q88 40 94 52 Q92 56 86 54 Q78 52 72 54 L66 58 Q50 60 44 48 Z" fill="url(#pelo)" ${S}/>
  <path d="M94 52 Q92 56 86 54" fill="none" stroke="${LINE}" stroke-width="2"/>
  <circle cx="92" cy="51" r="1.4" fill="${LINE}"/>
  <!-- occhio furbo -->
  <path d="M64 40 Q69 36 74 40 Q69 42 64 40 Z" fill="#FFE08A" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="70" cy="39.8" r="1.6" fill="${LINE}"/>
  <path d="M63 36 L75 38" stroke="${LINE}" stroke-width="2.4" stroke-linecap="round"/>
  <!-- sorrisetto -->
  <path d="M74 50 Q78 52 82 50" fill="none" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M46 44 Q52 42 56 46" fill="none" stroke="${GOLD}" stroke-width="2.4"/>
  `;
  return { width: 112, height: 160, body };
}

export const sethLegSvg = () => legSvg(FUR, '#6B2A1A');
