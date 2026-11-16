// Mappe del gioco: dimensioni e posizione degli ostacoli.
import type { ObstacleKind } from '../entities/Obstacle';

export interface MapData {
  width: number;
  height: number;
  /** Punto di partenza del giocatore. */
  spawn: { x: number; y: number };
  /** Punti di partenza dei bot (servono almeno tanti punti quanti sono i bot). */
  botSpawns?: { x: number; y: number }[];
  /** x = centro, y = punto in cui l'oggetto tocca terra (base). */
  obstacles: { kind: ObstacleKind; x: number; y: number }[];
  /** Bersagli fermi d'allenamento (x, y = base). */
  targets: { x: number; y: number }[];
}

/** Piccola mappa di prova del Passo 1. */
export const MAPPA_PROVA: MapData = {
  width: 2400,
  height: 1600,
  spawn: { x: 900, y: 900 },
  obstacles: [
    { kind: 'piramide', x: 1650, y: 640 },
    { kind: 'blocco', x: 600, y: 560 },
    { kind: 'blocco', x: 700, y: 560 },
    { kind: 'bloccoLungo', x: 1150, y: 1180 },
    { kind: 'blocco', x: 420, y: 1120 },
    { kind: 'blocco', x: 1300, y: 860 },
    { kind: 'bloccoLungo', x: 1900, y: 1150 },
    { kind: 'blocco', x: 2000, y: 1250 },
    { kind: 'blocco', x: 300, y: 300 },
    { kind: 'bloccoLungo', x: 1000, y: 300 },
    { kind: 'blocco', x: 2150, y: 400 },
    { kind: 'blocco', x: 700, y: 1400 },
  ],
  targets: [
    { x: 1150, y: 760 },
    { x: 1250, y: 1000 },
    { x: 620, y: 860 },
  ],
};

/** Mappa media per la partita Solo del Passo 3 (tu + 5 bot). */
export const MAPPA_MEDIA: MapData = {
  width: 3200,
  height: 2400,
  spawn: { x: 1600, y: 2000 },
  botSpawns: [
    { x: 450, y: 450 },
    { x: 1600, y: 380 },
    { x: 2800, y: 1250 },
    { x: 2750, y: 2100 },
    { x: 400, y: 1500 },
  ],
  obstacles: [
    // piramidi
    { kind: 'piramide', x: 1600, y: 1300 },
    { kind: 'piramide', x: 2650, y: 720 },
    // nord-ovest
    { kind: 'blocco', x: 800, y: 400 },
    { kind: 'blocco', x: 900, y: 400 },
    { kind: 'bloccoLungo', x: 500, y: 800 },
    { kind: 'blocco', x: 1100, y: 750 },
    // nord
    { kind: 'bloccoLungo', x: 1500, y: 650 },
    { kind: 'blocco', x: 2000, y: 300 },
    { kind: 'blocco', x: 2000, y: 400 },
    // ovest
    { kind: 'blocco', x: 300, y: 1150 },
    { kind: 'bloccoLungo', x: 800, y: 1300 },
    { kind: 'blocco', x: 700, y: 1750 },
    { kind: 'blocco', x: 800, y: 1750 },
    // centro
    { kind: 'blocco', x: 1150, y: 1550 },
    { kind: 'blocco', x: 2100, y: 1550 },
    { kind: 'bloccoLungo', x: 1600, y: 1650 },
    // est
    { kind: 'bloccoLungo', x: 2350, y: 1150 },
    { kind: 'blocco', x: 2950, y: 1000 },
    { kind: 'blocco', x: 2600, y: 1600 },
    { kind: 'blocco', x: 2700, y: 1600 },
    // sud
    { kind: 'bloccoLungo', x: 1100, y: 2100 },
    { kind: 'blocco', x: 2100, y: 2050 },
    { kind: 'blocco', x: 2200, y: 2150 },
    { kind: 'blocco', x: 400, y: 2150 },
    { kind: 'bloccoLungo', x: 2950, y: 1800 },
  ],
  targets: [],
};
