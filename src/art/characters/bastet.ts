import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, belt, collar, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

/** Pelo dorato da gatta. */
const FUR: Tone = { light: '#F8CD95', mid: '#E39A55', dark: '#A8642A' };
/** Abito lapislazzuli (il colore che cambia per i bot). */
const DRESS: Tone = { light: '#5878DA', mid: '#1F3A93', dark: '#0F1F55' };

/** Bastet — dea gatta: elegante, orecchie a punta, occhi verdi, orecchini d'oro e coda. Graffia con gli artigli. */
export function bastetSvg(variant: ColorVariant = 'base') {
  const d = variantTone(DRESS, variant);
  const body = `
  <defs>
    ${grad('pelo', FUR)}
    ${grad('abito', d)}
    ${goldGrad()}
  </defs>

  <!-- coda che si arriccia -->
  <path d="M44 110 Q20 112 17 90 Q15 74 26 66" fill="none" stroke="${LINE}" stroke-width="10" stroke-linecap="round"/>
  <path d="M44 110 Q20 112 17 90 Q15 74 26 66" fill="none" stroke="${FUR.mid}" stroke-width="6" stroke-linecap="round"/>
  <path d="M19 80 Q17 72 25 67" fill="none" stroke="${FUR.dark}" stroke-width="6" stroke-linecap="round"/>

  <!-- orecchio dietro -->
  <path d="M46 34 L42 9 L58 27 Z" fill="url(#pelo)" ${S}/>

  ${backArm('url(#pelo)')}

  <!-- abito lungo con l'orlo d'oro -->
  <path d="M44 102 L74 102 L83 130 L36 130 Z" fill="url(#abito)" ${S}/>
  <path d="M38 125 L82 125" stroke="${GOLD}" stroke-width="3"/>
  <path d="M59 104 L59 124" stroke="${GOLD}" stroke-width="2"/>

  <!-- busto snello -->
  <path d="M41 70 Q58 64 77 70 L72 104 L46 104 Z" fill="url(#abito)" ${S}/>

  ${belt()}
  ${collar}

  <!-- collo -->
  <path d="M53 56 L51 70 L63 70 L63 56 Z" fill="url(#pelo)" ${S}/>

  <!-- braccio davanti con la zampa e gli artigli -->
  <path d="M74 72 Q86 80 92 90 L86 96 Q78 88 70 82 Z" fill="url(#pelo)" ${S}/>
  <ellipse cx="89" cy="93" rx="6" ry="7" fill="url(#pelo)" ${S}/>
  <path d="M94 88 l5 -2 M95 92 l5 0 M94 96 l5 2" stroke="${LINE}" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M94 88 l5 -2 M95 92 l5 0 M94 96 l5 2" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="80" y="84" width="7" height="10" rx="2" transform="rotate(-40 83 89)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- testa tonda da gatta -->
  <path d="M44 42 Q44 26 60 26 Q74 26 78 38 Q81 50 73 56 Q61 61 50 57 Q44 52 44 42 Z" fill="url(#pelo)" ${S}/>
  <path d="M52 30 L54 36 M58 28 L59 34 M64 28 L64 33" stroke="${FUR.dark}" stroke-width="2" stroke-linecap="round"/>
  <!-- muso chiaro, naso rosa, baffi -->
  <path d="M74 42 Q86 43 89 49 Q86 56 75 57 Z" fill="#FBE3C4" ${S}/>
  <path d="M85 45 L90 46 L87 49.5 Z" fill="#E07A8A" stroke="${LINE}" stroke-width="1.2"/>
  <path d="M87 50 Q86 54 81 53" fill="none" stroke="${LINE}" stroke-width="1.4"/>
  <path d="M80 50 L97 46 M80 52.5 L97 55" stroke="${LINE}" stroke-width="1"/>
  <!-- orecchio davanti a punta -->
  <path d="M58 29 L66 3 L76 33 Z" fill="url(#pelo)" ${S}/>
  <path d="M62 27 L66 12 L72 30 Z" fill="#F4A0A8"/>
  <!-- occhio verde a mandorla -->
  <path d="M65 40 Q71 34 78 39 Q72 45 65 40 Z" fill="#B7F25E" stroke="${LINE}" stroke-width="1.6"/>
  <ellipse cx="72" cy="39.5" rx="1.1" ry="3" fill="${LINE}"/>
  <path d="M65 40 L57 41" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
  <!-- orecchino d'oro -->
  <circle cx="57" cy="55" r="4.5" fill="none" stroke="${LINE}" stroke-width="3.6"/>
  <circle cx="57" cy="55" r="4.5" fill="none" stroke="${GOLD}" stroke-width="2"/>
  <!-- riflesso -->
  <path d="M48 38 Q50 31 58 30" fill="none" stroke="#FFE3BD" stroke-width="2.5" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const bastetLegSvg = () => legSvg(FUR, '#B98B47');
