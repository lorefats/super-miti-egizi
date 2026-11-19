import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, belt, collar, frontArm, goldGrad, grad, legSvg, variantTone, type Tone } from './common';

/** Armatura verde acqua (il colore che cambia per i bot). */
const ARMOR: Tone = { light: '#5EDBCB', mid: '#2A9D8F', dark: '#14564E' };
/** Pelle di coccodrillo. */
const SCALES: Tone = { light: '#7CC47F', mid: '#3F8A4B', dark: '#1D4A26' };
const BELLY: Tone = { light: '#F0F2B8', mid: '#CCD787', dark: '#8E9A4E' };

/** Sobek — dio coccodrillo del Nilo: muso lungo coi denti, muscoloso, armatura verde. Niente arma: morde. */
export function sobekSvg(variant: ColorVariant = 'base') {
  const a = variantTone(ARMOR, variant);
  const body = `
  <defs>
    ${grad('pelle', SCALES)}
    ${grad('pancia', BELLY)}
    ${grad('armatura', a)}
    ${goldGrad()}
  </defs>

  <!-- coda -->
  <path d="M42 112 Q22 118 6 140 Q24 132 44 124 Z" fill="url(#pelle)" ${S}/>
  <path d="M30 120 l-2 -4 M22 126 l-2 -4 M15 132 l-2 -3" stroke="${SCALES.dark}" stroke-width="2"/>

  <!-- copricapo a strisce dietro la testa -->
  <path d="M40 40 Q34 62 38 80 L54 78 Q52 60 56 46 Z" fill="url(#armatura)" ${S}/>
  <path d="M38 52 L54 50 M37 62 L53 60 M37 72 L53 70" stroke="${GOLD}" stroke-width="3.5"/>

  ${backArm('url(#pelle)', true)}

  <!-- gonnellino dell'armatura con strisce d'oro -->
  <path d="M41 102 L77 102 L86 128 L33 128 Z" fill="url(#armatura)" ${S}/>
  <path d="M48 104 L44 127 M59 104 L59 128 M70 104 L75 127" stroke="${GOLD}" stroke-width="2.4"/>

  <!-- busto largo con la pancia chiara -->
  <path d="M34 70 Q58 60 84 70 L77 104 L42 104 Z" fill="url(#pelle)" ${S}/>
  <path d="M48 76 Q60 72 72 76 L70 102 L50 102 Z" fill="url(#pancia)" stroke="${LINE}" stroke-width="1.6"/>
  <path d="M50 84 L70 84 M50 92 L70 92" stroke="${BELLY.dark}" stroke-width="1.6"/>
  <!-- cinghia e spallaccio -->
  <path d="M40 72 L74 102" stroke="${LINE}" stroke-width="8" stroke-linecap="round"/>
  <path d="M40 72 L74 102" stroke="${a.mid}" stroke-width="5" stroke-linecap="round"/>
  <path d="M66 66 Q84 60 90 74 Q80 79 70 78 Z" fill="url(#armatura)" ${S}/>
  <path d="M72 68 Q82 66 86 72" fill="none" stroke="${GOLD}" stroke-width="2"/>

  ${belt()}
  ${collar}

  <!-- collo grosso -->
  <path d="M50 54 L47 70 L66 70 L66 54 Z" fill="url(#pelle)" ${S}/>

  ${frontArm('url(#pelle)', true)}
  <rect x="78" y="82" width="8" height="11" rx="2" transform="rotate(-40 82 87)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- testa -->
  <path d="M42 42 Q42 26 56 26 Q68 26 72 34 L72 54 Q62 60 50 58 Q42 54 42 42 Z" fill="url(#pelle)" ${S}/>
  <!-- mascella di sotto -->
  <path d="M71 51 L104 50 Q102 57 93 58 L73 60 Z" fill="url(#pancia)" ${S}/>
  <!-- muso lungo -->
  <path d="M67 33 Q88 32 106 39 Q111 45 107 50 L71 52 Z" fill="url(#pelle)" ${S}/>
  <!-- denti -->
  <path d="M77 51.5 l2.5 4 l2.5 -4 Z M86 51.2 l2.5 4 l2.5 -4 Z M95 50.8 l2.5 4 l2.5 -4 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.1"/>
  <!-- narici e squame -->
  <ellipse cx="104" cy="39.5" rx="4" ry="2.6" fill="${SCALES.mid}" ${S}/>
  <circle cx="80" cy="37" r="1.7" fill="${SCALES.dark}"/>
  <circle cx="88" cy="38.5" r="1.7" fill="${SCALES.dark}"/>
  <circle cx="96" cy="40" r="1.7" fill="${SCALES.dark}"/>
  <path d="M70 35 Q86 34 100 38" fill="none" stroke="${SCALES.light}" stroke-width="2"/>
  <!-- occhio sporgente -->
  <path d="M57 33 Q63 20 72 30" fill="url(#pelle)" ${S}/>
  <circle cx="65" cy="31" r="3.8" fill="#F7D046" stroke="${LINE}" stroke-width="1.5"/>
  <ellipse cx="65.6" cy="31" rx="1" ry="3" fill="${LINE}"/>
  <!-- riflesso sulla testa -->
  <path d="M47 38 Q49 31 56 30" fill="none" stroke="${SCALES.light}" stroke-width="2.5" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const sobekLegSvg = () => legSvg(SCALES, '#6B4A2A');
