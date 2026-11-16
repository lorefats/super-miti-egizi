import { PALETTE, css } from '../palette';

/**
 * Anubi in stile "eroico" (vedi docs/ART_STYLE.md): proporzioni vere, contorni sottili, luci e ombre.
 * Girato verso destra (per sinistra si specchia), tiene lo Scettro Uas nella mano davanti.
 * I piedi toccano il fondo dell'immagine: il personaggio va posizionato con origine (0.5, 1).
 */
export function anubiSvg(): { width: number; height: number; body: string } {
  const line = '#10162B';
  const gold = css(PALETTE.oro);
  const turq = css(PALETTE.turchese);
  const lapis = css(PALETTE.lapislazzuli);
  const s = `stroke="${line}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;

  const body = `
  <defs>
    <linearGradient id="pelo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#454A66"/><stop offset="0.55" stop-color="#23263A"/><stop offset="1" stop-color="#121424"/>
    </linearGradient>
    <linearGradient id="oro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFE08A"/><stop offset="0.5" stop-color="${gold}"/><stop offset="1" stop-color="#A86A0C"/>
    </linearGradient>
    <linearGradient id="lino" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D8CCB4"/>
    </linearGradient>
    <linearGradient id="bastone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#9C5F0A"/>
    </linearGradient>
  </defs>

  <!-- copricapo a strisce dietro la testa -->
  <path d="M38 40 Q32 62 36 82 L54 80 Q52 60 56 46 Z" fill="${lapis}" ${s}/>
  <path d="M36 52 L54 50 M35 62 L53 60 M35 72 L53 70" stroke="${gold}" stroke-width="4"/>

  <!-- orecchio dietro -->
  <path d="M42 30 L44 6 L56 26 Z" fill="url(#pelo)" ${s}/>

  <!-- braccio dietro -->
  <path d="M40 72 Q32 86 34 102 L42 103 Q42 88 48 76 Z" fill="url(#pelo)" ${s}/>

  <!-- gambe e sandali -->
  <path d="M47 124 L46 150 L54 150 L56 124 Z" fill="url(#pelo)" ${s}/>
  <path d="M61 124 L63 150 L71 150 L69 124 Z" fill="url(#pelo)" ${s}/>
  <path d="M43 150 L57 150 L58 156 L42 156 Z" fill="#8A5A2B" ${s}/>
  <path d="M61 150 L75 150 L77 156 L60 156 Z" fill="#8A5A2B" ${s}/>
  <path d="M50 146 L52 150 M66 146 L67 150" stroke="${gold}" stroke-width="2"/>

  <!-- gonnellino di lino con pannello d'oro -->
  <path d="M42 102 L76 102 L84 128 L35 128 Z" fill="url(#lino)" ${s}/>
  <path d="M46 108 L42 126 M54 108 L52 127 M66 108 L68 127 M73 108 L78 126" stroke="#CBBE9F" stroke-width="1.5"/>
  <path d="M56 104 L64 104 L67 126 L53 126 Z" fill="url(#oro)" ${s}/>
  <path d="M60 108 L60 122" stroke="${lapis}" stroke-width="2"/>

  <!-- busto -->
  <path d="M38 70 Q58 62 80 70 L74 104 L44 104 Z" fill="url(#pelo)" ${s}/>
  <path d="M50 88 Q58 92 66 88" fill="none" stroke="#3A3E58" stroke-width="2"/>

  <!-- cintura -->
  <rect x="41" y="99" width="37" height="7" rx="2" fill="url(#oro)" ${s}/>
  <rect x="56" y="99" width="7" height="7" fill="${turq}" stroke="${line}" stroke-width="1.5"/>

  <!-- collare usekh -->
  <path d="M38 70 Q59 96 80 70 Q59 78 38 70 Z" fill="url(#oro)" ${s}/>
  <path d="M43 75 Q59 90 75 75" fill="none" stroke="${turq}" stroke-width="3"/>
  <path d="M47 80 Q59 88 71 80" fill="none" stroke="${lapis}" stroke-width="2.5"/>

  <!-- collo -->
  <path d="M52 56 L50 70 L64 70 L64 56 Z" fill="url(#pelo)" ${s}/>

  <!-- Scettro Uas: bastone d'oro con testa d'animale in cima e forcella in basso -->
  <path d="M95 22 L95 150" stroke="${line}" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M95 22 L95 150" stroke="url(#bastone)" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M92 26 Q92 14 99 12 L109 15 Q104 17 101 20 Q98 22 98 28 Z" fill="url(#oro)" ${s}/>
  <path d="M91 148 L88 157 M99 148 L102 157" stroke="${line}" stroke-width="4" stroke-linecap="round"/>
  <path d="M91 148 L88 157 M99 148 L102 157" stroke="${gold}" stroke-width="2" stroke-linecap="round"/>

  <!-- braccio davanti che stringe lo scettro -->
  <path d="M74 72 Q86 80 92 90 L86 96 Q78 88 70 82 Z" fill="url(#pelo)" ${s}/>
  <rect x="80" y="84" width="7" height="10" rx="2" transform="rotate(-40 83 89)" fill="url(#oro)" stroke="${line}" stroke-width="1.5"/>
  <ellipse cx="95" cy="93" rx="6" ry="7" fill="url(#pelo)" ${s}/>

  <!-- testa -->
  <path d="M40 40 Q40 24 56 24 Q70 24 74 36 L74 54 Q64 60 50 58 Q40 54 40 40 Z" fill="url(#pelo)" ${s}/>
  <!-- muso lungo e sottile -->
  <path d="M70 34 Q88 36 104 44 Q106 50 100 52 L74 56 Z" fill="url(#pelo)" ${s}/>
  <path d="M74 52 L98 52 Q96 56 90 57 L76 58 Z" fill="#191B2C" ${s}/>
  <ellipse cx="103" cy="47" rx="3.6" ry="3" fill="#07080F" stroke="${line}" stroke-width="1.5"/>
  <path d="M74 38 Q86 38 98 42" fill="none" stroke="#565C7E" stroke-width="2"/>
  <!-- riflesso sulla testa -->
  <path d="M46 34 Q50 27 60 27" fill="none" stroke="#5E6488" stroke-width="2.5" stroke-linecap="round"/>

  <!-- orecchio davanti -->
  <path d="M54 28 L62 2 L72 32 Z" fill="url(#pelo)" ${s}/>
  <path d="M59 26 L62 11 L67 28 Z" fill="url(#oro)"/>

  <!-- diadema d'oro -->
  <path d="M40 40 Q56 32 72 36" fill="none" stroke="${line}" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M40 40 Q56 32 72 36" fill="none" stroke="url(#oro)" stroke-width="3" stroke-linecap="round"/>

  <!-- occhio con trucco egizio -->
  <path d="M64 42 Q70 38 77 41 Q71 46 64 42 Z" fill="#FFF6DA" stroke="${line}" stroke-width="1.6"/>
  <circle cx="71.5" cy="41.8" r="2.3" fill="${gold}"/>
  <circle cx="72" cy="41.8" r="1.1" fill="${line}"/>
  <path d="M64 42 L55 45" stroke="${gold}" stroke-width="2" stroke-linecap="round"/>
  <path d="M63 38 Q70 34 77 38" fill="none" stroke="${line}" stroke-width="1.6"/>
  `;
  return { width: 112, height: 160, body };
}
