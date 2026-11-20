// Mappe del gioco: dimensioni e posizione degli ostacoli.
import type { ObstacleKind } from '../entities/Obstacle';

/** Tipi di terreno delle zone. */
export type GroundKind = 'sabbia' | 'roccia' | 'lastre' | 'asfalto' | 'bazar' | 'erba' | 'oasi';

/** Una zona della mappa (rettangolo con nome, terreno e colore per la minimappa). */
export interface ZoneData {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ground: GroundKind;
  /** colore nella minimappa */
  color: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Acqua: rallenta chi ci cammina; se ha una corrente, trascina (pixel al secondo). */
export interface WaterRect extends Rect {
  flow?: { x: number; y: number };
}

export interface MapData {
  /** Nome della mappa (si vede all'inizio della partita). */
  name?: string;
  width: number;
  height: number;
  /** Punto di partenza del giocatore. */
  spawn: { x: number; y: number };
  /** Punti di partenza dei bot (servono almeno tanti punti quanti sono i bot). */
  botSpawns?: { x: number; y: number }[];
  /** x = centro, y = punto in cui l'oggetto tocca terra (base). */
  obstacles: { kind: ObstacleKind; x: number; y: number }[];
  /** Piramidi grandi in cui si entra (x = centro, y = base davanti, dove c'è la porta). */
  bigPyramids?: { x: number; y: number }[];
  /** Bauli del tesoro (x, y = base). */
  chests?: { x: number; y: number }[];
  /** Centro del cerchio sicuro della tempesta (di solito il centro della mappa). */
  stormCenter?: { x: number; y: number };
  /** Bersagli fermi d'allenamento (x, y = base). */
  targets: { x: number; y: number }[];
  /** Zone con nome e terreno proprio. */
  zones?: ZoneData[];
  /** Acqua (rallenta chi ci cammina; il fiume trascina). */
  water?: WaterRect[];
  /** Ponti di legno sopra l'acqua: lì si cammina all'asciutto. */
  bridges?: Rect[];
  /** Isolotti d'erba in mezzo all'acqua: lì si cammina all'asciutto. */
  islands?: Rect[];
  /** Cespugli dove nascondersi: ogni gruppo è fatto di più ciuffi vicini. */
  bushes?: { kind: 'papiro' | 'tenda'; spots: { x: number; y: number }[] }[];
  /** Cammelli che camminano piano avanti e indietro tra due punti. */
  camels?: { x1: number; y1: number; x2: number; y2: number }[];
  /** Tempesta di questa mappa (se manca si usano i valori di STORM). */
  storm?: { startRadius: number; endRadius: number; shrinkSeconds: number };
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
    // piramide piccola (quella grande in cui si entra è in bigPyramids)
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
  bigPyramids: [{ x: 1600, y: 1350 }],
  chests: [
    // due dentro la piramide grande: un premio per chi entra
    { x: 1350, y: 1260 },
    { x: 1850, y: 1260 },
    { x: 700, y: 620 },
    { x: 1300, y: 460 },
    { x: 2300, y: 460 },
    { x: 2950, y: 560 },
    { x: 380, y: 1350 },
    { x: 1000, y: 1460 },
    { x: 2250, y: 1380 },
    { x: 600, y: 2000 },
    { x: 1600, y: 2250 },
    { x: 1900, y: 1900 },
    { x: 2500, y: 1900 },
    { x: 3000, y: 2250 },
  ],
  stormCenter: { x: 1600, y: 1550 },
  targets: [],
};
