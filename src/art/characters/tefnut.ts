import type { ColorVariant } from '../palette';
import { LINE, S, backArm, belt, bracelet, collar, frontArm, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

/** Pelo da leonessa. */
const FUR: Tone = { light: '#F6D08F', mid: '#D99A48', dark: '#9C6426' };
/** Azzurro dell'acqua (il colore che cambia per i bot). */
const WATER: Tone = { light: '#8EEBFF', mid: '#00A6CC', dark: '#005E78' };

/** Tefnut — dea dell'acqua e della pioggia: testa di leonessa, vestito azzurro a onde, disco d'acqua sulla testa. */
export function tefnutSvg(variant: ColorVariant = 'base') {
  const w = variantTone(WATER, variant);
  const body = `
  <defs>
    ${grad('pelo', FUR)}
    ${grad('acqua', w)}
    ${goldGrad()}
  </defs>

  <!-- disco d'acqua dietro la testa -->
  <circle cx="58" cy="14" r="12" fill="url(#acqua)" ${S}/>
  <path d="M51 10 Q55 5 61 6" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>

  <!-- copricapo a strisce azzurre e bianche -->
  <path d="M38 40 Q32 62 36 82 L54 80 Q52 60 56 46 Z" fill="url(#acqua)" ${S}/>
  <path d="M36 52 L54 50 M35 62 L53 60 M35 72 L53 70" stroke="#FFFFFF" stroke-width="3.5"/>

  ${backArm('url(#pelo)')}

  <!-- vestito lungo azzurro con le onde -->
  <path d="M43 102 L75 102 L84 130 L35 130 Z" fill="url(#acqua)" ${S}/>
  <path d="M38 120 Q43 116 48 120 Q53 124 58 120 Q63 116 68 120 Q73 124 79 120" fill="none" stroke="#FFFFFF" stroke-width="2.2"/>
  <path d="M41 112 Q46 108 51 112 Q56 116 61 112 Q66 108 71 112" fill="none" stroke="#D8FAFF" stroke-width="1.6"/>

  <!-- busto -->
  <path d="M40 70 Q58 64 78 70 L73 104 L45 104 Z" fill="url(#acqua)" ${S}/>
  <path d="M50 88 Q58 92 66 88" fill="none" stroke="#D8FAFF" stroke-width="2"/>

  ${belt()}
  ${collar}
  <!-- goccia d'acqua appesa al collare -->
  <path d="M59 84 Q55 90 59 93 Q63 90 59 84 Z" fill="${w.light}" stroke="${LINE}" stroke-width="1.4"/>

  <!-- collo -->
  <path d="M52 56 L50 70 L64 70 L64 56 Z" fill="url(#pelo)" ${S}/>

  ${frontArm('url(#pelo)')}
  ${bracelet}

  <!-- orecchio dietro (tondo) -->
  <path d="M45 32 Q38 19 48 17 Q55 21 54 29 Z" fill="url(#pelo)" ${S}/>

  <!-- testa di leonessa -->
  <path d="M42 42 Q42 24 60 24 Q76 24 80 38 Q82 50 74 56 Q62 62 50 58 Q42 54 42 42 Z" fill="url(#pelo)" ${S}/>
  <!-- muso largo -->
  <path d="M73 40 Q90 41 92 49 Q90 58 75 59 Z" fill="#FBE6C6" ${S}/>
  <path d="M87.5 43 L93 45 L89 48.5 Z" fill="#8A4A3A" stroke="${LINE}" stroke-width="1.2"/>
  <path d="M89 49 Q88 54 82 54" fill="none" stroke="${LINE}" stroke-width="1.4"/>
  <circle cx="82" cy="50" r="0.9" fill="${LINE}"/>
  <circle cx="84" cy="52.5" r="0.9" fill="${LINE}"/>
  <!-- orecchio davanti (tondo) -->
  <path d="M60 28 Q58 13 69 13 Q75 19 71 29 Z" fill="url(#pelo)" ${S}/>
  <path d="M63 26 Q63 18 68 18 Q71 22 69 27 Z" fill="#E9A07A"/>
  <!-- occhio color ambra -->
  <path d="M64 39 Q70 34 77 38 Q71 43 64 39 Z" fill="#FFC94A" stroke="${LINE}" stroke-width="1.6"/>
  <circle cx="71.5" cy="38.6" r="1.7" fill="${LINE}"/>
  <path d="M64 39 L56 41" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
  <!-- lacrima blu sotto l'occhio -->
  <path d="M68 43 Q66 48 68 51" fill="none" stroke="${w.mid}" stroke-width="2.2" stroke-linecap="round"/>
  <!-- riflesso -->
  <path d="M46 36 Q49 29 58 28" fill="none" stroke="#FFE6B8" stroke-width="2.5" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const tefnutLegSvg = () => legSvg(FUR, '#3C7E96');
