// La seconda mappa "Il Grande Nilo" (GAME_DESIGN.md, sezione 3): il Nilo scorre in mezzo da ovest a est
// e la corrente trascina chi nuota. Ci sono ponti, feluche e isolotti di papiro; sulle due rive villaggi,
// templi e palmeti. Come per la Valle, gli oggetti sparsi li mette un generatore con un seme fisso
// (stessa mappa ogni volta), controllando che non si sovrappongano e che non finiscano in acqua.
import type { ObstacleKind } from '../entities/Obstacle';
import type { MapData, Rect, WaterRect, ZoneData } from './maps';

const W = 5200;
const H = 4400;
const C = W / 3; // una colonna di zone
/** fascia del fiume (con le rive d'erba) */
const RIVER_TOP = 1750;
const RIVER_BOTTOM = 2650;

/** Il fiume: corrente verso est (pixel al secondo). */
const NILE: WaterRect = { x: 0, y: 1900, w: W, h: 600, flow: { x: 95, y: 0 } };

/** Ponti di legno da riva a riva (larghi 200: la misura del disegno). */
const BRIDGES: Rect[] = [800, 2500, 4200].map((x) => ({ x, y: NILE.y - 30, w: 200, h: NILE.h + 60 }));

/** L'isola grande in mezzo (ci passa sopra il ponte centrale) e gli isolotti di papiro. */
const BIG_ISLAND: Rect = { x: 2150, y: 2030, w: 900, h: 340 };
const ISLANDS: Rect[] = [
  BIG_ISLAND,
  { x: 280, y: 2150, w: 280, h: 190 },
  { x: 1480, y: 2070, w: 330, h: 220 },
  { x: 3480, y: 2110, w: 320, h: 210 },
  { x: 4680, y: 2050, w: 290, h: 200 },
];

/** Ingombro approssimato di ogni oggetto (raggio in pixel), per non metterli uno sopra l'altro. */
const SPACE: Partial<Record<ObstacleKind | 'baule' | 'cespuglio', number>> = {
  blocco: 75,
  masso: 75,
  colonna: 50,
  obelisco: 50,
  palma: 45,
  lanterna: 30,
  carretto: 95,
  sarcofago: 100,
  pozzo: 75,
  statua: 85,
  tappeto0: 95,
  tappeto1: 95,
  tappeto2: 95,
  duna: 150,
  casa0: 135,
  casa1: 135,
  casa2: 135,
  baule: 65,
  cespuglio: 80,
};

const ZONES: ZoneData[] = [
  { name: 'Villaggio dei Pescatori', x: 0, y: 0, w: C, h: RIVER_TOP, ground: 'sabbia', color: 0xe9c46a },
  { name: 'Tempio di Luxor', x: C, y: 0, w: C, h: RIVER_TOP, ground: 'lastre', color: 0xe2d2ab },
  { name: 'Palmeto', x: 2 * C, y: 0, w: C, h: RIVER_TOP, ground: 'oasi', color: 0xe6c46e },
  { name: 'Il Grande Nilo', x: 0, y: RIVER_TOP, w: W, h: RIVER_BOTTOM - RIVER_TOP, ground: 'erba', color: 0x8dbb5a },
  { name: 'Campi di papiro', x: 0, y: RIVER_BOTTOM, w: C, h: H - RIVER_BOTTOM, ground: 'erba', color: 0x9cc76a },
  { name: 'Mercato sul Nilo', x: C, y: RIVER_BOTTOM, w: C, h: H - RIVER_BOTTOM, ground: 'bazar', color: 0xc2844c },
  { name: 'Tempio di Kom Ombo', x: 2 * C, y: RIVER_BOTTOM, w: C, h: H - RIVER_BOTTOM, ground: 'lastre', color: 0xd8c8a0 },
];

