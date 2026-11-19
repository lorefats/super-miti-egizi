import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, belt, collar, frontArm, goldGrad, grad, legSvg, linenGrad, variantTone, type Tone } from './common';

/** Piume arancio-oro del falco del sole (il colore che cambia per i bot). */
const FEATHERS: Tone = { light: '#FFC46B', mid: '#FF9F1C', dark: '#A8520A' };
const SKIN: Tone = { light: '#E3A979', mid: '#C0814F', dark: '#7E4E2A' };

/** Rà — re degli dèi: testa di falco con il grande disco del sole e il cobra, vesti d'oro. */
export function raSvg(variant: ColorVariant = 'base') {
  const f = variantTone(FEATHERS, variant);
  const body = `
  <defs>
    ${grad('piume', f)}
    ${grad('pelle', SKIN)}
    ${goldGrad()}
    ${linenGrad()}
    <radialGradient id="sole" cx="0.4" cy="0.38" r="0.7">
      <stop offset="0" stop-color="#FFF6C2"/><stop offset="0.45" stop-color="#FFD23F"/><stop offset="1" stop-color="#E8590C"/>
    </radialGradient>
  </defs>

  <!-- raggi dietro il disco -->
  <path d="M58 0 L58 -2 M36 12 L28 8 M80 12 L88 8 M34 26 L24 26 M82 26 L92 26" stroke="#FFD23F" stroke-width="3.5" stroke-linecap="round"/>
  <!-- il grande disco del sole -->
  <circle cx="58" cy="17" r="17" fill="url(#sole)" ${S}/>
  <path d="M48 10 Q53 5 59 5" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" opacity="0.8"/>
  <!-- cobra d'oro attorcigliato davanti al disco -->
  <path d="M58 36 Q50 32 52 26 Q54 22 58 24 Q62 22 64 26 Q66 32 58 36 Z" fill="url(#oro)" ${S}/>
  <circle cx="58" cy="27" r="1.4" fill="#E63946"/>

  <!-- copricapo a strisce oro e arancio -->
  <path d="M38 40 Q32 62 36 82 L54 80 Q52 60 56 46 Z" fill="url(#oro)" ${S}/>
  <path d="M36 52 L54 50 M35 62 L53 60 M35 72 L53 70" stroke="${f.mid}" stroke-width="4"/>

  ${backArm('url(#pelle)')}

  <!-- gonnellino d'oro con il pannello arancio -->
  <path d="M42 102 L76 102 L84 128 L35 128 Z" fill="url(#lino)" ${S}/>
  <path d="M55 104 L65 104 L68 127 L52 127 Z" fill="url(#piume)" ${S}/>
  <path d="M55 112 L65 112 M54 119 L66 119" stroke="${GOLD}" stroke-width="2"/>
  <!-- corazza d'oro -->
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#oro)" ${S}/>
  <path d="M46 84 Q52 90 58 84 Q64 90 70 84 M47 93 Q53 98 59 93 Q65 98 70 93" fill="none" stroke="${f.dark}" stroke-width="2.6"/>
  ${belt()}
  ${collar}
  <path d="M52 56 L50 70 L64 70 L64 56 Z" fill="url(#piume)" ${S}/>

  ${frontArm('url(#pelle)')}
  <rect x="80" y="84" width="7" height="10" rx="2" transform="rotate(-40 83 89)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>
  <!-- piccolo sole che brilla in mano -->
  <circle cx="92" cy="86" r="6" fill="url(#sole)" stroke="${LINE}" stroke-width="1.6"/>

  <!-- testa di falco arancio -->
  <path d="M42 46 Q40 30 58 30 Q74 30 78 40 L80 54 Q70 62 56 60 Q44 56 42 46 Z" fill="url(#piume)" ${S}/>
  <path d="M61 49 Q70 45 80 48 L80 54 Q72 60 62 58 Z" fill="#FFFFFF" ${S}/>
  <path d="M76 36 Q92 36 97 45 Q98 54 92 57 Q91 50 85 49 L78 51 Z" fill="url(#oro)" ${S}/>
  <path d="M92 57 Q98 54 97 45 Q95 51 90 50 Z" fill="#2B2D42"/>
  <circle cx="71" cy="42" r="4" fill="#FFD23F" stroke="${LINE}" stroke-width="1.6"/>
  <circle cx="71.8" cy="42" r="2" fill="${LINE}"/>
  <path d="M66 42 L55 44" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M68 46 Q67 52 62 56" fill="none" stroke="${LINE}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M46 40 Q50 33 60 32" fill="none" stroke="${f.light}" stroke-width="2.5" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const raLegSvg = () => legSvg(SKIN, '#A8520A', '#FFD23F');
