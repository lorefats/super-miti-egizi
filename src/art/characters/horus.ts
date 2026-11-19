import type { ColorVariant } from '../palette';
import { LINE, S, GOLD, backArm, belt, bracelet, collar, goldGrad, grad, legSvg, linenGrad, variantTone, type Tone } from './common';

/** Piume blu del falco (il colore che cambia per i bot). */
const FEATHERS: Tone = { light: '#7FB0FF', mid: '#2F67D8', dark: '#173A85' };
const SKIN: Tone = { light: '#E3A979', mid: '#C0814F', dark: '#7E4E2A' };

/**
 * Horus — dio del cielo: testa di falco con la doppia corona, armatura bianca e blu.
 * L'Arco del Falco è un disegno a parte (horusBowSvg) per animarlo nella mano.
 */
export function horusSvg(variant: ColorVariant = 'base') {
  const f = variantTone(FEATHERS, variant);
  const body = `
  <defs>
    ${grad('piume', f)}
    ${grad('pelle', SKIN)}
    ${goldGrad()}
    ${linenGrad()}
    <linearGradient id="armatura" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9D6F0"/>
    </linearGradient>
  </defs>

  <!-- copricapo a strisce bianche e blu dietro la testa -->
  <path d="M38 40 Q32 62 36 82 L54 80 Q52 60 56 46 Z" fill="url(#armatura)" ${S}/>
  <path d="M36 52 L54 50 M35 62 L53 60 M35 72 L53 70" stroke="${f.mid}" stroke-width="4"/>

  ${backArm('url(#pelle)')}

  <!-- gonnellino bianco con il pannello blu -->
  <path d="M42 102 L76 102 L84 128 L35 128 Z" fill="url(#lino)" ${S}/>
  <path d="M46 108 L42 126 M73 108 L78 126" stroke="#CBBE9F" stroke-width="1.5"/>
  <path d="M55 104 L65 104 L68 127 L52 127 Z" fill="url(#piume)" ${S}/>
  <path d="M55 112 L65 112 M54 119 L66 119" stroke="${GOLD}" stroke-width="2"/>

  <!-- armatura bianca a piume blu -->
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#armatura)" ${S}/>
  <path d="M46 84 Q52 90 58 84 Q64 90 70 84 M47 93 Q53 98 59 93 Q65 98 70 93" fill="none" stroke="${f.mid}" stroke-width="2.6"/>

  ${belt()}
  ${collar}

  <!-- collo di piume -->
  <path d="M52 56 L50 70 L64 70 L64 56 Z" fill="url(#piume)" ${S}/>

  <!-- braccio davanti (la mano tiene l'arco) -->
  <path d="M74 72 Q86 80 92 90 L86 96 Q78 88 70 82 Z" fill="url(#pelle)" ${S}/>
  ${bracelet}

  <!-- doppia corona: bianca alta dentro quella rossa -->
  <path d="M49 20 Q47 6 54 2 Q62 0 64 9 L66 20 Z" fill="url(#lino)" ${S}/>
  <path d="M43 30 Q42 18 48 16 L70 16 Q74 19 74 27 Q58 22 43 30 Z" fill="#D9473F" ${S}/>
  <path d="M70 17 Q78 12 76 5" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M70 17 Q78 12 76 5" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>

  <!-- testa di falco -->
  <path d="M42 42 Q40 24 58 24 Q74 24 78 34 L80 50 Q70 60 56 58 Q44 54 42 42 Z" fill="url(#piume)" ${S}/>
  <!-- guancia bianca -->
  <path d="M61 45 Q70 41 80 44 L80 50 Q72 57 62 55 Z" fill="#FFFFFF" ${S}/>
  <!-- becco adunco d'oro con la punta scura -->
  <path d="M76 31 Q92 31 97 41 Q98 50 92 54 Q91 46 85 45 L78 47 Z" fill="url(#oro)" ${S}/>
  <path d="M92 54 Q98 50 97 41 Q95 47 90 46 Z" fill="#2B2D42"/>
  <path d="M78 32 Q81 39 79 46" fill="none" stroke="${LINE}" stroke-width="1.4"/>
  <!-- occhio con il segno dell'Occhio di Horus -->
  <circle cx="71" cy="38" r="4" fill="#FFD23F" stroke="${LINE}" stroke-width="1.6"/>
  <circle cx="71.8" cy="38" r="2" fill="${LINE}"/>
  <path d="M66 38 L55 40" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M68 42 Q67 49 62 53" fill="none" stroke="${LINE}" stroke-width="2.4" stroke-linecap="round"/>
  <!-- riflesso sulle piume -->
  <path d="M46 36 Q50 29 60 28" fill="none" stroke="${f.light}" stroke-width="2.5" stroke-linecap="round"/>
  `;
  return { width: 112, height: 160, body };
}

/** Punto della mano davanti, misurato dai piedi (centro in basso del disegno). */
export const HORUS_HAND = { x: 39, y: -67 };

/** Quanto si muove l'arco quando tira (poco: un arco non si agita come un bastone). */
export const HORUS_BOW_SWING = { windup: -0.3, strike: 0.25 };

/** L'Arco del Falco con il pugno che lo stringe (il punto di presa è il pugno). */
export function horusBowSvg(variant: ColorVariant = 'base') {
  const f = variantTone(FEATHERS, variant);
  const body = `
  <defs>
    ${grad('pelle', SKIN)}
    <linearGradient id="arco" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#9C5F0A"/>
    </linearGradient>
  </defs>
  <path d="M12 6 L12 144" stroke="#F4F1E8" stroke-width="1.8"/>
  <path d="M12 6 Q48 75 12 144" fill="none" stroke="${LINE}" stroke-width="8" stroke-linecap="round"/>
  <path d="M12 6 Q48 75 12 144" fill="none" stroke="url(#arco)" stroke-width="4.6" stroke-linecap="round"/>
  <circle cx="12" cy="6" r="4" fill="${f.mid}" stroke="${LINE}" stroke-width="1.6"/>
  <circle cx="12" cy="144" r="4" fill="${f.mid}" stroke="${LINE}" stroke-width="1.6"/>
  <rect x="25" y="62" width="9" height="26" rx="3" fill="${f.mid}" stroke="${LINE}" stroke-width="1.6"/>
  <ellipse cx="30" cy="75" rx="6" ry="7" fill="url(#pelle)" ${S}/>`;
  return { width: 44, height: 150, body, gripX: 30, gripY: 75 };
}

export const horusLegSvg = () => legSvg(SKIN, '#8A5A2B');
