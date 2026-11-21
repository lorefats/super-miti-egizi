// Modalità Allenamento (GAME_DESIGN.md, sezione 2): mappa piccola con bersagli fermi per provare i personaggi.
// Niente bot, niente tempesta, niente coppe: si prova e basta.
import type { MapData } from './maps';

export const TRAINING = {
  /** secondi prima che un bersaglio distrutto torni su */
  targetRespawnSeconds: 3,
};

const W = 2400;
const H = 1600;

/** "Cortile del Tempio": il posto dove gli dèi si allenano. */
export const MAPPA_ALLENAMENTO: MapData = {
  name: 'Cortile del Tempio',
  width: W,
  height: H,
  spawn: { x: 700, y: 820 },
  zones: [
    { name: 'Cortile del Tempio', x: 0, y: 0, w: W, h: H, ground: 'lastre', color: 0xd8c08a },
    { name: 'Giardino', x: 1650, y: 0, w: W - 1650, h: H, ground: 'erba', color: 0x7fb069 },
  ],
  obstacles: [
    // colonne lungo i bordi, come un tempio
    ...[200, 500, 800, 1100, 1400].map((x) => ({ kind: 'colonna' as const, x, y: 140 })),
    ...[200, 500, 800, 1100, 1400].map((x) => ({ kind: 'colonna' as const, x, y: H - 80 })),
    // un muretto con un bersaglio dietro (per provare i lanci sopra i muri)
    { kind: 'bloccoLungo', x: 1250, y: 1150 },
    // ripari per provare a nascondersi e girare attorno
    { kind: 'blocco', x: 1050, y: 520 },
    { kind: 'masso', x: 400, y: 1250 },
    { kind: 'statua', x: 1450, y: 330 },
    // giardino
    { kind: 'palma', x: 1900, y: 250 },
    { kind: 'palma', x: 2250, y: 520 },
    { kind: 'palma', x: 2200, y: 1400 },
    { kind: 'torciaPalo', x: 560, y: 600 },
    { kind: 'torciaPalo', x: 560, y: 1050 },
  ],
  // laghetto: chi ci cammina va più piano
  water: [{ x: 1900, y: 850, w: 380, h: 260 }],
  // ciuffi di papiro per provare a nascondersi
  bushes: [
    {
      kind: 'papiro',
      spots: [
        { x: 1850, y: 560 },
        { x: 1950, y: 600 },
        { x: 1880, y: 670 },
      ],
    },
  ],
  targets: [
    // tre vicini tra loro: per i colpi ad area e le super
    { x: 1050, y: 820 },
    { x: 1140, y: 900 },
    { x: 1140, y: 740 },
    // uno lontano: per le armi a lunga gittata
    { x: 1600, y: 820 },
    // dietro il muretto
    { x: 1250, y: 1300 },
    // nel giardino, vicino al papiro e al laghetto
    { x: 2100, y: 680 },
    { x: 2080, y: 1250 },
  ],
};
