// Mappe del gioco: dimensioni e posizione degli ostacoli.
import type { ObstacleKind } from '../entities/Obstacle';

export interface MapData {
  width: number;
  height: number;
  spawn: { x: number; y: number };
  /** x = centro, y = punto in cui l'oggetto tocca terra (base). */
  obstacles: { kind: ObstacleKind; x: number; y: number }[];
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
};
