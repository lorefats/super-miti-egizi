// La mappa grande "Valle dei Due Egitti" (GAME_DESIGN.md, sezione 3).
// I punti di riferimento sono messi a mano; gli oggetti sparsi li mette un generatore con numeri
// "a caso ma sempre uguali" (stesso seme = stessa mappa ogni volta), controllando che non si sovrappongano.
import type { ObstacleKind } from '../entities/Obstacle';
import type { MapData, Rect, ZoneData } from './maps';

const M = 5600;
const T = M / 3; // un terzo della mappa

/** Ingombro approssimato di ogni oggetto (raggio in pixel), per non metterli uno sopra l'altro. */
const SPACE: Partial<Record<ObstacleKind | 'baule' | 'cespuglio', number>> = {
  blocco: 75,
  bloccoLungo: 125,
  masso: 75,
  colonna: 50,
  palma: 45,
  torciaPalo: 30,
  lanterna: 30,
  lampione: 30,
  taxi: 95,
  carretto: 95,
  sarcofago: 100,
  pozzo: 75,
  statua: 85,
  tappeto0: 95,
  tappeto1: 95,
  tappeto2: 95,
  duna: 150,
  baule: 65,
  cespuglio: 80,
};

export const ZONE_GIZA: ZoneData = { name: 'Piana di Giza', x: 0, y: 0, w: T, h: T, ground: 'sabbia', color: 0xe9c46a };
const ZONES: ZoneData[] = [
  ZONE_GIZA,
  { name: 'Valle dei Re', x: T, y: 0, w: T, h: T, ground: 'roccia', color: 0xc9a06a },
  { name: 'Oasi del deserto', x: 2 * T, y: 0, w: T, h: T, ground: 'oasi', color: 0xe6c46e },
  { name: 'Tempio di Karnak', x: 0, y: T, w: T, h: T, ground: 'lastre', color: 0xe2d2ab },
  { name: 'Cairo moderno', x: T, y: T, w: T, h: T, ground: 'asfalto', color: 0xa49d90 },
  { name: 'Bazar del Cairo', x: 2 * T, y: T, w: T, h: T, ground: 'bazar', color: 0xc2844c },
  { name: 'Rive del Nilo', x: 0, y: 2 * T, w: M, h: T, ground: 'erba', color: 0x8dbb5a },
];

const NILE: Rect = { x: 0, y: 4300, w: M, h: 500 };
const POND: Rect = { x: 4400, y: 650, w: 600, h: 380 };

