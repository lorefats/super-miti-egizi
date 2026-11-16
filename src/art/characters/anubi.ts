import { PALETTE, css } from '../palette';

/**
 * Anubi in stile chibi, girato verso destra (per sinistra si specchia).
 * I piedi toccano il fondo dell'immagine: il personaggio va posizionato con origine (0.5, 1).
 */
export function anubiSvg(): { width: number; height: number; body: string } {
  const line = css(PALETTE.bluNotte);
  const gold = css(PALETTE.oro);
  const goldDark = css(PALETTE.oroOmbra);
  const turq = css(PALETTE.turchese);
  const lapis = css(PALETTE.lapislazzuli);
  const fur = '#2B2D42';
  const furLight = '#3D405B';
  const s = `stroke="${line}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;

  const body = `
  <!-- orecchio dietro -->
  <path d="M34 40 L30 4 L54 30 Z" fill="${fur}" ${s}/>
  <!-- braccio dietro -->
  <rect x="31" y="78" width="12" height="24" rx="6" fill="${fur}" ${s}/>
  <!-- gambe e sandali -->
  <rect x="45" y="112" width="11" height="18" rx="4" fill="${fur}" ${s}/>
  <rect x="62" y="112" width="11" height="18" rx="4" fill="${fur}" ${s}/>
  <rect x="42" y="126" width="17" height="8" rx="4" fill="${gold}" ${s}/>
  <rect x="60" y="126" width="17" height="8" rx="4" fill="${gold}" ${s}/>
  <!-- gonnellino bianco -->
  <path d="M40 98 L78 98 L86 120 L32 120 Z" fill="#FDF6E3" ${s}/>
  <path d="M59 100 L59 118" stroke="#D9CBB0" stroke-width="3"/>
  <!-- busto -->
  <rect x="40" y="74" width="38" height="28" rx="12" fill="${fur}" ${s}/>
  <!-- cintura -->
  <rect x="38" y="94" width="42" height="9" rx="3" fill="${gold}" ${s}/>
  <rect x="55" y="94" width="8" height="9" fill="${turq}" stroke="${line}" stroke-width="2"/>
  <!-- collare usekh -->
  <path d="M38 76 Q59 102 80 76 Z" fill="${gold}" ${s}/>
  <path d="M44 80 Q59 96 74 80" fill="none" stroke="${turq}" stroke-width="4"/>
  <path d="M48 83 Q59 92 70 83" fill="none" stroke="${lapis}" stroke-width="3"/>
  <!-- braccio davanti con bracciale -->
  <rect x="74" y="80" width="12" height="24" rx="6" fill="${fur}" ${s}/>
  <rect x="73" y="92" width="14" height="6" rx="2" fill="${gold}" stroke="${line}" stroke-width="2"/>
  <!-- testa -->
  <ellipse cx="56" cy="54" rx="28" ry="24" fill="${fur}" ${s}/>
  <!-- muso lungo -->
  <path d="M68 44 Q90 46 106 58 Q104 68 92 68 L70 68 Z" fill="${fur}" ${s}/>
  <ellipse cx="104" cy="59" rx="6" ry="5" fill="#0B0B14" stroke="${line}" stroke-width="3"/>
  <path d="M80 66 Q90 70 98 66" fill="none" stroke="${furLight}" stroke-width="3"/>
  <!-- riflesso sulla testa -->
  <path d="M40 42 Q46 34 56 34" fill="none" stroke="${furLight}" stroke-width="4"/>
  <!-- orecchio davanti -->
  <path d="M48 34 L60 0 L72 36 Z" fill="${fur}" ${s}/>
  <path d="M55 30 L60 12 L66 32 Z" fill="${gold}"/>
  <!-- fascia d'oro sulla testa -->
  <path d="M32 50 Q50 40 70 44" fill="none" stroke="${gold}" stroke-width="5"/>
  <path d="M32 50 Q50 40 70 44" fill="none" stroke="${goldDark}" stroke-width="1.5"/>
  <!-- occhio -->
  <path d="M60 54 Q68 46 78 52 Q70 60 60 54 Z" fill="#FFFFFF" stroke="${line}" stroke-width="2.5"/>
  <circle cx="70" cy="53" r="3.6" fill="${gold}"/>
  <circle cx="71" cy="53" r="1.8" fill="${line}"/>
  <path d="M60 54 L50 57" stroke="${gold}" stroke-width="3"/>
  `;
  return { width: 112, height: 136, body };
}