function buildNile(): MapData {
  let seed = 1789;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const between = (a: number, b: number) => a + rnd() * (b - a);

  const obstacles: { kind: ObstacleKind; x: number; y: number }[] = [];
  const chests: { x: number; y: number }[] = [];
  const bushes: MapData['bushes'] = [];
  const taken: { x: number; y: number; r: number }[] = [];
  /** zone da lasciare libere: acqua, ponti (e le loro entrate), piazze */
  const keepOut: Rect[] = [NILE, ...BRIDGES.map((b) => ({ x: b.x - 40, y: b.y - 160, w: b.w + 80, h: b.h + 320 }))];

  const inRect = (x: number, y: number, r: Rect, pad = 0) =>
    x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
  const free = (x: number, y: number, r: number) =>
    taken.every((t) => Math.hypot(t.x - x, t.y - y) > t.r + r) && keepOut.every((k) => !inRect(x, y, k, r * 0.6));

  const put = (kind: ObstacleKind, x: number, y: number, r = SPACE[kind] ?? 80) => {
    obstacles.push({ kind, x, y });
    taken.push({ x, y, r });
  };
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
  const bushGroup = (kind: 'papiro' | 'tenda', spots: { x: number; y: number }[]) => {
    bushes.push({ kind, spots });
    for (const sp of spots) taken.push({ x: sp.x, y: sp.y, r: SPACE.cespuglio! });
  };
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
      bushGroup(kind, spots);
      g++;
    }
  };

  // i punti di partenza restano liberi
  for (const sp of SPAWNS) taken.push({ x: sp.x, y: sp.y, r: 90 });

  // ------------------------------------------------ il fiume: feluche, isole e isolotti
  for (const [x, y] of [[1250, 2450], [1950, 1990], [3300, 1990], [3950, 2450], [5000, 2450]]) put('feluca', x, y, 120);
  for (const isl of ISLANDS.slice(1)) {
    const cx = isl.x + isl.w / 2;
    const cy = isl.y + isl.h / 2 + 30;
    bushGroup('papiro', [{ x: cx - 60, y: cy }, { x: cx + 60, y: cy - 10 }]);
  }
  // isola grande: due colonne, due bauli e il papiro alle punte (il ponte passa in mezzo)
  put('colonna', 2300, 2140);
  put('colonna', 2900, 2140);
  bushGroup('papiro', [{ x: 2230, y: 2290 }, { x: 2320, y: 2320 }]);
  bushGroup('papiro', [{ x: 2880, y: 2320 }, { x: 2970, y: 2290 }]);
  chests.push({ x: 2420, y: 2250 }, { x: 2780, y: 2250 });
  // le rive d'erba
  scatter('palma', { x: 0, y: RIVER_TOP, w: W, h: NILE.y - RIVER_TOP }, 9);
  scatter('palma', { x: 0, y: NILE.y + NILE.h, w: W, h: RIVER_BOTTOM - NILE.y - NILE.h }, 9);
  scatterBushes('papiro', { x: 0, y: RIVER_TOP - 120, w: W, h: NILE.y - RIVER_TOP + 140 }, 5);
  scatterBushes('papiro', { x: 0, y: NILE.y + NILE.h - 20, w: W, h: RIVER_BOTTOM - NILE.y - NILE.h + 140 }, 5);

  // ------------------------------------------------ Villaggio dei Pescatori (nord-ovest)
  const houses: [number, number][] = [
    [260, 380], [660, 380], [1060, 380], [1460, 380],
    [260, 860], [1460, 860],
    [460, 1300], [1060, 1300], [1460, 1340],
  ];
  houses.forEach(([x, y], i) => put((['casa0', 'casa1', 'casa2'] as const)[i % 3], x, y));
  put('pozzo', 860, 860);
  keepOut.push({ x: 680, y: 700, w: 360, h: 300 }); // la piazzetta del pozzo
  scatter('carretto', { x: 60, y: 60, w: C - 120, h: RIVER_TOP - 120 }, 3);
  scatter('palma', { x: 60, y: 60, w: C - 120, h: RIVER_TOP - 120 }, 5);
  scatterBushes('tenda', { x: 60, y: 60, w: C - 120, h: RIVER_TOP - 120 }, 3);

  // ------------------------------------------------ Tempio di Luxor (nord)
  // muro d'ingresso con la porta in mezzo
  for (const x of [2000, 2250, 2950, 3200]) put('muroTempio', x, 330, 140);
  // sala delle colonne
  for (const x of [2300, 2450, 2750, 2900]) for (const y of [580, 790, 1000]) put('colonna', x, y);
  put('obelisco', 2480, 1200);
  put('obelisco', 2720, 1200);
  // viale delle statue verso il fiume
  for (const y of [1400, 1600]) {
    put('statua', 2350, y);
    put('statua', 2850, y);
  }
  scatter(['blocco', 'masso'], { x: C + 60, y: 60, w: C - 120, h: RIVER_TOP - 120 }, 8);
  scatterBushes('papiro', { x: C + 40, y: 400, w: C - 80, h: RIVER_TOP - 500 }, 2);

  // ------------------------------------------------ Palmeto (nord-est)
  put('pozzo', 4330, 900);
  scatter('duna', { x: 2 * C + 60, y: 60, w: C - 120, h: RIVER_TOP - 120 }, 3);
  scatter('palma', { x: 2 * C + 60, y: 60, w: C - 120, h: RIVER_TOP - 120 }, 22);
  scatterBushes('papiro', { x: 2 * C + 40, y: 40, w: C - 80, h: RIVER_TOP - 80 }, 4);

  // ------------------------------------------------ Campi di papiro (sud-ovest)
  put('casa1', 420, 3950);
  put('casa0', 1320, 3500);
  scatterBushes('papiro', { x: 40, y: RIVER_BOTTOM + 40, w: C - 80, h: H - RIVER_BOTTOM - 80 }, 13);
  scatter('palma', { x: 60, y: RIVER_BOTTOM + 60, w: C - 120, h: H - RIVER_BOTTOM - 120 }, 6);
  scatter('carretto', { x: 60, y: RIVER_BOTTOM + 60, w: C - 120, h: H - RIVER_BOTTOM - 120 }, 2);

  // ------------------------------------------------ Mercato sul Nilo (sud)
  for (const [i, x] of [2080, 2600, 3120].entries()) {
    for (const [j, y] of [3000, 3550, 4080].entries()) {
      if ((i + j) % 3 === 1) continue; // qualche piazzetta libera
      put((['bancarella0', 'bancarella1', 'bancarella2'] as const)[(i + j) % 3], x, y, 120);
    }
  }
  scatterBushes('tenda', { x: C + 40, y: RIVER_BOTTOM + 40, w: C - 80, h: H - RIVER_BOTTOM - 80 }, 5);
  scatter(['tappeto0', 'tappeto1', 'tappeto2'], { x: C + 60, y: RIVER_BOTTOM + 60, w: C - 120, h: H - RIVER_BOTTOM - 120 }, 5);
  scatter('lanterna', { x: C + 60, y: RIVER_BOTTOM + 60, w: C - 120, h: H - RIVER_BOTTOM - 120 }, 8);

  // ------------------------------------------------ Tempio di Kom Ombo (sud-est)
  for (const x of [3780, 4030, 4670, 4920]) {
    put('muroTempio', x, 2960, 140);
    put('muroTempio', x, 4120, 140);
  }
  for (const x of [3950, 4100, 4560, 4710]) for (const y of [3250, 3480, 3710]) put('colonna', x, y);
  put('obelisco', 4330, 3150);
  put('statua', 4330, 3880);
  scatter('sarcofago', { x: 2 * C + 60, y: RIVER_BOTTOM + 60, w: C - 120, h: H - RIVER_BOTTOM - 120 }, 3);
  scatter(['masso', 'blocco'], { x: 2 * C + 60, y: RIVER_BOTTOM + 60, w: C - 120, h: H - RIVER_BOTTOM - 120 }, 5);

  // ------------------------------------------------ bauli sulle due rive
  for (const z of ZONES) if (z.name !== 'Il Grande Nilo') scatterChests(z, 5);

  return {
    name: 'Il Grande Nilo',
    width: W,
    height: H,
    spawn: SPAWNS[0],
    botSpawns: SPAWNS.slice(1),
    obstacles,
    chests,
    stormCenter: { x: BIG_ISLAND.x + BIG_ISLAND.w / 2, y: BIG_ISLAND.y + BIG_ISLAND.h / 2 },
    storm: { startRadius: 3600, endRadius: 300, shrinkSeconds: 140 },
    zones: ZONES,
    water: [NILE],
    bridges: BRIDGES,
    islands: ISLANDS,
    bushes,
    camels: [
      { x1: 3800, y1: 1350, x2: 4500, y2: 1350 },
      { x1: 4400, y1: 400, x2: 5000, y2: 400 },
    ],
    targets: [],
  };
}

/** Punti di partenza: cinque per riva, lontani dal fiume (il primo è quello del giocatore). */
const SPAWNS = [
  { x: 2600, y: 4280 },
  { x: 160, y: 160 },
  { x: 1733, y: 160 },
  { x: 5040, y: 160 },
  { x: 860, y: 1560 },
  { x: 4330, y: 1560 },
  { x: 160, y: 4280 },
  { x: 5040, y: 4280 },
  { x: 1733, y: 2860 },
  { x: 3467, y: 2860 },
];

/** La mappa del Nilo, uguale a ogni partita. */
export const MAPPA_NILO: MapData = buildNile();
