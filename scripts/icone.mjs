// Disegna le icone del gioco (per "Aggiungi a Home") partendo dal logo del sarcofago in src/art/logo.ts.
// Si lancia con:  npm run icone
// Scrive le immagini PNG in public/icone/ (vanno poi salvate nel progetto con git).
import { mkdir } from 'node:fs/promises';
import { createServer } from 'vite';
import sharp from 'sharp';

const OUT = 'public/icone';

// carica i disegni TypeScript del gioco usando Vite (così non si copia niente)
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const logo = await vite.ssrLoadModule('/src/art/logo.ts');
const { PALETTE, css } = await vite.ssrLoadModule('/src/art/palette.ts');
await vite.close();

const { LOGO_SIZE } = logo;
const caseArt = logo.logoCaseSvg();
const lidArt = logo.logoLidSvg();
const raysArt = logo.logoRaysSvg();

/**
 * Icona quadrata 512×512: cielo blu con raggi d'oro e il sarcofago un po' storto.
 * `logoHeight` = quanto è alto il sarcofago; `round` = angoli arrotondati (no per le icone "maskable").
 */
function iconSvg({ logoHeight, round, background = true }) {
  const S = 512;
  const k = logoHeight / LOGO_SIZE.height;
  const lx = S / 2 - (LOGO_SIZE.width * k) / 2;
  const ly = S / 2 - (LOGO_SIZE.height * k) / 2;
  const bg = background
    ? `<defs><radialGradient id="cielo" cx="50%" cy="42%" r="70%">
         <stop offset="0" stop-color="${css(PALETTE.lapislazzuli)}"/><stop offset="1" stop-color="${css(PALETTE.bluNotte)}"/>
       </radialGradient></defs>
       <rect width="${S}" height="${S}" rx="${round ? 112 : 0}" fill="url(#cielo)"/>
       <g transform="translate(${S / 2 - 260} ${S / 2 - 330}) scale(1.3)">${raysArt.body}</g>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${bg}
    <g transform="rotate(-6 ${S / 2} ${S / 2}) translate(${lx} ${ly}) scale(${k})">
      ${caseArt.body}
      ${lidArt.body}
    </g>
  </svg>`;
}

async function save(svg, size, name) {
  await sharp(Buffer.from(svg), { density: 72 * (size / 512) * 2 })
    .resize(size, size)
    .png()
    .toFile(`${OUT}/${name}`);
  console.log(`  ${OUT}/${name}`);
}

await mkdir(OUT, { recursive: true });
console.log('Icone disegnate:');
const normal = iconSvg({ logoHeight: 430, round: true });
// "maskable": Android può ritagliarla a cerchio, quindi il sarcofago sta più dentro e lo sfondo arriva ai bordi
const maskable = iconSvg({ logoHeight: 320, round: false });
// iPhone: niente angoli trasparenti (li arrotonda lui)
const apple = iconSvg({ logoHeight: 400, round: false });
// solo il sarcofago, senza sfondo: per la schermata di avvio
const bare = iconSvg({ logoHeight: 480, round: false, background: false });

await save(normal, 192, 'icona-192.png');
await save(normal, 512, 'icona-512.png');
await save(maskable, 512, 'icona-maskable-512.png');
await save(apple, 180, 'apple-touch-icon.png');
await save(normal, 64, 'favicon-64.png');
await save(bare, 256, 'logo-avvio.png');
