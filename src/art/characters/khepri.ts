import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, belt, frontArm, goldGrad, grad, legSvg, linenGrad, variantTone, type Tone } from './common';

const SKIN: Tone = { light: '#E0A673', mid: '#B97B48', dark: '#74461F' };
/** Corazza lucida turchese da scarabeo (il colore che cambia per i bot). */
const SHELL: Tone = { light: '#9FF0E6', mid: '#2EC4B6', dark: '#0E5E57' };

/**
 * Khepri — dio del sole del mattino: al posto della testa uno scarabeo lucido con il sole dell'alba sopra,
 * corazza a elitre sulla schiena e sul petto.
 */
export function khepriSvg(variant: ColorVariant = 'base') {
  const c = variantTone(SHELL, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    ${grad('guscio', c)}
    ${goldGrad()}
    ${linenGrad()}
    <radialGradient id="alba" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#FFF3B0"/><stop offset="0.6" stop-color="#FFB703"/><stop offset="1" stop-color="#E76F00"/>
    </radialGradient>
  </defs>

  <!-- il sole dell'alba sopra la testa -->
  <circle cx="58" cy="11" r="10" fill="url(#alba)" ${S}/>

  <!-- elitre (ali dure) sulla schiena -->
  <path d="M42 66 Q24 74 26 100 Q34 108 44 100 Z" fill="url(#guscio)" ${S}/>
  <path d="M36 74 Q30 86 32 98" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.55"/>

  ${backArm('url(#pelle)')}

  <!-- gonnellino bianco -->
  <path d="M42 102 L76 102 L82 124 L36 124 Z" fill="url(#lino)" ${S}/>
  <path d="M55 104 L63 104 L65 123 L53 123 Z" fill="url(#guscio)" ${S}/>

  <!-- busto con la corazza lucida -->
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#pelle)" ${S}/>
  <path d="M42 70 Q59 64 77 70 L73 92 Q59 98 45 92 Z" fill="url(#guscio)" ${S}/>
  <path d="M59 68 L59 95" stroke="${LINE}" stroke-width="1.6"/>
  <path d="M48 74 Q50 82 49 88" fill="none" stroke="#FFFFFF" stroke-width="2.2" opacity="0.6" stroke-linecap="round"/>
  ${belt()}

  <!-- collo -->
  <path d="M53 56 L51 70 L64 70 L64 56 Z" fill="url(#pelle)" ${S}/>

  ${frontArm('url(#pelle)')}
  <rect x="80" y="84" width="7" height="10" rx="2" transform="rotate(-40 83 89)" fill="url(#oro)" stroke="${LINE}" stroke-width="1.5"/>

  <!-- testa di scarabeo: guscio a cupola lucido -->
  <path d="M42 46 Q40 22 60 21 Q78 22 80 42 Q80 56 66 60 L52 60 Q42 56 42 46 Z" fill="url(#guscio)" ${S}/>
  <path d="M61 22 L61 59" stroke="${LINE}" stroke-width="1.6"/>
  <path d="M48 30 Q52 26 56 26" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.7" stroke-linecap="round"/>
  <!-- muso con le pinze -->
  <path d="M74 34 Q86 34 88 42 Q84 46 78 44 Z" fill="${c.dark}" ${S}/>
  <path d="M84 36 L92 32 M86 42 L94 44" stroke="${LINE}" stroke-width="2.6" stroke-linecap="round"/>
  <!-- occhio d'oro -->
  <circle cx="74" cy="40" r="3.5" fill="${GOLD}" stroke="${LINE}" stroke-width="1.5"/>
  <circle cx="75" cy="39.5" r="1.4" fill="${LINE}"/>
  <!-- zampette/antenne -->
  <path d="M70 26 Q76 18 82 20" fill="none" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

export const khepriLegSvg = () => legSvg(SKIN, '#8A5A2B');