function buildValley(): MapData {
  let seed = 2024;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const between = (a: number, b: number) => a + rnd() * (b - a);

  const obstacles: { kind: ObstacleKind; x: number; y: number }[] = [];
  const chests: { x: number; y: number }[] = [];
  const bushes: MapData['bushes'] = [];
  /** cose già messe: punto + raggio */
  const taken: { x: number; y: number; r: number }[] = [];
  /** zone da lasciare libere (grandi monumenti, piazze, sentieri) */
  const keepOut: Rect[] = [];

  const inRect = (x: number, y: number, r: Rect, pad = 0) =>
    x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
  const free = (x: number, y: number, r: number, allowWater = false) =>
    taken.every((t) => Math.hypot(t.x - x, t.y - y) > t.r + r) &&
    keepOut.every((k) => !inRect(x, y, k, r * 0.5)) &&
    (allowWater || (!inRect(x, y, NILE, r * 0.6) && !inRect(x, y, POND, r * 0.8)));

  /** Mette un oggetto in un punto preciso (punti di riferimento). */
  const put = (kind: ObstacleKind, x: number, y: number, r = SPACE[kind] ?? 80) => {
    obstacles.push({ kind, x, y });
    taken.push({ x, y, r });
  };
  /** Sparge `count` oggetti a caso dentro un rettangolo, senza sovrapporli. */
  const scatter = (kind: ObstacleKind | ObstacleKind[], area: Rect, count: number) => {
    for (let i = 0, tries = 0; i < count && tries < count * 40; tries++) {
      const k = Array.isArray(kind) ? kind[Math.floor(rnd() * kind.length)] : kind;
      const r = SPACE[k] ?? 80;
      const x = between(area.x + r, area.x + area.w - r);
      const y = between(area.y + r, area.y + area.h - r);
      if (!free(x, y, r)) continue;
      put(k, x, y, r);
      i++;
    }
  };
  const scatterChests = (area: Rect, count: number) => {
    const r = SPACE.baule!;
    for (let i = 0, tries = 0; i < count && tries < count * 40; tries++) {
      const x = between(area.x + 120, area.x + area.w - 120);
      const y = between(area.y + 120, area.y + area.h - 120);
      if (!free(x, y, r + 40)) continue;
      chests.push({ x, y });
      taken.push({ x, y, r });
      i++;
    }
  };
  /** Gruppi di cespugli (2-4 ciuffi vicini). */
  const scatterBushes = (kind: 'papiro' | 'tenda', area: Rect, groups: number) => {
    const r = SPACE.cespuglio!;
    for (let g = 0, tries = 0; g < groups && tries < groups * 40; tries++) {
      const cx = between(area.x + 150, area.x + area.w - 150);
      const cy = between(area.y + 150, area.y + area.h - 150);
      if (!free(cx, cy, r * 1.6)) continue;
      const spots = [{ x: cx, y: cy }];
      const n = 1 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        spots.push({ x: cx + Math.cos(a) * 85, y: cy + Math.sin(a) * 55 });
      }
      bushes.push({ kind, spots });
      for (const sp of spots) taken.push({ x: sp.x, y: sp.y, r });
      g++;
    }
  };

  // ------------------------------------------------ Piana di Giza (nord-ovest)
  keepOut.push({ x: 420, y: 740, w: 960, h: 520 }); // piramide grande + spazio davanti alla porta
  put('piramideAlta', 560, 470, 330);
  put('piramideAlta', 1480, 640, 330);
  put('sfinge', 1450, 1560, 200);
  keepOut.push({ x: 1220, y: 1440, w: 460, h: 160 });
  scatter(['blocco', 'blocco', 'bloccoLungo'], { x: 60, y: 60, w: T - 120, h: T - 120 }, 12);

  // ------------------------------------------------ Valle dei Re (nord)
  for (const x of [2100, 2550, 3000, 3450]) {
    put('rupeTomba', x, 430, 175);
    put('torciaPalo', x - 120, 470);
    put('torciaPalo', x + 120, 470);
  }
  scatter('sarcofago', { x: T + 80, y: 600, w: T - 160, h: T - 700 }, 5);
  scatter('masso', { x: T + 60, y: 560, w: T - 120, h: T - 620 }, 12);
  scatter('torciaPalo', { x: T + 100, y: 700, w: T - 200, h: T - 800 }, 5);

  // ------------------------------------------------ Oasi del deserto (nord-est)
  const pondCx = POND.x + POND.w / 2;
  const pondCy = POND.y + POND.h / 2;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    put('palma', pondCx + Math.cos(a) * 420, pondCy + Math.sin(a) * 290 + 40);
  }
  put('pozzo', 4100, 1450);
  scatter('duna', { x: 2 * T + 60, y: 60, w: T - 120, h: T - 120 }, 5);
  scatter('palma', { x: 2 * T + 60, y: 60, w: T - 120, h: T - 120 }, 6);
  bushes.push({ kind: 'papiro', spots: [{ x: POND.x + 40, y: POND.y + POND.h + 40 }, { x: POND.x + 120, y: POND.y + POND.h + 60 }] });
  bushes.push({ kind: 'papiro', spots: [{ x: POND.x + POND.w - 60, y: POND.y - 20 }, { x: POND.x + POND.w + 20, y: POND.y + 40 }] });

  // ------------------------------------------------ Tempio di Karnak (ovest)
  const kTop = T + 190;
  const kBottom = 2 * T - 140;
  const kLeft = 200;
  const kRight = T - 230;
  // muri nord e sud (porta in mezzo)
  for (const x of [330, 590, 1250, 1510]) {
    put('muroTempio', x, kTop, 140);
    put('muroTempio', x, kBottom, 140);
  }
  // muri ovest ed est fatti di blocchi in colonna (porta a metà)
  for (let y = kTop + 50; y <= kBottom - 10; y += 44) {
    const gate = y > 2700 && y < 2920;
    if (gate) continue;
    put('bloccoTempio', kLeft, y, 30);
    put('bloccoTempio', kRight, y, 30);
  }
  // sala delle colonne
  for (let cx = 0; cx < 5; cx++) for (let cy = 0; cy < 3; cy++) put('colonna', 480 + cx * 210, 2330 + cy * 250);
  put('obelisco', 780, kTop + 150);
  put('obelisco', 1080, kTop + 150);
  // cortile interno stretto
  put('muroTempio', 470, 3080, 140);
  put('muroTempio', 1410, 3080, 140);
  put('statua', 560, 3330);
  put('statua', 1300, 3330);
  put('statua', 930, 3420);

  // ------------------------------------------------ Cairo moderno (centro): torre e palazzi
  put('torre', 2800, 2850, 140);
  keepOut.push({ x: 2520, y: 2560, w: 560, h: 520 }); // piazza attorno alla torre
  const palazzi: [number, number][] = [
    [2150, 2150], [2560, 2150], [3050, 2150], [3450, 2150],
    [2150, 2700], [3450, 2700],
    [2150, 3300], [2560, 3560], [3050, 3560], [3450, 3300],
  ];
  palazzi.forEach(([x, y], i) => put((['palazzo0', 'palazzo1', 'palazzo2'] as const)[i % 3], x, y, 150));
  scatter('taxi', { x: T + 60, y: T + 60, w: T - 120, h: T - 120 }, 7);
  scatter('lampione', { x: T + 60, y: T + 60, w: T - 120, h: T - 120 }, 12);

  // ------------------------------------------------ Bazar del Cairo (est)
  for (const [i, x] of [3980, 4420, 4860, 5300].entries()) {
    for (const [j, y] of [2150, 2700, 3250].entries()) {
      if ((i + j) % 4 === 3) continue; // qualche piazzetta libera
      put((['bancarella0', 'bancarella1', 'bancarella2'] as const)[(i + j) % 3], x, y, 120);
    }
  }
  scatterBushes('tenda', { x: 2 * T + 40, y: T + 40, w: T - 80, h: T - 80 }, 7);
  scatter(['tappeto0', 'tappeto1', 'tappeto2'], { x: 2 * T + 60, y: T + 60, w: T - 120, h: T - 120 }, 7);
  scatter('carretto', { x: 2 * T + 60, y: T + 60, w: T - 120, h: T - 120 }, 4);
  scatter('lanterna', { x: 2 * T + 60, y: T + 60, w: T - 120, h: T - 120 }, 10);

  // ------------------------------------------------ Rive del Nilo (sud)
  for (const [x, y] of [[700, 4640], [2000, 4560], [3300, 4680], [4600, 4560], [5300, 4700]]) {
    obstacles.push({ kind: 'feluca', x, y });
    taken.push({ x, y, r: 120 });
  }
  scatterBushes('papiro', { x: 60, y: 3900, w: M - 120, h: 420 }, 9); // riva nord
  scatterBushes('papiro', { x: 60, y: 4820, w: M - 120, h: 740 }, 14); // riva sud: campi di papiro
  scatter('palma', { x: 60, y: 3780, w: M - 120, h: 450 }, 8);
  scatter('palma', { x: 60, y: 4850, w: M - 120, h: 700 }, 8);
  scatter(['masso', 'blocco'], { x: 60, y: 3780, w: M - 120, h: 1800 }, 10);

  // ------------------------------------------------ bauli in tutte le zone
  for (const z of ZONES.slice(0, 6)) scatterChests(z, 5);
  scatterChests({ x: 0, y: 3780, w: M, h: 480 }, 4);
  scatterChests({ x: 0, y: 4840, w: M, h: 700 }, 5);

  return {
    name: 'Valle dei Due Egitti',
    width: M,
    height: M,
    spawn: { x: 2800, y: 5300 },
    botSpawns: [
      { x: 300, y: 300 },
      { x: 2800, y: 1150 },
      { x: 5300, y: 300 },
      { x: 360, y: 2800 },
      { x: 2800, y: 2420 },
      { x: 5350, y: 2950 },
      { x: 500, y: 4050 },
      { x: 4950, y: 4050 },
      { x: 1300, y: 5350 },
      { x: 4200, y: 5350 },
    ],
    obstacles,
    bigPyramids: [{ x: 900, y: 1150 }],
    chests,
    stormCenter: { x: 2800, y: 2800 },
    storm: { startRadius: 4100, endRadius: 320, shrinkSeconds: 150 },
    zones: ZONES,
    water: [NILE, POND],
    bushes,
    camels: [
      { x1: 3950, y1: 1250, x2: 4450, y2: 1250 },
      { x1: 4650, y1: 1600, x2: 5350, y2: 1600 },
      { x1: 4000, y1: 300, x2: 4700, y2: 300 },
    ],
    targets: [],
  };
}

/** La mappa grande, uguale a ogni partita. */
export const MAPPA_VALLE: MapData = buildValley();
